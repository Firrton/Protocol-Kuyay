'use client';

import { useDemo } from '@/lib/demo/DemoContext';

/**
 * Panel que muestra los miembros simulados en Solo Mode
 * Permite al juez ver el estado de todos los "jugadores"
 */
export default function SoloModePanel() {
  const { state, config, makePayment, checkIn, simulateAllMembersPayment, simulateAllMembersCheckIn } = useDemo();

  if (!config.soloMode || state.mockMembers.length === 0) {
    return null;
  }

  const userMember = state.mockMembers.find(m => m.isYou);
  const otherMembers = state.mockMembers.filter(m => !m.isYou);

  const allPaid = state.mockMembers.every(m => m.hasPaid);
  const allPresent = state.mockMembers.every(m => m.isPresent);

  // Determinar si el paso actual requiere interacción en este panel
  const isPaymentStep = state.currentStep === 'making-payment';
  const isCheckInStep = state.currentStep === 'checking-in';
  const needsUserAction = (isPaymentStep && !userMember?.hasPaid) || (isCheckInStep && !userMember?.isPresent);

  return (
    <div className={`bg-gradient-to-br from-profundo to-tierra/5 border-2 rounded-2xl p-6 transition-all ${
      needsUserAction
        ? 'border-ceremonial shadow-xl shadow-ceremonial/30 animate-pulse'
        : 'border-dorado/50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
            👥 Modo Solo Demo
          </h3>
          <p className="text-sm text-gris">
            Controla tu wallet + simula otros miembros
          </p>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold bg-dorado/20 text-dorado border border-dorado">
          {state.mockMembers.length} Miembros
        </div>
      </div>

      {/* Current Step Indicator */}
      {(isPaymentStep || isCheckInStep) && (
        <div className={`mb-4 rounded-xl p-4 border-2 ${
          isPaymentStep
            ? 'bg-orange-500/10 border-orange-400/50'
            : 'bg-blue-500/10 border-blue-400/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {isPaymentStep ? '💰' : '✋'}
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg">
                {isPaymentStep ? 'Paso Activo: Hacer Pagos' : 'Paso Activo: Check-In'}
              </div>
              <div className="text-sm text-gris">
                {isPaymentStep
                  ? 'Todos los miembros deben pagar su cuota mensual'
                  : 'Los miembros que pagaron deben confirmar asistencia'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tu Wallet */}
      {userMember && (
        <div className="mb-4 bg-ceremonial/10 border-2 border-ceremonial/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-ceremonial font-bold mb-1">🦙 Tu Wallet</div>
              <div className="font-mono text-xs text-white">
                {userMember.address.slice(0, 6)}...{userMember.address.slice(-4)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gris mb-1">Aguayo Nivel</div>
              <div className="text-2xl font-display font-bold text-dorado">
                {userMember.aguayoLevel}
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`px-3 py-2 rounded-lg text-center text-sm font-bold ${
              userMember.hasPaid
                ? 'bg-pachamama/20 text-pachamama border border-pachamama'
                : 'bg-tierra/20 text-gris border border-tierra'
            }`}>
              {userMember.hasPaid ? '✓ Pagado' : '⏳ Pendiente'}
            </div>
            <div className={`px-3 py-2 rounded-lg text-center text-sm font-bold ${
              userMember.isPresent
                ? 'bg-pachamama/20 text-pachamama border border-pachamama'
                : 'bg-tierra/20 text-gris border border-tierra'
            }`}>
              {userMember.isPresent ? '✓ Presente' : '⏳ Ausente'}
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {!userMember.hasPaid && (
              <button
                onClick={() => makePayment()}
                disabled={state.currentStep !== 'making-payment'}
                className={`px-4 py-2 rounded-lg font-display font-bold text-sm transition-all ${
                  state.currentStep === 'making-payment'
                    ? 'bg-gradient-to-r from-ceremonial to-ocre text-white hover:scale-105 shadow-lg shadow-ceremonial/50 animate-pulse'
                    : 'bg-tierra/20 text-gris cursor-not-allowed opacity-50'
                }`}
              >
                💰 Pagar Cuota
              </button>
            )}
            {!userMember.isPresent && userMember.hasPaid && (
              <button
                onClick={() => checkIn()}
                disabled={state.currentStep !== 'checking-in'}
                className={`px-4 py-2 rounded-lg font-display font-bold text-sm transition-all ${
                  state.currentStep === 'checking-in'
                    ? 'bg-gradient-to-r from-pachamama to-ocre text-white hover:scale-105 shadow-lg shadow-pachamama/50 animate-pulse'
                    : 'bg-tierra/20 text-gris cursor-not-allowed opacity-50'
                }`}
              >
                ✋ Check-In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Otros Miembros (Simulados) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-display font-bold text-white">
            Miembros Simulados
          </div>
          {!allPaid && state.currentStep === 'making-payment' && (
            <button
              onClick={simulateAllMembersPayment}
              className="px-3 py-1 bg-dorado/20 text-dorado border-2 border-dorado rounded-lg text-xs font-bold hover:bg-dorado hover:text-profundo transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              ⚡ Simular Todos Paguen
            </button>
          )}
          {!allPresent && state.currentStep === 'checking-in' && allPaid && (
            <button
              onClick={simulateAllMembersCheckIn}
              className="px-3 py-1 bg-pachamama/20 text-pachamama border-2 border-pachamama rounded-lg text-xs font-bold hover:bg-pachamama hover:text-profundo transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              ⚡ Simular Todos Check-In
            </button>
          )}
        </div>

        {otherMembers.map((member, idx) => (
          <div
            key={member.address}
            className="bg-tierra/10 border border-tierra rounded-lg p-3 hover:bg-tierra/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocre/30 to-dorado/30 border-2 border-tierra flex items-center justify-center font-display font-bold text-white">
                  {member.name[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{member.name}</div>
                  <div className="text-xs text-gris">
                    Nivel {member.aguayoLevel} • {member.address.slice(0, 6)}...
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  member.hasPaid
                    ? 'bg-pachamama/20 text-pachamama'
                    : 'bg-tierra/20 text-gris'
                }`}>
                  {member.hasPaid ? '💰' : '⏳'}
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  member.isPresent
                    ? 'bg-pachamama/20 text-pachamama'
                    : 'bg-tierra/20 text-gris'
                }`}>
                  {member.isPresent ? '👁️' : '⏳'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Info */}
      {state.currentStep === 'making-payment' && (
        <div className="mt-4 bg-ceremonial/10 border border-ceremonial/30 rounded-lg p-3 text-xs text-gris">
          💡 <span className="text-white font-bold">Tip:</span> En modo solo, puedes simular que los otros miembros pagan automáticamente con el botón de arriba, o esperar el auto-play.
        </div>
      )}

      {allPaid && !allPresent && state.currentStep === 'checking-in' && (
        <div className="mt-4 bg-pachamama/10 border border-pachamama/30 rounded-lg p-3 text-xs text-gris">
          ✨ <span className="text-white font-bold">¡Todos pagaron!</span> Ahora deben hacer check-in para el sorteo ceremonial.
        </div>
      )}

      {allPaid && allPresent && (
        <div className="mt-4 bg-dorado/10 border border-dorado/30 rounded-lg p-3 text-xs text-gris">
          🎉 <span className="text-white font-bold">¡Listos para el sorteo!</span> Todos pagaron y están presentes.
        </div>
      )}
    </div>
  );
}
