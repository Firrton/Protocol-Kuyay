// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseTest.sol";

contract AguayoSBTTest is BaseTest {

    function setUp() public override {
        super.setUp();
    }

    function test_MintAguayo() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        assertEq(tokenId, 1);
        assertEq(aguayoSBT.ownerOf(tokenId), alice);
        assertEq(aguayoSBT.userToAguayo(alice), tokenId);
    }

    function test_InitialAguayoMetadata() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        AguayoSBT.AguayoMetadata memory metadata = aguayoSBT.getAguayoMetadata(tokenId);

        assertEq(metadata.level, 0);
        assertEq(metadata.totalThreads, 0);
        assertEq(metadata.completedCircles, 0);
        assertEq(metadata.stains, 0);
        assertFalse(metadata.isStained);
    }

    function test_AddWeave() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        aguayoSBT.authorizeCircle(address(this));

        aguayoSBT.addWeave(tokenId);

        AguayoSBT.AguayoMetadata memory metadata = aguayoSBT.getAguayoMetadata(tokenId);
        assertEq(metadata.totalThreads, 1);

        aguayoSBT.revokeCircle(address(this));
    }

    function test_AddBorder() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        aguayoSBT.authorizeCircle(address(this));

        aguayoSBT.addBorder(tokenId);

        AguayoSBT.AguayoMetadata memory metadata = aguayoSBT.getAguayoMetadata(tokenId);
        assertEq(metadata.completedCircles, 1);
        assertEq(metadata.level, 1);

        aguayoSBT.revokeCircle(address(this));
    }

    function test_AddStain() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        aguayoSBT.authorizeCircle(address(this));

        aguayoSBT.addStain(tokenId);

        AguayoSBT.AguayoMetadata memory metadata = aguayoSBT.getAguayoMetadata(tokenId);
        assertEq(metadata.stains, 1);
        assertTrue(metadata.isStained);

        aguayoSBT.revokeCircle(address(this));
    }

    function test_LevelIncrementsWithCompletedCircles() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        aguayoSBT.authorizeCircle(address(this));

        for (uint256 i = 1; i <= 5; i++) {
            aguayoSBT.addBorder(tokenId);
            assertEq(aguayoSBT.getLevel(tokenId), i);
        }

        aguayoSBT.revokeCircle(address(this));
    }

    function test_IsEligibleForCredit() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        assertFalse(aguayoSBT.isEligibleForCredit(tokenId));

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addBorder(tokenId);
        aguayoSBT.revokeCircle(address(this));

        assertTrue(aguayoSBT.isEligibleForCredit(tokenId));
    }

    function test_NotEligibleForCreditIfStained() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        aguayoSBT.authorizeCircle(address(this));
        aguayoSBT.addBorder(tokenId);
        aguayoSBT.addStain(tokenId);
        aguayoSBT.revokeCircle(address(this));

        assertFalse(aguayoSBT.isEligibleForCredit(tokenId));
    }

    function test_RevertIfMintAguayoTwice() public {
        vm.startPrank(alice);
        aguayoSBT.mintAguayo();

        vm.expectRevert(AguayoSBT.AguayoAlreadyExists.selector);
        aguayoSBT.mintAguayo();
        vm.stopPrank();
    }

    function test_RevertIfUnauthorizedAddWeave() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        vm.expectRevert(AguayoSBT.NotAuthorizedCircle.selector);
        aguayoSBT.addWeave(tokenId);
    }

    function test_RevertIfUnauthorizedAddBorder() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        vm.expectRevert(AguayoSBT.NotAuthorizedCircle.selector);
        aguayoSBT.addBorder(tokenId);
    }

    function test_RevertIfUnauthorizedAddStain() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        vm.expectRevert(AguayoSBT.NotAuthorizedCircle.selector);
        aguayoSBT.addStain(tokenId);
    }

    function test_CannotTransferAguayo() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        vm.prank(alice);
        vm.expectRevert(AguayoSBT.TransferNotAllowed.selector);
        aguayoSBT.transferFrom(alice, bob, tokenId);
    }

    function test_CannotSafeTransferAguayo() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        vm.prank(alice);
        vm.expectRevert(AguayoSBT.TransferNotAllowed.selector);
        aguayoSBT.safeTransferFrom(alice, bob, tokenId);
    }

    function test_HasAguayo() public {
        assertFalse(aguayoSBT.hasAguayo(alice));

        vm.prank(alice);
        aguayoSBT.mintAguayo();

        assertTrue(aguayoSBT.hasAguayo(alice));
    }

    function test_GetAguayoByUser() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        assertEq(aguayoSBT.getAguayoByUser(alice), tokenId);
    }

    function test_AuthorizeAndRevokeCircle() public {
        address circleAddr = makeAddr("circle");

        aguayoSBT.authorizeCircle(circleAddr);
        assertTrue(aguayoSBT.authorizedCircles(circleAddr));

        aguayoSBT.revokeCircle(circleAddr);
        assertFalse(aguayoSBT.authorizedCircles(circleAddr));
    }

    function test_AuthorizeAndRevokeFactory() public {
        address factoryAddr = makeAddr("newFactory");

        aguayoSBT.authorizeFactory(factoryAddr);
        assertTrue(aguayoSBT.authorizedFactories(factoryAddr));

        aguayoSBT.revokeFactory(factoryAddr);
        assertFalse(aguayoSBT.authorizedFactories(factoryAddr));
    }

    function test_FactoryCanMintAguayoForUser() public {
        address newFactory = makeAddr("newFactory");
        aguayoSBT.authorizeFactory(newFactory);

        vm.prank(newFactory);
        uint256 tokenId = aguayoSBT.mintAguayoFor(alice);

        assertEq(aguayoSBT.ownerOf(tokenId), alice);
        assertEq(aguayoSBT.userToAguayo(alice), tokenId);
    }

    function test_TokenURI() public {
        vm.prank(alice);
        uint256 tokenId = aguayoSBT.mintAguayo();

        string memory uri = aguayoSBT.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }
}
