// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseTest.sol";

contract CircleTest is BaseTest {

    Circle public circle;
    address[] public members;

    function setUp() public override {
        super.setUp();

        members.push(alice);
        members.push(bob);
        members.push(charlie);

        _mintAguayosForUsers(members);

        circle = _createSavingsCircle(members);

        _depositGuarantees(circle, members);
    }

    function test_CreateCircleAndActivate() public {
        assertEq(uint(circle.status()), uint(Circle.CircleStatus.ACTIVE));
        assertEq(circle.currentRound(), 1);
        assertEq(circle.totalCollateral(), DEFAULT_GUARANTEE * 3);
    }

    function test_MakeRoundPayment() public {
        vm.startPrank(alice);
        usdc.approve(address(circle), DEFAULT_CUOTA);
        circle.makeRoundPayment();
        vm.stopPrank();

        assertTrue(circle.hasMemberPaidRound(alice, 1));
        assertEq(circle.currentPot(), DEFAULT_CUOTA);
    }

    function test_FullRoundAndVRFDraw() public {
        _payCurrentRound(circle, members);

        uint256 requestId = circle.pendingRequestId();
        assertTrue(requestId != 0);

        _fulfillVRF(circle);

        address winner = circle.roundWinners(1);
        assertTrue(winner != address(0));
        assertTrue(circle.hasWon(winner));
    }

    function test_CompleteCircle() public {
        for (uint256 round = 1; round <= 3; round++) {
            _payCurrentRound(circle, members);
            _fulfillVRF(circle);
        }

        assertEq(uint(circle.status()), uint(Circle.CircleStatus.COMPLETED));

        for (uint256 i = 0; i < members.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(members[i]);
            assertEq(aguayoSBT.getLevel(tokenId), 1);

            assertTrue(circle.canWithdrawGuarantee(members[i]));

            uint256 balanceBefore = usdc.balanceOf(members[i]);
            vm.prank(members[i]);
            circle.withdrawGuarantee();

            assertEq(usdc.balanceOf(members[i]), balanceBefore + DEFAULT_GUARANTEE);
            assertEq(circle.guarantees(members[i]), 0);
        }
    }

    function test_RevertIfPaymentAlreadyMade() public {
        vm.startPrank(alice);
        usdc.approve(address(circle), DEFAULT_CUOTA * 2);
        circle.makeRoundPayment();

        vm.expectRevert(Circle.PaymentAlreadyMade.selector);
        circle.makeRoundPayment();
        vm.stopPrank();
    }

    function test_RevertIfNotMember() public {
        address stranger = makeAddr("stranger");

        vm.startPrank(stranger);
        usdc.approve(address(circle), DEFAULT_CUOTA);

        vm.expectRevert(Circle.NotMember.selector);
        circle.makeRoundPayment();
        vm.stopPrank();
    }

    function test_RevertIfDepositGuaranteeTwice() public {
        address[] memory newMembers = new address[](3);
        newMembers[0] = david;
        newMembers[1] = eve;
        newMembers[2] = makeAddr("user6");

        vm.prank(david);
        aguayoSBT.mintAguayo();
        vm.prank(eve);
        aguayoSBT.mintAguayo();
        vm.prank(newMembers[2]);
        aguayoSBT.mintAguayo();

        usdc.mint(newMembers[2], INITIAL_BALANCE);

        vm.prank(david);
        Circle newCircle = Circle(factory.createSavingsCircle(
            newMembers,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        ));

        vm.startPrank(david);
        usdc.approve(address(newCircle), DEFAULT_GUARANTEE * 2);
        newCircle.depositGuarantee();

        vm.expectRevert(Circle.GuaranteeAlreadyDeposited.selector);
        newCircle.depositGuarantee();
        vm.stopPrank();
    }

    function test_WinnersCannotWinTwice() public {
        _payCurrentRound(circle, members);
        _fulfillVRF(circle);

        address firstWinner = circle.roundWinners(1);
        assertTrue(circle.hasWon(firstWinner));

        _payCurrentRound(circle, members);
        _fulfillVRF(circle);

        address secondWinner = circle.roundWinners(2);
        assertTrue(firstWinner != secondWinner);
    }

    function test_CreditCircleRequestsLoan() public {
        _upgradeAguayosToLevel1(members);

        Circle creditCircle = _createCreditCircle(members);

        address[] memory creditMembers = new address[](3);
        creditMembers[0] = alice;
        creditMembers[1] = bob;
        creditMembers[2] = charlie;

        _depositGuarantees(creditCircle, creditMembers);

        assertGt(creditCircle.protocolLoan(), 0);
        assertEq(uint(creditCircle.status()), uint(Circle.CircleStatus.ACTIVE));
    }

    function test_CreditCircleRepaysLoanInRounds() public {
        _upgradeAguayosToLevel1(members);

        Circle creditCircle = _createCreditCircle(members);

        address[] memory creditMembers = new address[](3);
        creditMembers[0] = alice;
        creditMembers[1] = bob;
        creditMembers[2] = charlie;

        _depositGuarantees(creditCircle, creditMembers);

        uint256 initialDebt = vault.calculateTotalDebt(address(creditCircle));
        assertGt(initialDebt, 0);

        _payCurrentRound(creditCircle, creditMembers);
        _fulfillVRF(creditCircle);

        uint256 debtAfterRound1 = vault.calculateTotalDebt(address(creditCircle));
        assertTrue(debtAfterRound1 < initialDebt);
    }
}
