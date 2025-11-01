//!
//! Kuyay Protocol - Vault (Stylus/Rust Implementation)
//!
//! Tesorería del protocolo - gestiona liquidez de LPs y préstamos a Circles
//! Optimizado con Stylus para máximo gas savings
//!

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    block,
    call::Call,
    evm,
    msg,
    prelude::*,
    storage::{StorageAddress, StorageBool, StorageMap, StorageU256},
};

// Interfaz para ERC20 (llamadas al asset token)
stylus_sdk::sol_interface! {
    interface IERC20 {
        function transferFrom(address from, address to, uint256 amount) external returns (bool);
        function transfer(address to, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
    }
}

// Estructura de Loan
#[derive(Default)]
pub struct Loan {
    principal: U256,
    interest_rate: U256, // basis points
    start_time: u64,
    duration: u64,
    paid: U256,
    is_active: bool,
}

sol_storage! {
    #[entrypoint]
    pub struct KuyayVault {
        // Core state
        address asset;
        address owner;
        address treasury;

        // Financial state
        uint256 total_assets;
        uint256 total_loaned;
        uint256 total_interest_earned;
        uint256 insurance_pool;
        uint256 total_shares;

        // Configuration
        uint256 origination_fee_bps;  // 300 = 3%

        // Mappings
        StorageMap<Address, StorageU256> shares;
        StorageMap<Address, StorageBool> authorized_circles;
        StorageMap<Address, StorageBool> authorized_factories;

        // Loan storage - packed for gas efficiency
        StorageMap<Address, StorageU256> loan_principal;
        StorageMap<Address, StorageU256> loan_interest_rate;
        StorageMap<Address, StorageU256> loan_start_time;
        StorageMap<Address, StorageU256> loan_duration;
        StorageMap<Address, StorageU256> loan_paid;
        StorageMap<Address, StorageBool> loan_is_active;
    }
}

// Events
stylus_sdk::sol! {
    event Deposit(address indexed lp, uint256 amount, uint256 shares_minted);
    event Withdraw(address indexed lp, uint256 amount, uint256 shares_burned);
    event LoanIssued(address indexed circle, uint256 principal, uint256 interest_rate, uint256 duration);
    event LoanRepayment(address indexed circle, uint256 amount, uint256 remaining_debt);
    event LoanLiquidated(address indexed circle, uint256 recovered_amount, uint256 loss_amount);
    event CircleAuthorized(address indexed circle);
    event CircleRevoked(address indexed circle);
    event FactoryAuthorized(address indexed factory);
    event FactoryRevoked(address indexed factory);
    event OriginationFeeUpdated(uint256 new_fee_bps);
    event TreasuryUpdated(address indexed new_treasury);
    event InsurancePoolFunded(uint256 amount);
    event OwnershipTransferred(address indexed previous_owner, address indexed new_owner);

    error Unauthorized();
    error NotAuthorizedCircle();
    error NotAuthorizedFactory();
    error InsufficientLiquidity();
    error InsufficientBalance();
    error LoanAlreadyActive();
    error NoActiveLoan();
    error InvalidAmount();
    error InvalidAddress();
    error InvalidParameter();
    error TransferFailed();
    error AlreadyInitialized();
}

#[public]
impl KuyayVault {
    /// Initialize the vault
    pub fn initialize(&mut self, asset_address: Address, treasury_address: Address) -> Result<(), Vec<u8>> {
        if self.owner.get() != Address::ZERO {
            return Err(AlreadyInitialized {}.encode());
        }

        if asset_address == Address::ZERO || treasury_address == Address::ZERO {
            return Err(InvalidAddress {}.encode());
        }

        self.asset.set(asset_address);
        self.treasury.set(treasury_address);
        self.owner.set(msg::sender());
        self.origination_fee_bps.set(U256::from(300)); // 3%

        Ok(())
    }

    /// Deposit assets and receive shares (optimized for gas)
    pub fn deposit(&mut self, amount: U256) -> Result<U256, Vec<u8>> {
        if amount == U256::ZERO {
            return Err(InvalidAmount {}.encode());
        }

        // Calculate shares to mint (uses storage caching - virtually free on re-access)
        let shares_to_mint = self.calculate_shares_for_deposit(amount)?;

        // Transfer tokens from user
        let asset = IERC20::new(self.asset.get());
        let success = asset
            .transfer_from(self, msg::sender(), contract::address(), amount)
            .map_err(|_| TransferFailed {}.encode())?;

        if !success {
            return Err(TransferFailed {}.encode());
        }

        // Update state (storage caching makes multiple writes cheaper)
        let sender = msg::sender();
        let mut user_shares = self.shares.setter(sender);
        let current_shares = user_shares.get();
        user_shares.set(current_shares + shares_to_mint);

        self.total_shares.set(self.total_shares.get() + shares_to_mint);
        self.total_assets.set(self.total_assets.get() + amount);

        evm::log(Deposit {
            lp: sender,
            amount,
            shares_minted: shares_to_mint,
        });

        Ok(shares_to_mint)
    }

    /// Withdraw assets by burning shares (optimized)
    pub fn withdraw(&mut self, amount: U256) -> Result<(), Vec<u8>> {
        if amount == U256::ZERO {
            return Err(InvalidAmount {}.encode());
        }

        let sender = msg::sender();

        // Get vault value and user balance (storage caching optimization)
        let vault_value = self.get_vault_value();
        let total_shares = self.total_shares.get();

        if total_shares == U256::ZERO || vault_value == U256::ZERO {
            return Err(InvalidAmount {}.encode());
        }

        let user_shares = self.shares.get(sender);
        let user_balance = (user_shares * vault_value) / total_shares;

        if user_balance < amount {
            return Err(InsufficientBalance {}.encode());
        }

        // Check liquidity
        let available = self.available_liquidity();
        if available < amount {
            return Err(InsufficientLiquidity {}.encode());
        }

        // Calculate shares to burn
        let shares_to_burn = (amount * total_shares) / vault_value;

        // Update state
        let mut user_shares_setter = self.shares.setter(sender);
        user_shares_setter.set(user_shares - shares_to_burn);

        self.total_shares.set(total_shares - shares_to_burn);
        self.total_assets.set(self.total_assets.get() - amount);

        // Transfer tokens
        let asset = IERC20::new(self.asset.get());
        let success = asset
            .transfer(self, sender, amount)
            .map_err(|_| TransferFailed {}.encode())?;

        if !success {
            return Err(TransferFailed {}.encode());
        }

        evm::log(Withdraw {
            lp: sender,
            amount,
            shares_burned: shares_to_burn,
        });

        Ok(())
    }

    /// Batch deposit for multiple LPs (Stylus exclusive feature)
    pub fn batch_deposit(&mut self, lps: Vec<Address>, amounts: Vec<U256>) -> Result<Vec<U256>, Vec<u8>> {
        if lps.len() != amounts.len() {
            return Err(InvalidParameter {}.encode());
        }

        let mut shares_minted = Vec::new();

        for i in 0..lps.len() {
            let lp = lps[i];
            let amount = amounts[i];

            if amount == U256::ZERO {
                shares_minted.push(U256::ZERO);
                continue;
            }

            // Storage caching makes this loop extremely cheap
            let shares = self.calculate_shares_for_deposit(amount)?;

            let mut lp_shares = self.shares.setter(lp);
            lp_shares.set(lp_shares.get() + shares);

            self.total_shares.set(self.total_shares.get() + shares);
            self.total_assets.set(self.total_assets.get() + amount);

            shares_minted.push(shares);

            evm::log(Deposit {
                lp,
                amount,
                shares_minted: shares,
            });
        }

        Ok(shares_minted)
    }

    /// Request loan (only authorized circles)
    pub fn request_loan(
        &mut self,
        amount: U256,
        duration_in_days: U256,
        interest_rate_bps: U256,
    ) -> Result<U256, Vec<u8>> {
        self.only_authorized_circle()?;

        if amount == U256::ZERO {
            return Err(InvalidAmount {}.encode());
        }

        let circle = msg::sender();

        if self.loan_is_active.get(circle) {
            return Err(LoanAlreadyActive {}.encode());
        }

        // Check liquidity
        let available = self.available_liquidity();
        if available < amount {
            return Err(InsufficientLiquidity {}.encode());
        }

        // Calculate origination fee
        let fee_bps = self.origination_fee_bps.get();
        let origination_fee = (amount * fee_bps) / U256::from(10000);
        let net_amount = amount - origination_fee;

        // Convert duration to seconds (optimized multiplication)
        let duration_seconds = duration_in_days * U256::from(86400);

        // Store loan data (packed storage)
        self.loan_principal.setter(circle).set(amount);
        self.loan_interest_rate.setter(circle).set(interest_rate_bps);
        self.loan_start_time.setter(circle).set(U256::from(block::timestamp()));
        self.loan_duration.setter(circle).set(duration_seconds);
        self.loan_paid.setter(circle).set(U256::ZERO);
        self.loan_is_active.setter(circle).set(true);

        self.total_loaned.set(self.total_loaned.get() + amount);

        // Transfer fee to treasury
        if origination_fee > U256::ZERO {
            let asset = IERC20::new(self.asset.get());
            let _ = asset.transfer(self, self.treasury.get(), origination_fee)
                .map_err(|_| TransferFailed {}.encode())?;
        }

        // Transfer net amount to circle
        let asset = IERC20::new(self.asset.get());
        let _ = asset.transfer(self, circle, net_amount)
            .map_err(|_| TransferFailed {}.encode())?;

        evm::log(LoanIssued {
            circle,
            principal: amount,
            interest_rate: interest_rate_bps,
            duration: duration_seconds,
        });

        Ok(net_amount)
    }

    /// Repay loan (optimized interest calculation)
    pub fn repay_loan(&mut self, amount: U256) -> Result<(), Vec<u8>> {
        self.only_authorized_circle()?;

        let circle = msg::sender();

        if !self.loan_is_active.get(circle) {
            return Err(NoActiveLoan {}.encode());
        }

        if amount == U256::ZERO {
            return Err(InvalidAmount {}.encode());
        }

        // Transfer tokens from circle
        let asset = IERC20::new(self.asset.get());
        let _ = asset.transfer_from(self, circle, contract::address(), amount)
            .map_err(|_| TransferFailed {}.encode())?;

        // Update paid amount
        let mut loan_paid = self.loan_paid.setter(circle);
        loan_paid.set(loan_paid.get() + amount);

        // Calculate total debt (uses efficient Rust arithmetic)
        let total_debt = self.calculate_total_debt(circle)?;
        let paid = loan_paid.get();
        let remaining_debt = if total_debt > paid {
            total_debt - paid
        } else {
            U256::ZERO
        };

        // If fully paid, mark as inactive
        if remaining_debt == U256::ZERO {
            let principal = self.loan_principal.get(circle);
            self.total_loaned.set(self.total_loaned.get() - principal);
            self.loan_is_active.setter(circle).set(false);
        }

        // Track interest earned
        let principal = self.loan_principal.get(circle);
        if paid > principal {
            let interest = paid - principal;
            self.total_interest_earned.set(self.total_interest_earned.get() + interest);
        }

        evm::log(LoanRepayment {
            circle,
            amount,
            remaining_debt,
        });

        Ok(())
    }

    /// Liquidate circle (only owner)
    pub fn liquidate_circle(&mut self, circle_address: Address, collateral_recovered: U256) -> Result<(), Vec<u8>> {
        self.only_owner()?;

        if !self.loan_is_active.get(circle_address) {
            return Err(NoActiveLoan {}.encode());
        }

        let total_debt = self.calculate_total_debt(circle_address)?;
        let paid = self.loan_paid.get(circle_address);
        let unpaid_debt = if total_debt > paid {
            total_debt - paid
        } else {
            U256::ZERO
        };

        // Mark loan as inactive
        self.loan_is_active.setter(circle_address).set(false);
        let principal = self.loan_principal.get(circle_address);
        self.total_loaned.set(self.total_loaned.get() - principal);

        // Calculate loss
        let mut loss = U256::ZERO;
        if collateral_recovered < unpaid_debt {
            loss = unpaid_debt - collateral_recovered;

            // Try to cover from insurance pool
            let insurance = self.insurance_pool.get();
            if insurance >= loss {
                self.insurance_pool.set(insurance - loss);
                loss = U256::ZERO;
            } else {
                loss = loss - insurance;
                self.insurance_pool.set(U256::ZERO);
                self.total_assets.set(self.total_assets.get() - loss);
            }
        }

        evm::log(LoanLiquidated {
            circle: circle_address,
            recovered_amount: collateral_recovered,
            loss_amount: loss,
        });

        Ok(())
    }

    // ========== VIEW FUNCTIONS ==========

    pub fn balance_of(&self, lp: Address) -> U256 {
        let total_shares = self.total_shares.get();
        if total_shares == U256::ZERO {
            return U256::ZERO;
        }

        let vault_value = self.get_vault_value();
        let user_shares = self.shares.get(lp);

        (user_shares * vault_value) / total_shares
    }

    pub fn calculate_total_debt(&self, circle: Address) -> Result<U256, Vec<u8>> {
        if !self.loan_is_active.get(circle) {
            return Ok(U256::ZERO);
        }

        let principal = self.loan_principal.get(circle);
        let rate = self.loan_interest_rate.get(circle);
        let start_time = self.loan_start_time.get(circle);
        let duration = self.loan_duration.get(circle);
        let paid = self.loan_paid.get(circle);

        // Calculate time elapsed (clamped to duration)
        let current_time = U256::from(block::timestamp());
        let mut time_elapsed = if current_time > start_time {
            current_time - start_time
        } else {
            U256::ZERO
        };

        if time_elapsed > duration {
            time_elapsed = duration;
        }

        // Calculate interest: (principal * rate * time) / (10000 * 365 days)
        // Optimized calculation using Rust's native arithmetic
        let seconds_per_year = U256::from(31536000); // 365 * 24 * 60 * 60
        let interest = (principal * rate * time_elapsed) / (U256::from(10000) * seconds_per_year);

        let total_debt = principal + interest;

        if total_debt > paid {
            Ok(total_debt - paid)
        } else {
            Ok(U256::ZERO)
        }
    }

    pub fn available_liquidity(&self) -> U256 {
        let total = self.total_assets.get();
        let loaned = self.total_loaned.get();

        if total > loaned {
            total - loaned
        } else {
            U256::ZERO
        }
    }

    pub fn get_loan(&self, circle: Address) -> (U256, U256, U256, U256, U256, bool) {
        (
            self.loan_principal.get(circle),
            self.loan_interest_rate.get(circle),
            self.loan_start_time.get(circle),
            self.loan_duration.get(circle),
            self.loan_paid.get(circle),
            self.loan_is_active.get(circle),
        )
    }

    pub fn current_apy(&self) -> U256 {
        let total = self.total_assets.get();
        if total == U256::ZERO {
            return U256::ZERO;
        }

        let loaned = self.total_loaned.get();
        (loaned * U256::from(1000)) / total
    }

    pub fn owner(&self) -> Address {
        self.owner.get()
    }

    pub fn asset(&self) -> Address {
        self.asset.get()
    }

    pub fn treasury(&self) -> Address {
        self.treasury.get()
    }

    pub fn total_assets(&self) -> U256 {
        self.total_assets.get()
    }

    pub fn total_loaned(&self) -> U256 {
        self.total_loaned.get()
    }

    pub fn total_shares(&self) -> U256 {
        self.total_shares.get()
    }

    pub fn insurance_pool(&self) -> U256 {
        self.insurance_pool.get()
    }

    pub fn total_interest_earned(&self) -> U256 {
        self.total_interest_earned.get()
    }

    // ========== ADMIN FUNCTIONS ==========

    pub fn authorize_circle(&mut self, circle: Address) -> Result<(), Vec<u8>> {
        // Can be called by factory or owner
        if !self.authorized_factories.get(msg::sender()) && msg::sender() != self.owner.get() {
            return Err(NotAuthorizedFactory {}.encode());
        }

        if circle == Address::ZERO {
            return Err(InvalidAddress {}.encode());
        }

        self.authorized_circles.setter(circle).set(true);
        evm::log(CircleAuthorized { circle });
        Ok(())
    }

    pub fn revoke_circle(&mut self, circle: Address) -> Result<(), Vec<u8>> {
        self.only_owner()?;
        self.authorized_circles.setter(circle).set(false);
        evm::log(CircleRevoked { circle });
        Ok(())
    }

    pub fn authorize_factory(&mut self, factory: Address) -> Result<(), Vec<u8>> {
        self.only_owner()?;

        if factory == Address::ZERO {
            return Err(InvalidAddress {}.encode());
        }

        self.authorized_factories.setter(factory).set(true);
        evm::log(FactoryAuthorized { factory });
        Ok(())
    }

    pub fn revoke_factory(&mut self, factory: Address) -> Result<(), Vec<u8>> {
        self.only_owner()?;
        self.authorized_factories.setter(factory).set(false);
        evm::log(FactoryRevoked { factory });
        Ok(())
    }

    pub fn set_origination_fee(&mut self, new_fee_bps: U256) -> Result<(), Vec<u8>> {
        self.only_owner()?;

        if new_fee_bps > U256::from(1000) {
            return Err(InvalidParameter {}.encode());
        }

        self.origination_fee_bps.set(new_fee_bps);
        evm::log(OriginationFeeUpdated { new_fee_bps });
        Ok(())
    }

    pub fn set_treasury(&mut self, new_treasury: Address) -> Result<(), Vec<u8>> {
        self.only_owner()?;

        if new_treasury == Address::ZERO {
            return Err(InvalidAddress {}.encode());
        }

        self.treasury.set(new_treasury);
        evm::log(TreasuryUpdated { new_treasury });
        Ok(())
    }

    pub fn fund_insurance_pool(&mut self, amount: U256) -> Result<(), Vec<u8>> {
        if amount == U256::ZERO {
            return Err(InvalidAmount {}.encode());
        }

        let asset = IERC20::new(self.asset.get());
        let _ = asset.transfer_from(self, msg::sender(), contract::address(), amount)
            .map_err(|_| TransferFailed {}.encode())?;

        self.insurance_pool.set(self.insurance_pool.get() + amount);
        self.total_assets.set(self.total_assets.get() + amount);

        evm::log(InsurancePoolFunded { amount });
        Ok(())
    }

    pub fn transfer_ownership(&mut self, new_owner: Address) -> Result<(), Vec<u8>> {
        self.only_owner()?;

        if new_owner == Address::ZERO {
            return Err(InvalidAddress {}.encode());
        }

        let previous_owner = self.owner.get();
        self.owner.set(new_owner);

        evm::log(OwnershipTransferred { previous_owner, new_owner });
        Ok(())
    }

    // ========== INTERNAL FUNCTIONS ==========

    fn only_owner(&self) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(Unauthorized {}.encode());
        }
        Ok(())
    }

    fn only_authorized_circle(&self) -> Result<(), Vec<u8>> {
        if !self.authorized_circles.get(msg::sender()) {
            return Err(NotAuthorizedCircle {}.encode());
        }
        Ok(())
    }

    fn get_vault_value(&self) -> U256 {
        self.total_assets.get() + self.total_interest_earned.get()
    }

    fn calculate_shares_for_deposit(&self, amount: U256) -> Result<U256, Vec<u8>> {
        let total_shares = self.total_shares.get();

        if total_shares == U256::ZERO {
            Ok(amount)
        } else {
            let vault_value = self.get_vault_value();
            if vault_value == U256::ZERO {
                return Err(InvalidAmount {}.encode());
            }
            Ok((amount * total_shares) / vault_value)
        }
    }
}
