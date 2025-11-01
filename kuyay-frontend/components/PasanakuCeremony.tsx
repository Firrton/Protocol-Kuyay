"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Member {
  address: string;
  name?: string;
  aguayoLevel: number;
  hasPaid: boolean;
  isPresent: boolean;
}

interface PasanakuCeremonyProps {
  circleName: string;
  members: Member[];
  currentRound: number;
  potAmount: number;
  onCheckIn: () => void;
  onStartDraw: () => void;
  userAddress: string;
  isDrawing: boolean;
  winner?: string;
}

export default function PasanakuCeremony({
  circleName,
  members,
  currentRound,
  potAmount,
  onCheckIn,
  onStartDraw,
  userAddress,
  isDrawing,
  winner,
}: PasanakuCeremonyProps) {
  const [currentSlot, setCurrentSlot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const presentMembers = members.filter(m => m.isPresent);
  const allPaid = members.every(m => m.hasPaid);
  const presencePercentage = (presentMembers.length / members.length) * 100;
  const canDraw = allPaid && presencePercentage >= 30;

  const currentUser = members.find(m => m.address === userAddress);
  const userCheckedIn = currentUser?.isPresent || false;

  // Simulación de ruleta cuando está en sorteo
  useEffect(() => {
    if (isDrawing && !winner) {
      setSpinning(true);
      const interval = setInterval(() => {
        setCurrentSlot((prev) => (prev + 1) % presentMembers.length);
      }, 100);

      return () => clearInterval(interval);
    } else if (winner) {
      setSpinning(false);
      setShowCelebration(true);
    }
  }, [isDrawing, winner, presentMembers.length]);

  const getAguayoImage = (level: number) => {
    if (level === 0) return null;
    if (level === 1) return "/images/aguayo_1.png";
    if (level >= 2 && level <= 3) return "/images/aguayo_2.png";
    return "/images/aguayo_3.png";
  };

  return (
    <div className="min-h-screen bg-profundo pb-20">
      {/* Header - Ceremonia */}
      <div className="bg-gradient-to-b from-ceremonial/30 via-profundo to-profundo border-b-2 border-ceremonial py-8 px-6 aguayo-pattern">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4 animate-bounce">🎲</div>
          <h1 className="text-4xl font-display font-bold text-gradient mb-2">
            Ceremonia del Pasanaku
          </h1>
          <p className="text-gris text-lg">
            {circleName} - Ronda {currentRound}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-dorado/20 border border-dorado rounded-full">
            <span className="text-2xl">💰</span>
            <span className="text-white font-display font-bold text-xl">
              ${potAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Estado de la ceremonia */}
        <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-tierra rounded-2xl p-6">
          <h2 className="text-2xl font-display font-bold text-white mb-4 text-center">
            📋 Preparación de la Ceremonia
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Pagos */}
            <div className={`rounded-xl p-4 border-2 text-center ${
              allPaid
                ? "bg-pachamama/20 border-pachamama"
                : "bg-ceremonial/20 border-ceremonial"
            }`}>
              <div className="text-3xl mb-2">{allPaid ? "✅" : "⏳"}</div>
              <div className="font-bold text-white mb-1">Pagos Completos</div>
              <div className="text-sm text-gris">
                {members.filter(m => m.hasPaid).length}/{members.length} miembros
              </div>
            </div>

            {/* Presencia */}
            <div className={`rounded-xl p-4 border-2 text-center ${
              presencePercentage >= 30
                ? "bg-pachamama/20 border-pachamama"
                : "bg-ocre/20 border-ocre"
            }`}>
              <div className="text-3xl mb-2">{presencePercentage >= 30 ? "✅" : "⏰"}</div>
              <div className="font-bold text-white mb-1">Presencia</div>
              <div className="text-sm text-gris">
                {presentMembers.length}/{members.length} presentes ({Math.round(presencePercentage)}%)
              </div>
            </div>

            {/* Tu estado */}
            <div className={`rounded-xl p-4 border-2 text-center ${
              userCheckedIn
                ? "bg-dorado/20 border-dorado"
                : "bg-tierra/20 border-tierra"
            }`}>
              <div className="text-3xl mb-2">{userCheckedIn ? "🙋" : "👋"}</div>
              <div className="font-bold text-white mb-1">Tu Check-in</div>
              <div className="text-sm text-gris">
                {userCheckedIn ? "Presente" : "Ausente"}
              </div>
            </div>
          </div>

          {/* Botón de Check-in */}
          {!userCheckedIn && currentUser?.hasPaid && (
            <div className="mt-6 text-center">
              <button
                onClick={onCheckIn}
                className="bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-4 rounded-lg font-display font-bold text-lg hover:scale-105 transition-transform"
              >
                🙋 Marcar Presencia en la Ceremonia
              </button>
              <p className="text-xs text-gris mt-2">
                Debes estar presente para participar en el sorteo
              </p>
            </div>
          )}
        </div>

        {/* La Ruleta / Sorteo */}
        {canDraw && (
          <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-dorado rounded-2xl p-8">
            <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">
              🎯 La Rueda del Destino
            </h2>

            {/* Ruleta Visual */}
            <div className="relative">
              {/* Indicador superior */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 z-20">
                <div className="text-6xl drop-shadow-lg">👇</div>
              </div>

              {/* Contenedor de slots */}
              <div className="bg-profundo/50 rounded-2xl p-6 border-4 border-ceremonial/50 overflow-hidden">
                <div className={`flex gap-4 transition-transform duration-100 ${
                  spinning ? "" : "ease-out"
                }`}
                style={{
                  transform: `translateX(-${currentSlot * 120}px)`,
                }}>
                  {/* Repetir miembros para efecto continuo */}
                  {[...presentMembers, ...presentMembers, ...presentMembers].map((member, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 w-24 h-32 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                        idx % presentMembers.length === currentSlot && spinning
                          ? "border-dorado scale-110 bg-dorado/20"
                          : "border-tierra bg-profundo/30"
                      }`}
                    >
                      {/* Avatar/Aguayo */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 mb-2">
                        {getAguayoImage(member.aguayoLevel) ? (
                          <Image
                            src={getAguayoImage(member.aguayoLevel)!}
                            alt="Aguayo"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-tierra/50 flex items-center justify-center text-2xl">
                            🧵
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-white font-mono text-center px-1">
                        {member.address.slice(0, 6)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de sorteo */}
              {!isDrawing && !winner && (
                <div className="text-center mt-8">
                  <button
                    onClick={onStartDraw}
                    className="bg-gradient-to-r from-ceremonial via-ocre to-dorado text-white px-12 py-6 rounded-xl font-display font-bold text-2xl hover:scale-105 transition-transform shadow-2xl animate-pulse"
                  >
                    🎲 Iniciar Sorteo con Chainlink VRF
                  </button>
                  <p className="text-sm text-gris mt-3">
                    El ganador será seleccionado de forma aleatoria y verificable en blockchain
                  </p>
                </div>
              )}

              {/* Estado de sorteo */}
              {isDrawing && !winner && (
                <div className="text-center mt-8 space-y-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-ceremonial border-t-transparent mx-auto"></div>
                  <p className="text-white font-display font-bold text-xl">
                    ✨ Consultando a la Pachamama...
                  </p>
                  <p className="text-gris text-sm">
                    Chainlink VRF está generando aleatoriedad verificable
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Celebración del Ganador */}
        {showCelebration && winner && (
          <div className="fixed inset-0 bg-profundo/95 z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-gradient-to-br from-ceremonial/20 to-dorado/20 border-4 border-dorado rounded-3xl p-12 max-w-2xl w-full text-center space-y-6 animate-scale-in">
              {/* Confetti visual */}
              <div className="text-8xl animate-bounce">🎉</div>

              <h2 className="text-5xl font-display font-bold text-gradient">
                ¡Felicidades!
              </h2>

              <div className="bg-profundo/50 rounded-2xl p-8 border-2 border-dorado">
                <p className="text-gris mb-3">El ganador de esta ronda es:</p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  {(() => {
                    const winnerMember = members.find(m => m.address === winner);
                    const winnerImage = winnerMember ? getAguayoImage(winnerMember.aguayoLevel) : null;

                    return winnerImage ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-dorado">
                        <Image
                          src={winnerImage}
                          alt="Winner"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-tierra/50 border-4 border-dorado flex items-center justify-center text-4xl">
                        🧵
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-3xl font-display font-bold text-white font-mono">
                      {winner.slice(0, 6)}...{winner.slice(-4)}
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-dorado to-ceremonial rounded-full">
                  <span className="text-3xl">💰</span>
                  <span className="text-white font-display font-bold text-3xl">
                    ${potAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-gris text-sm">
                <p className="flex items-center justify-center gap-2">
                  <span>🔐</span>
                  <span>Sorteo verificado con Chainlink VRF</span>
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span>✅</span>
                  <span>Fondos transferidos automáticamente</span>
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span>📝</span>
                  <span>Registrado en blockchain para siempre</span>
                </p>
              </div>

              <button
                onClick={() => setShowCelebration(false)}
                className="bg-gradient-to-r from-pachamama to-ocre text-white px-8 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
              >
                Continuar al Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Explicación del proceso */}
        <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-tierra rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-white mb-4">
            📖 ¿Cómo funciona la Ceremonia?
          </h3>
          <div className="space-y-3 text-gris">
            <p className="flex items-start gap-2">
              <span className="text-ceremonial text-xl">1️⃣</span>
              <span><span className="text-white font-bold">Todos deben pagar:</span> Antes del sorteo, todos los miembros del ayllu deben haber pagado su cuota de la ronda.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-ceremonial text-xl">2️⃣</span>
              <span><span className="text-white font-bold">Presencia mínima:</span> Al menos 30% de los miembros deben marcar presencia (check-in) para que el sorteo sea válido.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-ceremonial text-xl">3️⃣</span>
              <span><span className="text-white font-bold">Sorteo justo:</span> Usamos Chainlink VRF, una tecnología que genera números aleatorios verificables en blockchain - nadie puede hacer trampa.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-ceremonial text-xl">4️⃣</span>
              <span><span className="text-white font-bold">Pago automático:</span> El ganador recibe los fondos automáticamente en su wallet. Todo queda registrado en blockchain.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-ceremonial text-xl">5️⃣</span>
              <span><span className="text-white font-bold">Celebración comunitaria:</span> Como en el pasanaku tradicional, este es un momento de celebración para toda la comunidad.</span>
            </p>
          </div>
        </div>

        {/* Lista de participantes */}
        <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-tierra rounded-2xl p-6">
          <h3 className="text-xl font-display font-bold text-white mb-4">
            👥 Participantes de esta Ronda
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {members.map((member, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  member.isPresent
                    ? "bg-pachamama/10 border-pachamama/30"
                    : "bg-profundo/50 border-tierra"
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                  {getAguayoImage(member.aguayoLevel) ? (
                    <Image
                      src={getAguayoImage(member.aguayoLevel)!}
                      alt="Member"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-tierra/50 flex items-center justify-center text-xl">
                      🧵
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white font-mono text-sm">
                    {member.address.slice(0, 6)}...{member.address.slice(-4)}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {member.hasPaid && (
                      <span className="text-xs bg-pachamama/20 text-pachamama px-2 py-0.5 rounded">
                        ✓ Pagado
                      </span>
                    )}
                    {member.isPresent && (
                      <span className="text-xs bg-dorado/20 text-dorado px-2 py-0.5 rounded">
                        🙋 Presente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
