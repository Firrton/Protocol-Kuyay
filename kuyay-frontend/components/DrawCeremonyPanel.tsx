"use client";

import { useState, useEffect } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { useDrawCeremony, useRoundWinner } from "@/hooks/useDrawCeremony";
import { useRoundPaymentStatus } from "@/hooks/useCircles";
import { CIRCLE_ABI } from "@/lib/contracts/abis";

interface DrawCeremonyPanelProps {
  circleAddress: `0x${string}`;
  circleName: string;
  currentRound: number;
  memberCount: number;
  currentPot: number;
  members: string[];
}

/**
 * Panel para la Ceremonia del Sorteo (Pasanaku)
 *
 * Flujo:
 * 1. Los miembros hacen check-in (marcar presencia)
 * 2. Cuando todos marcan presencia, se puede iniciar el sorteo
 * 3. Chainlink VRF selecciona al ganador aleatoriamente
 * 4. El ganador recibe el pozo acumulado
 */
export default function DrawCeremonyPanel({
  circleAddress,
  circleName,
  currentRound,
  memberCount,
  currentPot,
  members,
}: DrawCeremonyPanelProps) {
  const { address: userAddress } = useAccount();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const {
    checkIn,
    startDraw,
    isCheckingIn,
    isStartingDraw,
    isDrawing,
    winner,
    userIsPresent,
    presentMembers,
    canStartDraw,
    checkInError,
    drawError,
    refetchPresence,
    refetchPresentMembers,
    refetchCanStart,
  } = useDrawCeremony(circleAddress);

  // Verificar si todos pagaron
  const { paidMembers, totalMembers, allPaid, isLoading: isCheckingPayments, refetch: refetchPayments } = useRoundPaymentStatus(
    circleAddress,
    currentRound,
    members
  );

  // Obtener ganador de ronda anterior
  const { winner: previousWinner } = useRoundWinner(
    circleAddress,
    currentRound > 1 ? currentRound - 1 : 0
  );

  // Mostrar confetti cuando hay ganador
  useEffect(() => {
    if (winner) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [winner]);

  // Polling cada 30 segundos para actualizar estado de pagos (reducido para evitar rate limiting)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Actualizando estado de pagos...");
      refetchPayments();
    }, 30000); // 30 segundos en lugar de 10

    return () => clearInterval(interval);
  }, [refetchPayments]);

  const presentCount = presentMembers.length;
  const isUserWinner = winner?.toLowerCase() === userAddress?.toLowerCase();
  const hasPreviousWinner = previousWinner && previousWinner !== "0x0000000000000000000000000000000000000000";

  // Función mejorada de refresh manual
  const handleManualRefresh = async () => {
    console.log("🔄 Manual refresh iniciado...");
    setIsManualRefreshing(true);

    try {
      // Refetch todos los datos en paralelo
      await Promise.all([
        refetchPayments(),
        refetchPresence(),
        refetchPresentMembers(),
        refetchCanStart(),
      ]);
      console.log("✅ Refresh completado");
    } catch (error) {
      console.error("❌ Error en refresh:", error);
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 1000); // Delay para que se vea el spinner
    }
  };

  // Handlers con refetch manual para reducir dependencia de event listeners
  const handleCheckIn = async () => {
    await checkIn();
    // Refetch después de que se confirme la transacción
    setTimeout(() => {
      refetchPresence();
      refetchPresentMembers();
      refetchCanStart();
    }, 3000);
  };

  const handleStartDraw = async () => {
    await startDraw();
    // Refetch después de que se confirme
    setTimeout(() => {
      refetchCanStart();
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-ceremonial/20 to-dorado/20 border-2 border-ceremonial/50 rounded-xl p-6">
        <div className="text-center">
          <div className="text-6xl mb-3">🎲</div>
          <h3 className="text-2xl font-display font-bold text-white mb-2">
            Ceremonia del Sorteo - Ronda {currentRound}
          </h3>
          <p className="text-gris">
            Sorteo tradicional andino con tecnología Chainlink VRF
          </p>
        </div>
      </div>

      {/* Advertencia si no todos han pagado */}
      {!allPaid && !isCheckingPayments && (
        <div className="bg-ceremonial/10 border-2 border-ceremonial/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">⚠️</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-display font-bold text-ceremonial">
                  No todos han pagado esta ronda
                </h4>
                <button
                  onClick={handleManualRefresh}
                  disabled={isManualRefreshing}
                  className="text-xs bg-ceremonial/20 border border-ceremonial/50 text-ceremonial px-3 py-1 rounded-lg hover:bg-ceremonial/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <span className={isManualRefreshing ? "animate-spin" : ""}>
                    {isManualRefreshing ? "⚡" : "🔄"}
                  </span>
                  {isManualRefreshing ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
              <p className="text-white/90 mb-3">
                El sorteo solo puede comenzar cuando <strong>todos los miembros</strong> hayan pagado su cuota de esta ronda.
              </p>
              <div className="bg-profundo/50 rounded-lg p-4 border border-ceremonial/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gris">Miembros que pagaron:</span>
                  <span className="text-xl font-display font-bold text-white">
                    {paidMembers} / {totalMembers}
                  </span>
                </div>
                <div className="mt-2 w-full bg-profundo rounded-full h-2 border border-tierra/30">
                  <div
                    className="bg-ceremonial h-full rounded-full transition-all duration-500"
                    style={{ width: `${(paidMembers / totalMembers) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gris mt-3">
                💡 <strong>Tip:</strong> Una vez que todos paguen, podrás marcar presencia para participar en el sorteo.
              </p>
              <p className="text-xs text-dorado/80 mt-2">
                🔄 Usa el botón "Actualizar" arriba después de que alguien pague, o espera 30 segundos para auto-actualización
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ganador de ronda anterior */}
      {hasPreviousWinner && (
        <div className="bg-pachamama/10 border-2 border-pachamama/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="text-sm text-gris">Ganador Ronda {currentRound - 1}</div>
              <div className="font-mono text-white font-bold">
                {previousWinner.slice(0, 6)}...{previousWinner.slice(-4)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Status */}
      <div className="bg-profundo/50 border-2 border-tierra rounded-xl p-6">
        <h4 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
          <span>✋</span>
          Registro de Presencia ({presentCount}/{memberCount})
        </h4>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="w-full bg-profundo rounded-full h-4 border border-tierra">
            <div
              className="bg-gradient-to-r from-ceremonial to-dorado h-full rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${(presentCount / memberCount) * 100}%` }}
            >
              {presentCount > 0 && `${Math.round((presentCount / memberCount) * 100)}%`}
            </div>
          </div>
        </div>

        {/* Estado del usuario */}
        {userIsPresent ? (
          <div className="bg-pachamama/10 border border-pachamama/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <div className="font-display font-bold text-pachamama">
                  Ya marcaste presencia
                </div>
                <div className="text-sm text-gris">
                  Esperando a que {memberCount - presentCount} miembros más marquen presencia
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !allPaid}
              className="w-full bg-gradient-to-r from-ceremonial to-ocre text-white py-4 rounded-lg font-display font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCheckingIn ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Registrando...
                </>
              ) : !allPaid ? (
                <>
                  <span>🔒</span>
                  Esperando pagos de todos los miembros
                </>
              ) : (
                <>
                  <span>✋</span>
                  Marcar Presencia para el Sorteo
                </>
              )}
            </button>
            {!allPaid && (
              <p className="text-xs text-ceremonial text-center bg-ceremonial/10 border border-ceremonial/30 rounded-lg p-2">
                ⚠️ El check-in está bloqueado hasta que todos paguen ({paidMembers}/{totalMembers} pagaron)
              </p>
            )}
          </>
        )}

        {checkInError && (
          <div className="mt-3 text-sm text-ceremonial bg-ceremonial/10 border border-ceremonial/30 rounded-lg p-3">
            ⚠️ Error: {checkInError.message}
          </div>
        )}
      </div>

      {/* Lista de miembros presentes */}
      {presentMembers.length > 0 && (
        <details className="bg-profundo/30 border border-tierra/30 rounded-xl p-4">
          <summary className="cursor-pointer font-display font-semibold text-white hover:text-ocre transition-colors">
            👥 Ver Miembros Presentes ({presentCount})
          </summary>
          <div className="mt-4 space-y-2">
            {presentMembers.map((member, idx) => {
              const isCurrentUser = member.toLowerCase() === userAddress?.toLowerCase();
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 bg-profundo/50 border p-3 rounded-lg ${
                    isCurrentUser ? "border-ocre" : "border-tierra"
                  }`}
                >
                  <span className="text-xl">✅</span>
                  <div className="font-mono text-white text-sm">
                    {member.slice(0, 6)}...{member.slice(-4)}
                  </div>
                  {isCurrentUser && (
                    <span className="ml-auto text-xs bg-ocre/20 text-ocre px-2 py-1 rounded-full font-bold">
                      Tú
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Botón de Iniciar Sorteo */}
      {canStartDraw && (
        <div className="bg-gradient-to-br from-dorado/20 to-ceremonial/20 border-2 border-dorado/50 rounded-xl p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="text-xl font-display font-bold text-white mb-2">
              ¡Todos están presentes!
            </h4>
            <p className="text-gris mb-1">
              El pozo de ${currentPot.toLocaleString()} está listo para ser sorteado
            </p>
            <p className="text-xs text-dorado">
              ⚡ Usando Chainlink VRF para aleatoriedad verificable
            </p>
          </div>

          <button
            onClick={handleStartDraw}
            disabled={isStartingDraw || isDrawing}
            className="w-full bg-gradient-to-r from-dorado to-ceremonial text-white py-4 rounded-lg font-display font-bold text-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
          >
            {isStartingDraw ? (
              <>
                <span className="animate-spin">⚡</span>
                Iniciando Sorteo...
              </>
            ) : isDrawing ? (
              <>
                <span className="animate-bounce">🎲</span>
                Chainlink VRF Sorteando...
              </>
            ) : (
              <>
                <span>🎲</span>
                Iniciar Sorteo del Pasanaku
              </>
            )}
          </button>

          {drawError && (
            <div className="mt-3 text-sm text-ceremonial bg-ceremonial/10 border border-ceremonial/30 rounded-lg p-3">
              ⚠️ Error: {drawError.message}
            </div>
          )}
        </div>
      )}

      {/* Sorteo en progreso */}
      {isDrawing && !winner && (
        <div className="bg-gradient-to-br from-profundo to-ceremonial/10 border-2 border-ceremonial/50 rounded-xl p-8 text-center animate-pulse">
          <div className="text-6xl mb-4 animate-bounce">🎲</div>
          <h4 className="text-2xl font-display font-bold text-white mb-2">
            Sorteando...
          </h4>
          <p className="text-gris mb-4">
            Chainlink VRF está seleccionando al ganador aleatoriamente
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-ceremonial rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 bg-dorado rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 bg-pachamama rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      )}

      {/* Ganador seleccionado */}
      {winner && (
        <div className={`bg-gradient-to-br from-dorado/30 to-ceremonial/30 border-4 rounded-xl p-8 text-center ${
          showConfetti ? "animate-pulse" : ""
        }`} style={{ borderColor: "#eab308" }}>
          <div className="text-8xl mb-4">🏆</div>
          <h4 className="text-3xl font-display font-bold text-white mb-4">
            {isUserWinner ? "¡FELICIDADES, GANASTE!" : "¡Tenemos un Ganador!"}
          </h4>

          <div className="bg-profundo/50 border-2 border-dorado rounded-xl p-6 mb-4">
            <div className="text-sm text-gris mb-2">Ganador de la Ronda {currentRound}</div>
            <div className="font-mono text-2xl font-bold text-dorado mb-3">
              {winner.slice(0, 10)}...{winner.slice(-8)}
            </div>
            {isUserWinner && (
              <div className="inline-block bg-dorado/20 border border-dorado px-4 py-2 rounded-full">
                <span className="text-dorado font-bold">¡Eres tú! 🎉</span>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-dorado/20 to-pachamama/20 border-2 border-dorado/50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gris mb-1">Premio del Pozo</div>
            <div className="text-4xl font-display font-bold text-white">
              ${currentPot.toLocaleString()}
            </div>
            <div className="text-xs text-gris mt-2">
              {isUserWinner ? "Transferido a tu wallet" : "Transferido al ganador"}
            </div>
          </div>

          {isUserWinner && (
            <div className="bg-pachamama/10 border border-pachamama/30 rounded-lg p-4">
              <p className="text-sm text-white">
                🌾 <strong className="text-pachamama">Ayni cumplido:</strong> El círculo te ha bendecido.
                Continúa participando y apoyando a tu comunidad.
              </p>
            </div>
          )}

          {showConfetti && (
            <div className="text-6xl mt-4 animate-bounce">
              🎊 🎉 🎊
            </div>
          )}
        </div>
      )}

      {/* Info Cultural */}
      <div className="bg-gradient-to-r from-tierra/10 to-profundo border border-tierra rounded-xl p-4">
        <h5 className="text-sm font-display font-bold text-white mb-2 flex items-center gap-2">
          <span>🌾</span>
          Sobre el Pasanaku (Sorteo)
        </h5>
        <p className="text-xs text-gris leading-relaxed">
          El <strong className="text-white">Pasanaku</strong> es una tradición andina de ahorro comunitario.
          Cada ronda, el pozo acumulado se sortea entre los miembros presentes.
          Usamos <strong className="text-pachamama">Chainlink VRF</strong> para garantizar un sorteo
          justo, transparente y verificable en blockchain - modernizando la tradición ancestral.
        </p>
      </div>
    </div>
  );
}
