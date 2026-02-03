// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/KuyayToken.sol";
import "../src/AguayoSBT.sol";
import "../src/KuyayVault.sol";
import "../src/RiskOracle.sol";
import "../src/CircleFactory.sol";
import "../src/Circle.sol";

/**
 * @title KuyayTokenTest
 * @notice Tests para $KUYAY token y flujo completo de Pasanaku con KUYAY
 */
contract KuyayTokenTest is Test {
    KuyayToken public kuyay;
    AguayoSBT public aguayoSBT;
    KuyayVault public vault;
    RiskOracle public riskOracle;
    CircleFactory public factory;

    address public deployer = address(1);
    address public treasury = address(2);
    address public missionaryFund = address(3);
    
    // Participantes del Pasanaku
    address public alice = address(10);
    address public bob = address(11);
    address public charlie = address(12);
    address public diana = address(13);
    address public elena = address(14);

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy token
        kuyay = new KuyayToken(treasury, missionaryFund);
        
        // Deploy protocol
        aguayoSBT = new AguayoSBT();
        vault = new KuyayVault(address(kuyay), treasury);
        riskOracle = new RiskOracle(address(aguayoSBT));
        factory = new CircleFactory(
            address(aguayoSBT),
            address(vault),
            address(riskOracle),
            address(kuyay)
        );

        // Authorizations
        aguayoSBT.authorizeFactory(address(factory));
        vault.authorizeFactory(address(factory));

        // Ajustar límites para 18 decimales (KUYAY en lugar de USDC)
        factory.setGuaranteeRange(1 * 10**18, 100000 * 10**18);  // 1 - 100,000 KUYAY

        // Distribute KUYAY to participants (from treasury)
        vm.stopPrank();
        vm.startPrank(treasury);
        
        uint256 participantAmount = 1000 * 10**18;  // 1000 KUYAY each
        kuyay.transfer(alice, participantAmount);
        kuyay.transfer(bob, participantAmount);
        kuyay.transfer(charlie, participantAmount);
        kuyay.transfer(diana, participantAmount);
        kuyay.transfer(elena, participantAmount);
        
        vm.stopPrank();

        // Each participant mints an Aguayo
        _mintAguayoFor(alice);
        _mintAguayoFor(bob);
        _mintAguayoFor(charlie);
        _mintAguayoFor(diana);
        _mintAguayoFor(elena);
    }

    function _mintAguayoFor(address user) internal {
        vm.prank(user);
        aguayoSBT.mintAguayo();
    }

    function test_TokenBasics() public view {
        assertEq(kuyay.name(), "Kuyay - Luz de Inti");
        assertEq(kuyay.symbol(), "KUYAY");
        assertEq(kuyay.decimals(), 18);
        assertEq(kuyay.totalSupply(), 1_000_000_000 * 10**18);
    }

    function test_TokenDistribution() public view {
        // Team (10%) = 100M KUYAY
        assertEq(kuyay.balanceOf(deployer), 100_000_000 * 10**18);
        
        // Treasury + Community (80%) = 800M KUYAY (minus what was sent to participants)
        uint256 treasuryExpected = 800_000_000 * 10**18 - (5 * 1000 * 10**18);
        assertEq(kuyay.balanceOf(treasury), treasuryExpected);
        
        // Missionary Fund (10%) = 100M KUYAY
        assertEq(kuyay.balanceOf(missionaryFund), 100_000_000 * 10**18);
    }

    function test_FaithLevels() public view {
        // Alice has 1000 KUYAY but no blessings yet
        assertEq(kuyay.getFaithLevel(alice), 0);
        assertEq(kuyay.getFaithTitle(alice), "Perdido");
    }

    function test_FullPasanakuWithKuyay() public {
        // ============================================
        // PASO 1: Crear el Ayllu (Circle)
        // ============================================
        address[] memory members = new address[](5);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;
        members[3] = diana;
        members[4] = elena;

        uint256 guaranteeAmount = 100 * 10**18;  // 100 KUYAY garantía
        uint256 cuotaAmount = 100 * 10**18;      // 100 KUYAY por ronda

        vm.prank(alice);
        address circleAddr = factory.createSavingsCircle(
            members,
            guaranteeAmount,
            cuotaAmount
        );
        Circle circle = Circle(circleAddr);

        assertEq(uint256(circle.status()), uint256(Circle.CircleStatus.DEPOSIT));

        // ============================================
        // PASO 2: Todos depositan su garantía
        // ============================================
        _depositGuarantee(alice, circle, guaranteeAmount);
        _depositGuarantee(bob, circle, guaranteeAmount);
        _depositGuarantee(charlie, circle, guaranteeAmount);
        _depositGuarantee(diana, circle, guaranteeAmount);
        _depositGuarantee(elena, circle, guaranteeAmount);

        // Circle should be ACTIVE now
        assertEq(uint256(circle.status()), uint256(Circle.CircleStatus.ACTIVE));
        assertEq(circle.currentRound(), 1);

        // ============================================
        // PASO 3: Primera ronda - todos pagan 100 KUYAY
        // ============================================
        _makePayment(alice, circle, cuotaAmount);
        _makePayment(bob, circle, cuotaAmount);
        _makePayment(charlie, circle, cuotaAmount);
        _makePayment(diana, circle, cuotaAmount);
        _makePayment(elena, circle, cuotaAmount);

        // El pot debería tener 500 KUYAY
        assertEq(circle.currentPot(), 500 * 10**18);

        // ============================================
        // PASO 4: Check-in ceremonial y sorteo
        // ============================================
        _checkIn(alice, circle);
        _checkIn(bob, circle);
        _checkIn(charlie, circle);

        // Con 3 de 5 (60%), tenemos quórum
        assertTrue(circle.canStartDraw());

        // Ejecutar el sorteo sagrado
        vm.prank(alice);
        circle.startDraw();

        // Verificar que hubo un ganador
        address winner1 = circle.getRoundWinner(1);
        assertTrue(winner1 != address(0));
        assertTrue(circle.hasWon(winner1));
        assertEq(circle.currentRound(), 2);

        console.log("Ronda 1 - Ganador:", winner1);
        console.log("Balance del ganador:", kuyay.balanceOf(winner1) / 10**18, "KUYAY");
    }

    function test_CompletePasanakuAllRounds() public {
        // Crear y activar circle
        address[] memory members = new address[](5);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;
        members[3] = diana;
        members[4] = elena;

        uint256 guaranteeAmount = 100 * 10**18;
        uint256 cuotaAmount = 100 * 10**18;

        vm.prank(alice);
        address circleAddr = factory.createSavingsCircle(members, guaranteeAmount, cuotaAmount);
        Circle circle = Circle(circleAddr);

        // Depositar garantías
        _depositGuarantee(alice, circle, guaranteeAmount);
        _depositGuarantee(bob, circle, guaranteeAmount);
        _depositGuarantee(charlie, circle, guaranteeAmount);
        _depositGuarantee(diana, circle, guaranteeAmount);
        _depositGuarantee(elena, circle, guaranteeAmount);

        // Ejecutar las 5 rondas completas
        for (uint256 round = 1; round <= 5; round++) {
            console.log("\n=== RONDA", round, "===");
            
            // Todos pagan
            _makePayment(alice, circle, cuotaAmount);
            _makePayment(bob, circle, cuotaAmount);
            _makePayment(charlie, circle, cuotaAmount);
            _makePayment(diana, circle, cuotaAmount);
            _makePayment(elena, circle, cuotaAmount);

            // Check-in y sorteo
            _checkIn(alice, circle);
            _checkIn(bob, circle);
            _checkIn(charlie, circle);

            vm.prank(alice);
            circle.startDraw();

            address winner = circle.getRoundWinner(round);
            console.log("Ganador de ronda", round, ":", winner);
        }

        // Circle should be COMPLETED
        assertEq(uint256(circle.status()), uint256(Circle.CircleStatus.COMPLETED));

        // Todos pueden retirar sus garantías
        uint256 aliceBefore = kuyay.balanceOf(alice);
        vm.prank(alice);
        circle.withdrawGuarantee();
        assertEq(kuyay.balanceOf(alice), aliceBefore + guaranteeAmount);

        console.log("\n=== PASANAKU COMPLETADO ===");
        console.log("Todos los participantes pueden retirar su garantia");
    }

    function test_MissionaryRewards() public {
        vm.prank(deployer);
        kuyay.rewardMissionary(alice, bob, 100 * 10**18);
        
        // Alice should have received reward from missionary fund
        assertEq(kuyay.balanceOf(alice), 1000 * 10**18 + 100 * 10**18);
    }

    // ============================================
    // Helper functions
    // ============================================

    function _depositGuarantee(address user, Circle circle, uint256 amount) internal {
        vm.startPrank(user);
        kuyay.approve(address(circle), amount);
        circle.depositGuarantee();
        vm.stopPrank();
    }

    function _makePayment(address user, Circle circle, uint256 amount) internal {
        vm.startPrank(user);
        kuyay.approve(address(circle), amount);
        circle.makeRoundPayment();
        vm.stopPrank();
    }

    function _checkIn(address user, Circle circle) internal {
        vm.prank(user);
        try circle.checkIn() {} catch {}
    }
}
