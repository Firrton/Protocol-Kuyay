// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseTest.sol";

contract RiskOracleTest is BaseTest {

    function setUp() public override {
        super.setUp();
    }

    function test_MemberEligibilityForSavings() public {
        vm.prank(alice);
        aguayoSBT.mintAguayo();

        assertTrue(riskOracle.isMemberEligible(alice, false));
    }

    function test_MemberNotEligibleForCreditWithLevel0() public {
        vm.prank(alice);
        aguayoSBT.mintAguayo();

        assertFalse(riskOracle.isMemberEligible(alice, true));
    }

    function test_MemberEligibleForCreditWithLevel1() public {
        vm.prank(alice);
        aguayoSBT.mintAguayo();

        uint256 tokenId = aguayoSBT.userToAguayo(alice);

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addBorder(tokenId);
        aguayoSBT.revokeCircle(address(this));

        assertTrue(riskOracle.isMemberEligible(alice, true));
    }

    function test_GetLeverageLevelForLevel1Group() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        (uint256 multiplier, uint256 interestRate) = riskOracle.getLeverageLevel(members);

        assertGt(multiplier, 100);
        assertLt(multiplier, 500);
        assertGt(interestRate, 0);
    }

    function test_LeverageIncreasesWithHigherLevel() public {
        address[] memory membersLow = new address[](2);
        membersLow[0] = alice;
        membersLow[1] = bob;

        address[] memory membersHigh = new address[](2);
        membersHigh[0] = charlie;
        membersHigh[1] = david;

        _mintAguayosForUsers(membersLow);
        _mintAguayosForUsers(membersHigh);

        _upgradeAguayosToLevel1(membersLow);

        aguayoSBT.authorizeCircle(address(this));
        for (uint256 i = 0; i < 5; i++) {
            aguayoSBT.addBorder(aguayoSBT.userToAguayo(charlie));
            aguayoSBT.addBorder(aguayoSBT.userToAguayo(david));
        }
        aguayoSBT.revokeCircle(address(this));

        (uint256 multiplierLow,) = riskOracle.getLeverageLevel(membersLow);
        (uint256 multiplierHigh,) = riskOracle.getLeverageLevel(membersHigh);

        assertGt(multiplierHigh, multiplierLow);
    }

    function test_StainedMembersReduceLeverage() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        (uint256 multiplierClean,) = riskOracle.getLeverageLevel(members);

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addStain(aguayoSBT.userToAguayo(alice));
        aguayoSBT.revokeCircle(address(this));

        (uint256 multiplierStained,) = riskOracle.getLeverageLevel(members);

        assertGt(multiplierClean, multiplierStained);
    }

    function test_InterestRateIncreasesWithStains() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        (, uint256 interestClean) = riskOracle.getLeverageLevel(members);

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addStain(aguayoSBT.userToAguayo(alice));
        aguayoSBT.revokeCircle(address(this));

        (, uint256 interestStained) = riskOracle.getLeverageLevel(members);

        assertGt(interestStained, interestClean);
    }

    function test_InterestRateCapAt100Percent() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        aguayoSBT.authorizeCircle(address(this));
        for (uint256 i = 0; i < members.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(members[i]);
            for (uint256 j = 0; j < 50; j++) {
                aguayoSBT.addStain(tokenId);
            }
        }
        aguayoSBT.revokeCircle(address(this));

        (, uint256 interestRate) = riskOracle.getLeverageLevel(members);

        assertLe(interestRate, 10000);
    }

    function test_WeightedProbabilitiesHigherForHigherLevel() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addBorder(aguayoSBT.userToAguayo(alice));

        for (uint256 i = 0; i < 5; i++) {
            aguayoSBT.addBorder(aguayoSBT.userToAguayo(bob));
        }
        aguayoSBT.revokeCircle(address(this));

        uint256[] memory weights = riskOracle.getWeightedProbabilities(members);

        assertGt(weights[1], weights[0]);
        assertGt(weights[1], weights[2]);
    }

    function test_AllMembersEligibleForCredit() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        assertTrue(riskOracle.areAllMembersEligible(members));
    }

    function test_NotAllMembersEligibleIfOneLevel0() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;

        _mintAguayosForUsers(members);

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addBorder(aguayoSBT.userToAguayo(alice));
        aguayoSBT.addBorder(aguayoSBT.userToAguayo(bob));
        aguayoSBT.revokeCircle(address(this));

        assertFalse(riskOracle.areAllMembersEligible(members));
    }

    function test_NotEligibleIfStained() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        _mintAguayosForUsers(members);
        _upgradeAguayosToLevel1(members);

        assertTrue(riskOracle.areAllMembersEligible(members));

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addStain(aguayoSBT.userToAguayo(alice));
        aguayoSBT.revokeCircle(address(this));

        assertFalse(riskOracle.areAllMembersEligible(members));
    }

    function test_GetAllLeverageTiers() public {
        RiskOracle.LeverageTier[] memory tiers = riskOracle.getAllLeverageTiers();

        assertGt(tiers.length, 0);

        for (uint256 i = 0; i < tiers.length; i++) {
            assertGt(tiers[i].multiplier, 0);
            assertGt(tiers[i].interestRateBps, 0);
        }
    }

    function test_AddLeverageTier() public {
        uint256 countBefore = riskOracle.getLeverageTierCount();

        riskOracle.addLeverageTier(10, 400, 600);

        assertEq(riskOracle.getLeverageTierCount(), countBefore + 1);

        RiskOracle.LeverageTier memory newTier = riskOracle.getLeverageTier(countBefore);
        assertEq(newTier.minAverageLevel, 10);
        assertEq(newTier.multiplier, 400);
        assertEq(newTier.interestRateBps, 600);
    }

    function test_RevertIfInvalidLeverageMultiplier() public {
        vm.expectRevert(RiskOracle.InvalidParameter.selector);
        riskOracle.addLeverageTier(5, 0, 800);
    }
}
