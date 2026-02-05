"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QuickRiskBadge from "@/components/QuickRiskBadge";
import { useCreateSavingsCircle } from "@/hooks/useCircles";

export default function CreateCirclePage() {
  const { address,isConnected } = useAccount();
  const router = useRouter();
  const [step,setStep] = useState(1);

  // Hook para crear círculo
  const {
    createSavingsCircle,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  } = useCreateSavingsCircle();

  // Form state
  const [formData,setFormData] = useState({
    circleName: "",
    cuotaAmount: "100",
    guaranteeAmount: "500",
    totalRounds: "12",
    members: [] as string[],
    newMemberInput: "",
  });

  // Agregar miembro
  const handleAddMember = () => {
    if (formData.newMemberInput && !formData.members.includes(formData.newMemberInput)) {
      setFormData({
        ...formData,
        members: [...formData.members,formData.newMemberInput],
        newMemberInput: "",
      });
    }
  };

  // Remover miembro
  const handleRemoveMember = (addressToRemove: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter((addr) => addr !== addressToRemove),
    });
  };

  // Validar dirección Ethereum
  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // Crear círculo
  const handleCreateCircle = async () => {
    if (!address) {
      alert("❌ No estás conectado con una wallet");
      return;
    }

    if (formData.members.length === 0) {
      alert("❌ Debes agregar al menos un miembro invitado");
      return;
    }

    // Validar que todas las direcciones sean válidas
    for (const member of formData.members) {
      if (!isValidAddress(member)) {
        alert(`❌ Dirección inválida: ${member}\n\nAsegúrate de que todas las direcciones empiecen con 0x y tengan 42 caracteres.`);
        return;
      }
    }

    try {
      // El hook ya incluye la dirección del usuario automáticamente
      await createSavingsCircle(
        parseFloat(formData.cuotaAmount),
        parseFloat(formData.guaranteeAmount),
        formData.members
      );
    } catch (err) {
      console.error("Error creando círculo:",err);
    }
  };

  // Redirigir al dashboard cuando se confirme
  if (isConfirmed) {
    router.push("/dashboard");
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-profundo flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gradient-to-br from-tierra/10 to-profundo border-2 border-tierra rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-display font-bold text-white mb-3">
            Conecta tu Wallet
          </h2>
          <p className="text-gris mb-6">
            Necesitas conectar tu wallet para crear un círculo de ahorro
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-pachamama to-dorado text-white rounded-lg font-display font-bold hover:scale-105 transition-all"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-profundo">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-ocre hover:text-white transition-colors mb-4"
          >
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <span className="text-5xl">🌾</span>
            Crear Nuevo Ayllu
          </h1>
          <p className="text-gris">
            Forma un círculo de ahorro con reciprocidad y confianza mutua
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1,2,3].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold transition-all ${step >= num
                    ? "bg-gradient-to-r from-pachamama to-dorado text-white"
                    : "bg-tierra/20 text-gris"
                  }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`w-16 h-1 ${step > num ? "bg-pachamama" : "bg-tierra/20"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Información Básica */}
        {step === 1 && (
          <div className="bg-gradient-to-br from-tierra/10 to-profundo border-2 border-tierra rounded-2xl p-8">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <span>📝</span>
              Paso 1: Información del Círculo
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-display font-semibold mb-2">
                  Nombre del Círculo
                </label>
                <input
                  type="text"
                  value={formData.circleName}
                  onChange={(e) =>
                    setFormData({ ...formData,circleName: e.target.value })
                  }
                  placeholder="Ej: Ayllu de Comerciantes"
                  className="w-full px-4 py-3 bg-profundo border border-tierra rounded-lg text-white placeholder-gris focus:outline-none focus:border-pachamama transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-display font-semibold mb-2">
                    Cuota Mensual (USDC)
                  </label>
                  <input
                    type="number"
                    value={formData.cuotaAmount}
                    onChange={(e) =>
                      setFormData({ ...formData,cuotaAmount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-profundo border border-tierra rounded-lg text-white focus:outline-none focus:border-pachamama transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white font-display font-semibold mb-2">
                    Garantía (USDC)
                  </label>
                  <input
                    type="number"
                    value={formData.guaranteeAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guaranteeAmount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-profundo border border-tierra rounded-lg text-white focus:outline-none focus:border-pachamama transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-display font-semibold mb-2">
                  Número de Rondas (meses)
                </label>
                <input
                  type="number"
                  value={formData.totalRounds}
                  onChange={(e) =>
                    setFormData({ ...formData,totalRounds: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-profundo border border-tierra rounded-lg text-white focus:outline-none focus:border-pachamama transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.circleName || !formData.cuotaAmount}
              className={`w-full mt-6 px-6 py-4 rounded-xl font-display font-bold text-white text-lg transition-all ${formData.circleName && formData.cuotaAmount
                  ? "bg-gradient-to-r from-pachamama to-dorado hover:scale-105 cursor-pointer"
                  : "bg-tierra/30 cursor-not-allowed opacity-50"
                }`}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2: Selección de Miembros + Risk Badge */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-tierra/10 to-profundo border-2 border-tierra rounded-2xl p-8">
              <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <span>👥</span>
                Paso 2: Selecciona los Miembros del Ayllu
              </h2>

              {/* Input para agregar miembro */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={formData.newMemberInput}
                  onChange={(e) =>
                    setFormData({ ...formData,newMemberInput: e.target.value })
                  }
                  placeholder="Dirección de wallet (0x...)"
                  className="flex-1 px-4 py-3 bg-profundo border border-tierra rounded-lg text-white placeholder-gris focus:outline-none focus:border-pachamama transition-colors"
                />
                <button
                  onClick={handleAddMember}
                  disabled={!formData.newMemberInput}
                  className="px-6 py-3 bg-gradient-to-r from-pachamama to-dorado text-white rounded-lg font-display font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar
                </button>
              </div>

              {/* Lista de miembros */}
              {formData.members.length > 0 && (
                <div className="space-y-2 mb-6">
                  {formData.members.map((member,idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-profundo border border-tierra rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👤</span>
                        <span className="font-mono text-white text-sm">
                          {member.slice(0,6)}...{member.slice(-4)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-ceremonial hover:text-white transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.members.length === 0 && (
                <div className="text-center py-12 text-gris">
                  <div className="text-6xl mb-4">🏔️</div>
                  <p>Aún no has agregado miembros al Ayllu</p>
                </div>
              )}
            </div>

            {/* Faith-based system info */}
            {formData.members.length >= 2 && (
              <QuickRiskBadge
                memberAddresses={formData.members}
                onViewDetails={() => {
                  // Monte Carlo removed - using Faith system now
                  console.log("Showing Faith-based info");
                }}
              />
            )}

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-4 border-2 border-tierra text-gris rounded-xl font-display font-bold hover:bg-tierra/20 hover:text-white transition-all"
              >
                ← Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={formData.members.length < 2}
                className={`flex-1 px-6 py-4 rounded-xl font-display font-bold text-white text-lg transition-all ${formData.members.length >= 2
                    ? "bg-gradient-to-r from-pachamama to-dorado hover:scale-105 cursor-pointer"
                    : "bg-tierra/30 cursor-not-allowed opacity-50"
                  }`}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmación */}
        {step === 3 && (
          <div className="bg-gradient-to-br from-tierra/10 to-profundo border-2 border-tierra rounded-2xl p-8">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <span>✅</span>
              Paso 3: Confirmar y Crear
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-profundo border border-tierra rounded-lg p-4">
                <p className="text-gris text-sm mb-1">Nombre del Círculo</p>
                <p className="text-white font-display font-bold text-lg">
                  {formData.circleName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-profundo border border-tierra rounded-lg p-4">
                  <p className="text-gris text-sm mb-1">Cuota Mensual</p>
                  <p className="text-white font-display font-bold text-lg">
                    ${formData.cuotaAmount} USDC
                  </p>
                </div>
                <div className="bg-profundo border border-tierra rounded-lg p-4">
                  <p className="text-gris text-sm mb-1">Garantía</p>
                  <p className="text-white font-display font-bold text-lg">
                    ${formData.guaranteeAmount} USDC
                  </p>
                </div>
              </div>

              <div className="bg-profundo border border-tierra rounded-lg p-4">
                <p className="text-gris text-sm mb-1">Miembros</p>
                <p className="text-white font-display font-bold text-lg">
                  {formData.members.length} personas
                </p>
              </div>
            </div>

            <div className="bg-ocre/10 border border-ocre/30 rounded-lg p-4 mb-6">
              <p className="text-white text-sm leading-relaxed">
                <span className="text-2xl mr-2">⚠️</span>
                <strong>Importante:</strong> Al crear este círculo, te comprometes
                a realizar {formData.totalRounds} pagos mensuales de ${formData.cuotaAmount} USDC.
                Asegúrate de poder cumplir con esta responsabilidad.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                disabled={isPending || isConfirming}
                className="flex-1 px-6 py-4 border-2 border-tierra text-gris rounded-xl font-display font-bold hover:bg-tierra/20 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Atrás
              </button>
              <button
                onClick={handleCreateCircle}
                disabled={isPending || isConfirming || formData.members.length === 0}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-pachamama to-dorado text-white rounded-xl font-display font-bold text-lg hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                )}
                {isConfirming && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                )}
                {isPending ? "Confirma en tu wallet..." : isConfirming ? "Creando círculo..." : "🌾 Crear Ayllu"}
              </button>
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-4 bg-ceremonial/10 border border-ceremonial rounded-lg p-4">
                <div className="text-ceremonial font-bold mb-2">❌ Error al crear círculo</div>
                <div className="text-sm text-gris">
                  {error.message?.includes("user rejected")
                    ? "Rechazaste la transacción en tu wallet"
                    : error.message}
                </div>
              </div>
            )}

            {/* Success message */}
            {isConfirmed && (
              <div className="mt-4 bg-pachamama/10 border border-pachamama rounded-lg p-4">
                <div className="text-pachamama font-bold mb-2">✅ ¡Círculo creado exitosamente!</div>
                <div className="text-sm text-gris">
                  Redirigiendo al dashboard...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Faith-based system - Monte Carlo removed */}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(139, 115, 85, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 115, 85, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 115, 85, 0.7);
        }
      `}</style>
    </div>
  );
}
