// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseTest.sol";

contract CircleFactoryTest is BaseTest {

    function setUp() public override {
        super.setUp();
    }

    function test_CreateSavingsCircle() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        vm.prank(alice);
        address circleAddr = factory.createSavingsCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        );

        assertTrue(circleAddr != address(0));
        assertTrue(factory.isValidCircle(circleAddr));

        Circle circle = Circle(circleAddr);
        assertEq(uint(circle.mode()), uint(Circle.CircleMode.SAVINGS));
    }

    function test_CreateCreditCircle() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        vm.prank(alice);
        address circleAddr = factory.createCreditCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        );

        assertTrue(circleAddr != address(0));

        Circle circle = Circle(circleAddr);
        assertEq(uint(circle.mode()), uint(Circle.CircleMode.CREDIT));
    }

    function test_TrackUserCircles() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        vm.prank(alice);
        address circle1 = factory.createSavingsCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        );

        address[] memory aliceCircles = factory.getUserCircles(alice);
        assertEq(aliceCircles.length, 1);
        assertEq(aliceCircles[0], circle1);
    }

    function test_ActiveCirclesCountIncreases() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        assertEq(factory.userActiveCircles(alice), 0);

        vm.prank(alice);
        factory.createSavingsCircle(members, DEFAULT_GUARANTEE, DEFAULT_CUOTA);

        assertEq(factory.userActiveCircles(alice), 1);
        assertEq(factory.userActiveCircles(bob), 1);
    }

    function test_ActiveCirclesCountDecreasesAfterCompletion() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        vm.prank(alice);
        Circle circle = Circle(factory.createSavingsCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        ));

        assertEq(factory.userActiveCircles(alice), 1);

        _depositGuarantees(circle, members);

        for (uint256 i = 0; i < 3; i++) {
            _payCurrentRound(circle, members);
            _fulfillVRF(circle);
        }

        assertEq(uint(circle.status()), uint(Circle.CircleStatus.COMPLETED));
        assertEq(factory.userActiveCircles(alice), 0);
        assertEq(factory.userActiveCircles(bob), 0);
    }

    function test_CanCreateNewCircleAfterPreviousCompletes() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        vm.prank(alice);
        Circle circle1 = Circle(factory.createSavingsCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        ));

        _depositGuarantees(circle1, members);

        for (uint256 i = 0; i < 3; i++) {
            _payCurrentRound(circle1, members);
            _fulfillVRF(circle1);
        }

        assertEq(factory.userActiveCircles(alice), 0);

        vm.prank(alice);
        Circle circle2 = Circle(factory.createSavingsCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        ));

        assertEq(factory.userActiveCircles(alice), 1);
        assertTrue(address(circle2) != address(circle1));
    }

    function test_RevertIfTooManyActiveCircles() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        for (uint256 i = 0; i < 5; i++) {
            vm.prank(alice);
            factory.createSavingsCircle(members, DEFAULT_GUARANTEE, DEFAULT_CUOTA);
        }

        assertEq(factory.userActiveCircles(alice), 5);

        vm.prank(alice);
        vm.expectRevert(CircleFactory.MemberLimitExceeded.selector);
        factory.createSavingsCircle(members, DEFAULT_GUARANTEE, DEFAULT_CUOTA);
    }

    function test_RevertIfMemberWithoutAguayo() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        vm.prank(alice);
        aguayoSBT.mintAguayo();

        vm.prank(alice);
        vm.expectRevert();
        factory.createSavingsCircle(members, DEFAULT_GUARANTEE, DEFAULT_CUOTA);
    }

    function test_RevertIfDuplicateMember() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = alice;

        vm.prank(alice);
        aguayoSBT.mintAguayo();
        vm.prank(bob);
        aguayoSBT.mintAguayo();

        vm.prank(alice);
        vm.expectRevert(CircleFactory.DuplicateMember.selector);
        factory.createSavingsCircle(members, DEFAULT_GUARANTEE, DEFAULT_CUOTA);
    }

    function test_RevertIfInvalidMemberCount() public {
        address[] memory tooFew = new address[](1);
        tooFew[0] = alice;

        vm.prank(alice);
        aguayoSBT.mintAguayo();

        vm.prank(alice);
        vm.expectRevert(CircleFactory.InvalidMemberCount.selector);
        factory.createSavingsCircle(tooFew, DEFAULT_GUARANTEE, DEFAULT_CUOTA);
    }

    function test_RevertIfInvalidGuaranteeAmount() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        vm.prank(alice);
        vm.expectRevert(CircleFactory.InvalidGuaranteeAmount.selector);
        factory.createSavingsCircle(members, 1 * 10**6, DEFAULT_CUOTA);
    }

    function test_PreviewCircleCreation() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        (bool eligible, uint256 leverage, uint256 interest) =
            factory.previewCircleCreation(members, true);

        assertTrue(eligible);
        assertGt(leverage, 100);
        assertGt(interest, 0);
    }

    function test_GetAllCircles() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        uint256 initialCount = factory.getCircleCount();

        vm.prank(alice);
        factory.createSavingsCircle(members, DEFAULT_GUARANTEE, DEFAULT_CUOTA);

        vm.prank(bob);
        factory.createSavingsCircle(members, DEFAULT_GUARANTEE, DEFAULT_CUOTA);

        assertEq(factory.getCircleCount(), initialCount + 2);

        address[] memory allCircles = factory.getAllCircles();
        assertEq(allCircles.length, initialCount + 2);
    }
}
