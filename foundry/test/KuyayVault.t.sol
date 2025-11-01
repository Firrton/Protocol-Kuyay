// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseTest.sol";

contract KuyayVaultTest is BaseTest {

    address public lp1;
    address public lp2;
    address public lp3;

    function setUp() public override {
        super.setUp();

        lp1 = makeAddr("lp1");
        lp2 = makeAddr("lp2");
        lp3 = makeAddr("lp3");

        usdc.mint(lp1, 200000 * 10**6);
        usdc.mint(lp2, 50000 * 10**6);
        usdc.mint(lp3, 30000 * 10**6);
    }

    function test_DepositAndBalanceOf() public {
        vm.startPrank(lp1);
        usdc.approve(address(vault), 10000 * 10**6);
        vault.deposit(10000 * 10**6);
        vm.stopPrank();

        assertEq(vault.balanceOf(lp1), 10000 * 10**6);
        assertEq(vault.totalAssets(), 510000 * 10**6);
    }

    function test_WithdrawCorrectAmount() public {
        vm.startPrank(lp1);
        usdc.approve(address(vault), 10000 * 10**6);
        vault.deposit(10000 * 10**6);

        uint256 balanceBefore = usdc.balanceOf(lp1);

        vault.withdraw(5000 * 10**6);
        vm.stopPrank();

        assertEq(usdc.balanceOf(lp1), balanceBefore + 5000 * 10**6);
        assertEq(vault.balanceOf(lp1), 5000 * 10**6);
    }

    function test_MultipleDepositsSharesCalculation() public {
        vm.prank(lp1);
        usdc.approve(address(vault), 10000 * 10**6);
        vm.prank(lp1);
        vault.deposit(10000 * 10**6);

        uint256 lp1SharesBefore = vault.shares(lp1);

        vault.totalInterestEarned();
        vm.prank(address(this));
        vault.fundInsurancePool(5000 * 10**6);

        vm.prank(lp2);
        usdc.approve(address(vault), 10000 * 10**6);
        vm.prank(lp2);
        vault.deposit(10000 * 10**6);

        uint256 lp2Shares = vault.shares(lp2);

        assertTrue(lp1SharesBefore > lp2Shares);
    }

    function test_YieldDistributionAfterLoanRepayment() public {
        vm.prank(lp1);
        usdc.approve(address(vault), 50000 * 10**6);
        vm.prank(lp1);
        vault.deposit(50000 * 10**6);

        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        Circle creditCircle = _createCreditCircle(members);
        _depositGuarantees(creditCircle, members);

        uint256 loanAmount = creditCircle.protocolLoan();
        assertGt(loanAmount, 0);

        _payCurrentRound(creditCircle, members);
        _fulfillVRF(creditCircle);

        uint256 lp1BalanceAfterRepayment = vault.balanceOf(lp1);
        assertGe(lp1BalanceAfterRepayment, 50000 * 10**6);
    }

    function test_WithdrawAfterEarningYield() public {
        vm.prank(lp1);
        usdc.approve(address(vault), 20000 * 10**6);
        vm.prank(lp1);
        vault.deposit(20000 * 10**6);

        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        Circle creditCircle = _createCreditCircle(members);
        _depositGuarantees(creditCircle, members);

        for (uint256 i = 0; i < 3; i++) {
            _payCurrentRound(creditCircle, members);
            _fulfillVRF(creditCircle);
        }

        uint256 finalBalance = vault.balanceOf(lp1);
        assertGe(finalBalance, 20000 * 10**6);

        uint256 usdcBefore = usdc.balanceOf(lp1);

        vm.prank(lp1);
        vault.withdraw(finalBalance);

        uint256 usdcAfter = usdc.balanceOf(lp1);
        assertEq(usdcAfter - usdcBefore, finalBalance);
    }

    function test_RevertIfInsufficientBalance() public {
        vm.prank(lp1);
        usdc.approve(address(vault), 10000 * 10**6);
        vm.prank(lp1);
        vault.deposit(10000 * 10**6);

        vm.prank(lp1);
        vm.expectRevert(KuyayVault.InsufficientBalance.selector);
        vault.withdraw(15000 * 10**6);
    }

    function test_RevertIfInsufficientLiquidity() public {
        // Create a large loan to reduce available liquidity
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        // Create multiple circles to loan out most of the vault's liquidity
        // Max 5 circles per user, so create 5 circles
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(alice);
            Circle creditCircle = Circle(factory.createCreditCircle(
                members,
                10000 * 10**6,
                1000 * 10**6
            ));

            for (uint256 j = 0; j < members.length; j++) {
                vm.startPrank(members[j]);
                usdc.approve(address(creditCircle), 10000 * 10**6);
                creditCircle.depositGuarantee();
                vm.stopPrank();
            }
        }

        uint256 availableLiquidity = vault.availableLiquidity();

        // Owner (who has most shares from initial 500k deposit) tries to withdraw more than available
        vm.expectRevert(KuyayVault.InsufficientLiquidity.selector);
        vault.withdraw(availableLiquidity + 1000 * 10**6);
    }

    function test_InsurancePoolFunding() public {
        uint256 insuranceBefore = vault.insurancePool();

        usdc.approve(address(vault), 10000 * 10**6);
        vault.fundInsurancePool(10000 * 10**6);

        assertEq(vault.insurancePool(), insuranceBefore + 10000 * 10**6);
    }

    function test_OriginationFeeDeduction() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        Circle creditCircle = _createCreditCircle(members);

        uint256 treasuryBefore = usdc.balanceOf(treasury);

        _depositGuarantees(creditCircle, members);

        uint256 treasuryAfter = usdc.balanceOf(treasury);
        assertGt(treasuryAfter, treasuryBefore);
    }
}
