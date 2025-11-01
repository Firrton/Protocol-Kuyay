// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KuyayVault
 * @author Kuyay Protocol
 * @notice Tesorería del protocolo - gestiona liquidez de LPs y préstamos a Circles
 *
 * MODELO:
 * - LPs depositan stablecoins y ganan yield
 * - Circles autorizados (solo Modo Crédito) piden préstamos
 * - Intereses de repagos van a los LPs
 * - Defaults cubiertos por: colateral del Circle + pool de seguros
 */
contract KuyayVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;             // Stablecoin (USDC)
    uint256 public totalAssets;                // Total depositado por LPs
    uint256 public totalLoaned;                // Total prestado a Circles
    uint256 public totalInterestEarned;        // Intereses acumulados
    uint256 public insurancePool;              // Pool para cubrir defaults
    uint256 public originationFeeBps = 300;    // Fee de originación (3%)
    address public treasury;                   // Dirección que recibe fees

    // ✅ FIX: Sistema de shares para accounting correcto
    uint256 public totalShares;                // Total de shares emitidas
    mapping(address => uint256) public shares; // LP => shares owned

    mapping(address => bool) public authorizedCircles;
    mapping(address => bool) public authorizedFactories;
    mapping(address => Loan) public loans;           // Circle => préstamo activo

    struct Loan {
        uint256 principal;        // Monto prestado
        uint256 interestRate;     // Tasa anual en basis points (1000 = 10%)
        uint48 startTime;         // Timestamp de inicio
        uint48 duration;          // Duración en segundos
        uint256 paid;             // Monto ya repagado
        bool isActive;            // Préstamo activo o no
    }

    event Deposit(address indexed lp, uint256 amount, uint256 newBalance);
    event Withdraw(address indexed lp, uint256 amount, uint256 newBalance);
    event LoanIssued(address indexed circle, uint256 principal, uint256 interestRate, uint256 duration);
    event LoanRepayment(address indexed circle, uint256 amount, uint256 remainingDebt);
    event LoanLiquidated(address indexed circle, uint256 recoveredAmount, uint256 lossAmount);
    event CircleAuthorized(address indexed circle);
    event CircleRevoked(address indexed circle);
    event FactoryAuthorized(address indexed factory);
    event FactoryRevoked(address indexed factory);
    event OriginationFeeUpdated(uint256 newFeeBps);
    event TreasuryUpdated(address indexed newTreasury);
    event InsurancePoolFunded(uint256 amount);

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

    constructor(address _asset, address _treasury) Ownable(msg.sender) {
        if (_asset == address(0) || _treasury == address(0)) revert InvalidAddress();

        asset = IERC20(_asset);
        treasury = _treasury;
    }

    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        uint256 sharesToMint;
        if (totalShares == 0) {
            sharesToMint = amount;
        } else {
            uint256 vaultValue = totalAssets + totalInterestEarned;
            sharesToMint = (amount * totalShares) / vaultValue;
        }

        asset.safeTransferFrom(msg.sender, address(this), amount);

        shares[msg.sender] += sharesToMint;
        totalShares += sharesToMint;
        totalAssets += amount;

        emit Deposit(msg.sender, amount, shares[msg.sender]);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (totalShares == 0) revert InvalidAmount();

        uint256 vaultValue = totalAssets + totalInterestEarned;
        if (vaultValue == 0) revert InvalidAmount();

        uint256 userBalance = (shares[msg.sender] * vaultValue) / totalShares;

        if (userBalance < amount) revert InsufficientBalance();

        uint256 available = totalAssets - totalLoaned;
        if (available < amount) revert InsufficientLiquidity();

        uint256 sharesToBurn = (amount * totalShares) / vaultValue;

        shares[msg.sender] -= sharesToBurn;
        totalShares -= sharesToBurn;
        totalAssets -= amount;

        asset.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount, shares[msg.sender]);
    }

    function balanceOf(address lp) external view returns (uint256) {
        if (totalShares == 0) return 0;

        uint256 vaultValue = totalAssets + totalInterestEarned;
        return (shares[lp] * vaultValue) / totalShares;
    }

    // Circle solicita préstamo (solo Circles autorizados)
    function requestLoan(
        uint256 amount,
        uint256 durationInDays,
        uint256 interestRateBps
    ) external onlyAuthorizedCircle nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (loans[msg.sender].isActive) revert LoanAlreadyActive();

        uint256 available = totalAssets - totalLoaned;
        if (available < amount) revert InsufficientLiquidity();

        uint256 originationFee = (amount * originationFeeBps) / 10000;
        uint256 netAmount = amount - originationFee;

        loans[msg.sender] = Loan({
            principal: amount,
            interestRate: interestRateBps,
            startTime: uint48(block.timestamp),
            duration: uint48(durationInDays * 1 days),
            paid: 0,
            isActive: true
        });

        totalLoaned += amount;

        if (originationFee > 0) {
            asset.safeTransfer(treasury, originationFee);
        }

        asset.safeTransfer(msg.sender, netAmount);

        emit LoanIssued(msg.sender, amount, interestRateBps, durationInDays * 1 days);
    }

    // Circle repaga su préstamo
    function repayLoan(uint256 amount) external onlyAuthorizedCircle nonReentrant {
        Loan storage loan = loans[msg.sender];
        if (!loan.isActive) revert NoActiveLoan();
        if (amount == 0) revert InvalidAmount();

        asset.safeTransferFrom(msg.sender, address(this), amount);
        loan.paid += amount;

        uint256 totalDebt = calculateTotalDebt(msg.sender);
        uint256 remainingDebt = totalDebt > loan.paid ? totalDebt - loan.paid : 0;

        if (remainingDebt == 0) {
            totalLoaned -= loan.principal;
            loan.isActive = false;
        }

        if (loan.paid > loan.principal) {
            uint256 interestPortion = loan.paid - loan.principal;
            totalInterestEarned += interestPortion;
        }

        emit LoanRepayment(msg.sender, amount, remainingDebt);
    }

    // Liquida un Circle en default
    // El Circle debe transferir su colateral antes de llamar esto
    function liquidateCircle(address circleAddress, uint256 collateralRecovered)
        external
        onlyOwner
        nonReentrant
    {
        Loan storage loan = loans[circleAddress];
        if (!loan.isActive) revert NoActiveLoan();

        uint256 totalDebt = calculateTotalDebt(circleAddress);
        uint256 unpaidDebt = totalDebt > loan.paid ? totalDebt - loan.paid : 0;

        loan.isActive = false;
        totalLoaned -= loan.principal;

        uint256 loss = 0;
        if (collateralRecovered < unpaidDebt) {
            loss = unpaidDebt - collateralRecovered;

            if (insurancePool >= loss) {
                insurancePool -= loss;
                loss = 0;
            } else {
                loss -= insurancePool;
                insurancePool = 0;
                totalAssets -= loss;
            }
        }

        emit LoanLiquidated(circleAddress, collateralRecovered, loss);
    }

    // Calcula deuda total de un Circle (principal + interés acumulado)
    function calculateTotalDebt(address circleAddress) public view returns (uint256) {
        Loan memory loan = loans[circleAddress];
        if (!loan.isActive) return 0;

        uint256 timeElapsed = block.timestamp - loan.startTime;
        if (timeElapsed > loan.duration) {
            timeElapsed = loan.duration;
        }

        uint256 interest = (loan.principal * loan.interestRate * timeElapsed) / (10000 * 365 days);
        uint256 totalDebt = loan.principal + interest;

        // Return remaining debt (total debt minus what has been paid)
        return totalDebt > loan.paid ? totalDebt - loan.paid : 0;
    }

    function availableLiquidity() external view returns (uint256) {
        return totalAssets > totalLoaned ? totalAssets - totalLoaned : 0;
    }

    function getLoan(address circleAddress) external view returns (Loan memory) {
        return loans[circleAddress];
    }

    // APY actual para LPs basado en préstamos activos
    function currentAPY() external view returns (uint256) {
        if (totalAssets == 0) return 0;
        return (totalLoaned * 1000) / totalAssets;
    }

    // Autoriza un Circle para pedir préstamos (solo factory u owner)
    function authorizeCircle(address circleAddress) external {
        if (!authorizedFactories[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedFactory();
        }
        if (circleAddress == address(0)) revert InvalidAddress();

        authorizedCircles[circleAddress] = true;
        emit CircleAuthorized(circleAddress);
    }

    function revokeCircle(address circleAddress) external onlyOwner {
        authorizedCircles[circleAddress] = false;
        emit CircleRevoked(circleAddress);
    }

    function authorizeFactory(address factoryAddress) external onlyOwner {
        if (factoryAddress == address(0)) revert InvalidAddress();
        authorizedFactories[factoryAddress] = true;
        emit FactoryAuthorized(factoryAddress);
    }

    function revokeFactory(address factoryAddress) external onlyOwner {
        authorizedFactories[factoryAddress] = false;
        emit FactoryRevoked(factoryAddress);
    }

    function setOriginationFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > 1000) revert InvalidParameter();
        originationFeeBps = newFeeBps;
        emit OriginationFeeUpdated(newFeeBps);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function fundInsurancePool(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        asset.safeTransferFrom(msg.sender, address(this), amount);
        insurancePool += amount;
        totalAssets += amount;

        emit InsurancePoolFunded(amount);
    }

    modifier onlyAuthorizedCircle() {
        if (!authorizedCircles[msg.sender]) revert NotAuthorizedCircle();
        _;
    }
}
