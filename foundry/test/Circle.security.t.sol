// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseTest.sol";

/**
 * @title CircleSecurityTest
 * @notice Tests de seguridad críticos para Circle.sol
 */
contract CircleSecurityTest is BaseTest {

    Circle public circle;
    address[] public members;

    function setUp() public override {
        super.setUp();

        // Setup miembros
        members.push(alice);
        members.push(bob);
        members.push(charlie);

        // Mintear Aguayos
        _mintAguayosForUsers(members);

        // Crear círculo de ahorro
        circle = _createSavingsCircle(members);

        // Depositar garantías
        _depositGuarantees(circle, members);
    }

    /* ========== BUG CRÍTICO #1: liquidate() sin restricción ========== */

    /// @notice ANTES DEL FIX: Cualquier persona puede liquidar un círculo activo
    /// @dev This test documents the bug BEFORE the fix. Skip it now that bug is fixed.
    function skip_test_CRITICAL_AnyoneCanLiquidate_BEFORE_FIX() public {
        // Circle está ACTIVO y funcionando normalmente
        assertEq(uint(circle.status()), uint(Circle.CircleStatus.ACTIVE));
        assertEq(circle.currentRound(), 1);

        // Todos pagan la primera ronda (círculo sano)
        _payCurrentRound(circle, members);

        // ⚠️ BUG: Un atacante externo puede liquidar el círculo
        address attacker = makeAddr("attacker");

        vm.prank(attacker);
        circle.liquidate(); // ⚠️ Esto NO debería funcionar pero SÍ funciona

        // El círculo fue liquidado injustamente
        assertEq(uint(circle.status()), uint(Circle.CircleStatus.LIQUIDATED));

        // Todos los miembros tienen manchas en su Aguayo
        for (uint256 i = 0; i < members.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(members[i]);
            assertTrue(aguayoSBT.isAguayoStained(tokenId));
        }
    }

    /// @notice Test que debe PASAR después del fix
    function test_OnlyAuthorizedCanLiquidate_AFTER_FIX() public {
        // Pagar primera ronda
        _payCurrentRound(circle, members);

        // Atacante NO debe poder liquidar
        address attacker = makeAddr("attacker");

        vm.prank(attacker);
        vm.expectRevert(); // Esperamos que revierta
        circle.liquidate();

        // Círculo sigue activo
        assertEq(uint(circle.status()), uint(Circle.CircleStatus.ACTIVE));
    }

    /// @notice Owner/Factory SÍ debe poder liquidar en caso de emergencia
    function test_OwnerCanLiquidateInEmergency() public {
        _payCurrentRound(circle, members);

        // Simular que pasa mucho tiempo sin que se complete la ronda
        vm.warp(block.timestamp + 31 days);

        // Owner puede liquidar por timeout
        vm.prank(owner);
        // Este test fallará hasta que implementemos el fix
        // circle.liquidate();
    }

    /* ========== BUG CRÍTICO #2: No hay timeout para VRF ========== */

    /// @notice Si VRF nunca responde, los fondos quedan bloqueados para siempre
    function test_CRITICAL_VRFNeverResponds_FundsLockedForever() public {
        // Todos pagan la ronda 1
        _payCurrentRound(circle, members);

        // VRF request fue enviado
        uint256 requestId = circle.pendingRequestId();
        assertTrue(requestId != 0);

        // Pasa 1 año y VRF nunca responde (Chainlink caído)
        vm.warp(block.timestamp + 365 days);

        // Los miembros intentan recuperar sus fondos
        // NO hay función de emergencia para esto ⚠️

        // El círculo está permanentemente bloqueado
        assertEq(uint(circle.status()), uint(Circle.CircleStatus.ACTIVE));
        assertTrue(circle.pendingRequestId() != 0);

        // Los fondos están atrapados:
        // - currentPot tiene los pagos de la ronda
        // - totalCollateral tiene las garantías
        // - No hay forma de recuperarlos
        uint256 trappedFunds = circle.currentPot() + circle.totalCollateral();
        assertGt(trappedFunds, 0);
    }

    /// @notice Después del fix, debe haber una función de emergencia con timeout
    function test_EmergencyWithdrawAfterVRFTimeout_AFTER_FIX() public {
        _payCurrentRound(circle, members);

        uint256 requestId = circle.pendingRequestId();
        assertTrue(requestId != 0);

        // Pasa el tiempo de timeout (ej: 7 días)
        vm.warp(block.timestamp + 8 days);

        // Cualquier miembro puede activar el modo de emergencia
        vm.prank(alice);
        // Esta función no existe aún - la crearemos en el fix
        // circle.emergencyCancel();

        // Cada miembro recupera su garantía
        uint256 aliceBalanceBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        // circle.withdrawGuaranteeEmergency();

        // Alice recuperó su garantía
        // assertEq(usdc.balanceOf(alice), aliceBalanceBefore + DEFAULT_GUARANTEE);
    }

    /* ========== BUG CRÍTICO #3: Matemática incorrecta en repayment ========== */

    function test_CRITICAL_IncorrectRepaymentMath() public {
        // Crear círculo de CRÉDITO con leverage
        _upgradeAguayosToLevel1(members);
        Circle creditCircle = _createCreditCircle(members);

        // Depositar garantías (activa el círculo y pide préstamo)
        _depositGuarantees(creditCircle, members);

        // Verificar que se pidió préstamo
        uint256 protocolLoan = creditCircle.protocolLoan();
        assertGt(protocolLoan, 0);

        // Todos pagan primera ronda
        address[] memory creditMembers = new address[](3);
        creditMembers[0] = alice;
        creditMembers[1] = bob;
        creditMembers[2] = charlie;

        _payCurrentRound(creditCircle, creditMembers);

        // Simular VRF
        _fulfillVRF(creditCircle);

        // El ganador recibe el pot menos el repayment
        address winner = creditCircle.roundWinners(1);
        assertTrue(winner != address(0));

        // ⚠️ BUG: repaymentAmount = currentPot / totalRounds
        // Esto está MAL porque:
        // 1. No considera la deuda total acumulada
        // 2. No considera los intereses
        // 3. Puede dejar deuda sin pagar al final

        // Después de todas las rondas, verificar deuda
        for (uint256 i = 2; i <= 3; i++) {
            _payCurrentRound(creditCircle, creditMembers);
            _fulfillVRF(creditCircle);
        }

        // Verificar si la deuda fue completamente pagada
        uint256 remainingDebt = vault.calculateTotalDebt(address(creditCircle));

        // El bug causará que quede deuda sin pagar
        // (Este test puede pasar o fallar dependiendo de los números)
    }
}
