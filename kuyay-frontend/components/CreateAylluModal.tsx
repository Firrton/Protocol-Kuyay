"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";
import { useCreateSavingsCircle, useCreateCreditCircle } from "@/hooks/useCircles";
import { useHasAguayo } from "@/hooks/useAguayo";

type CircleMode = "SAVINGS" | "CREDIT";

interface CircleConfig {
  mode: CircleMode;
  name: string;
  memberCount: number;
  cuotaAmount: number;
  guaranteeAmount: number;
  totalRounds: number;
  leverage?: number; // Solo para CREDIT
  invitedAddresses: string[];
}

interface CreateAylluModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCircleCreated?: () => void; // Callback para refrescar la lista de círculos
}

export default function CreateAylluModal({ isOpen, onClose, onCircleCreated }: CreateAylluModalProps) {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<CircleConfig>({
    mode: "SAVINGS",
    name: "",
    memberCount: 5,
    cuotaAmount: 100,
    guaranteeAmount: 200,
    totalRounds: 5,
    invitedAddresses: [],
  });

  const [newAddress, setNewAddress] = useState("");

  // Ref para rastrear si ya mostramos el mensaje de éxito
  const hasShownSuccessRef = useRef(false);

  // Verificar si el usuario tiene Aguayo
  const { hasAguayo, isLoading: isLoadingAguayo } = useHasAguayo();

  // Hooks para crear círculos
  const {
    createSavingsCircle,
    isPending: isSavingsPending,
    isConfirming: isSavingsConfirming,
    isConfirmed: isSavingsConfirmed,
    error: savingsError,
  } = useCreateSavingsCircle();

  const {
    createCreditCircle,
    isPending: isCreditPending,
    isConfirming: isCreditConfirming,
    isConfirmed: isCreditConfirmed,
    error: creditError,
  } = useCreateCreditCircle();

  const isCreating = isSavingsPending || isCreditPending || isSavingsConfirming || isCreditConfirming;
  const isConfirmed = isSavingsConfirmed || isCreditConfirmed;
  const error = savingsError || creditError;

  // Cerrar modal cuando se confirma la creación
  useEffect(() => {
    if (isConfirmed && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      alert("¡Círculo creado exitosamente! 🎉\n\nLos miembros invitados ya pueden ver el círculo en su dashboard.");

      // Refrescar la lista de círculos en el dashboard
      if (onCircleCreated) {
        onCircleCreated();
      }

      onClose();
      // Reset config
      setConfig({
        mode: "SAVINGS",
        name: "",
        memberCount: 5,
        cuotaAmount: 100,
        guaranteeAmount: 200,
        totalRounds: 5,
        invitedAddresses: [],
      });
      setCurrentStep(1);

      // Resetear el ref después de un tiempo para permitir crear otro círculo
      setTimeout(() => {
        hasShownSuccessRef.current = false;
      }, 1000);
    }
  }, [isConfirmed, onClose, onCircleCreated]);

  // Mostrar error si hay
  useEffect(() => {
    if (error) {
      console.error("Error creando círculo:", error);
      alert(`Error al crear el círculo:\n${error.message}`);
    }
  }, [error]);

  // Early return DESPUÉS de todos los hooks
  if (!isOpen) return null;

  const totalSteps = 4;

  // Calcular datos derivados
  const monthlyPot = config.cuotaAmount * config.memberCount;
  const totalGuaranteePool = config.guaranteeAmount * config.memberCount;
  const protocolLoan = config.mode === "CREDIT" && config.leverage
    ? monthlyPot * (config.leverage - 1)
    : 0;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddAddress = () => {
    if (newAddress && newAddress.startsWith("0x") && newAddress.length === 42) {
      if (!config.invitedAddresses.includes(newAddress) && newAddress !== address) {
        setConfig({
          ...config,
          invitedAddresses: [...config.invitedAddresses, newAddress],
        });
        setNewAddress("");
      }
    }
  };

  const handleRemoveAddress = (addr: string) => {
    setConfig({
      ...config,
      invitedAddresses: config.invitedAddresses.filter(a => a !== addr),
    });
  };

  const handleCreateCircle = async () => {
    if (!CONTRACTS_DEPLOYED.circleFactory) {
      alert("Smart contracts aún no desplegados. Esta función estará disponible pronto.");
      return;
    }

    if (!address) {
      alert("Conecta tu wallet primero");
      return;
    }

    // ⚠️ VALIDACIÓN CRÍTICA: Verificar que el usuario tenga Aguayo
    if (!hasAguayo && !isLoadingAguayo) {
      alert("❌ No tienes un Aguayo NFT\n\n" +
            "Para crear un círculo, primero debes mintear tu Aguayo.\n\n" +
            "Ve a 'Mi Perfil' y haz clic en 'Mintear Aguayo'.");
      return;
    }

    // Validar que haya suficientes miembros
    if (config.invitedAddresses.length < config.memberCount - 1) {
      alert(`Necesitas invitar a ${config.memberCount - 1} miembros más.\nActualmente solo has invitado ${config.invitedAddresses.length}.`);
      return;
    }

    // Advertencia sobre miembros invitados
    const shouldContinue = confirm(
      "⚠️ IMPORTANTE:\n\n" +
      "Todos los miembros invitados DEBEN tener un Aguayo NFT minteado.\n\n" +
      "Si algún miembro no tiene Aguayo, la transacción fallará y perderás el gas.\n\n" +
      "¿Estás seguro de que TODOS los miembros tienen Aguayo?"
    );

    if (!shouldContinue) {
      return;
    }

    try {
      console.log("🔄 Creando círculo con:", {
        mode: config.mode,
        cuotaAmount: config.cuotaAmount,
        guaranteeAmount: config.guaranteeAmount,
        members: [address, ...config.invitedAddresses],
      });

      if (config.mode === "SAVINGS") {
        await createSavingsCircle(
          config.cuotaAmount,
          config.guaranteeAmount,
          config.invitedAddresses
        );
      } else {
        await createCreditCircle(
          config.cuotaAmount,
          config.guaranteeAmount,
          config.invitedAddresses
        );
      }
    } catch (err: any) {
      console.error("Error al crear círculo:", err);

      // Mensajes de error más específicos
      let errorMessage = "Error al crear el círculo:\n\n";

      if (err.message?.includes("User rejected")) {
        errorMessage += "Cancelaste la transacción.";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage += "No tienes suficiente ETH para pagar el gas.";
      } else if (err.message?.includes("reverted")) {
        errorMessage += "El contrato rechazó la transacción.\n\n" +
                       "Posibles causas:\n" +
                       "• Algún miembro no tiene Aguayo NFT\n" +
                       "• Parámetros inválidos\n" +
                       "• Problemas con el contrato";
      } else {
        errorMessage += err.message || "Error desconocido";
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
      <div className="bg-profundo border-2 border-ocre rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-profundo border-b border-tierra p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-bold text-gradient">
              Crear Nuevo Ayllu
            </h2>
            <p className="text-gris text-sm mt-1">
              Paso {currentStep} de {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gris hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                  step <= currentStep
                    ? "bg-gradient-to-r from-ceremonial to-ocre"
                    : "bg-tierra/30"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gris">
            <span className={currentStep >= 1 ? "text-ocre" : ""}>Modo</span>
            <span className={currentStep >= 2 ? "text-ocre" : ""}>Configuración</span>
            <span className={currentStep >= 3 ? "text-ocre" : ""}>Invitar</span>
            <span className={currentStep >= 4 ? "text-ocre" : ""}>Crear</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* PASO 1: Selección de Modo */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  ¿Qué tipo de Ayllu deseas crear?
                </h3>
                <p className="text-gris text-sm">
                  Selecciona el modo según tu objetivo financiero
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Modo Ahorro */}
                <button
                  onClick={() => setConfig({ ...config, mode: "SAVINGS", leverage: undefined })}
                  className={`border-2 rounded-xl p-6 transition-all text-left ${
                    config.mode === "SAVINGS"
                      ? "border-pachamama bg-pachamama/10"
                      : "border-tierra hover:border-pachamama/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">💰</div>
                    {config.mode === "SAVINGS" && (
                      <div className="text-pachamama text-2xl">✓</div>
                    )}
                  </div>
                  <h4 className="text-xl font-display font-bold text-white mb-2">
                    Círculo de Ahorro
                  </h4>
                  <p className="text-gris text-sm mb-4">
                    Todos aportan y cada ronda un miembro recibe el pozo completo.
                    Perfecto para ahorrar en grupo.
                  </p>
                  <div className="space-y-1 text-xs text-gris">
                    <p>✓ Sin apalancamiento</p>
                    <p>✓ Menor riesgo</p>
                    <p>✓ Abierto a todos los niveles</p>
                  </div>
                </button>

                {/* Modo Crédito */}
                <button
                  onClick={() => setConfig({ ...config, mode: "CREDIT", leverage: 2 })}
                  className={`border-2 rounded-xl p-6 transition-all text-left ${
                    config.mode === "CREDIT"
                      ? "border-dorado bg-dorado/10"
                      : "border-tierra hover:border-dorado/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">🚀</div>
                    {config.mode === "CREDIT" && (
                      <div className="text-dorado text-2xl">✓</div>
                    )}
                  </div>
                  <h4 className="text-xl font-display font-bold text-white mb-2">
                    Círculo de Crédito
                  </h4>
                  <p className="text-gris text-sm mb-4">
                    El protocolo presta dinero extra para multiplicar el pozo.
                    Acceso a capital apalancado.
                  </p>
                  <div className="space-y-1 text-xs text-gris">
                    <p>✓ Apalancamiento hasta 5x</p>
                    <p>⚠️ Mayor responsabilidad</p>
                    <p>🔒 Requiere Aguayo Nivel 1+</p>
                  </div>
                </button>
              </div>

              {/* Info adicional */}
              <div className="bg-profundo/50 rounded-xl p-4 border border-tierra">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div className="flex-1 text-sm text-gris space-y-2">
                    <p>
                      <strong className="text-white">Círculo de Ahorro:</strong> Ideal para comenzar,
                      construir historial y acceder a tu primer Aguayo.
                    </p>
                    <p>
                      <strong className="text-white">Círculo de Crédito:</strong> Para usuarios con
                      historial comprobado que necesitan acceso a mayor liquidez.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Configuración */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  Configura tu {config.mode === "SAVINGS" ? "Círculo de Ahorro" : "Círculo de Crédito"}
                </h3>
                <p className="text-gris text-sm">
                  Define los parámetros financieros del Ayllu
                </p>
              </div>

              {/* Nombre del Ayllu */}
              <div>
                <label className="block text-white font-display font-bold mb-2">
                  Nombre del Ayllu
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="ej: Pachamama, Inti, Wiphala..."
                  className="w-full bg-profundo/50 border border-tierra rounded-lg px-4 py-3 text-white focus:border-ocre focus:outline-none"
                />
                <p className="text-xs text-gris mt-1">
                  Dale un nombre significativo a tu comunidad
                </p>
              </div>

              {/* Número de Miembros */}
              <div>
                <label className="block text-white font-display font-bold mb-2">
                  Número de Miembros: {config.memberCount}
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={config.memberCount}
                  onChange={(e) => setConfig({ ...config, memberCount: parseInt(e.target.value) })}
                  className="w-full accent-ocre"
                />
                <div className="flex justify-between text-xs text-gris mt-1">
                  <span>3 min</span>
                  <span>12 max</span>
                </div>
              </div>

              {/* Cuota Mensual */}
              <div>
                <label className="block text-white font-display font-bold mb-2">
                  Cuota Mensual (USDC)
                </label>
                <input
                  type="number"
                  value={config.cuotaAmount}
                  onChange={(e) => setConfig({ ...config, cuotaAmount: parseFloat(e.target.value) || 0 })}
                  min="10"
                  step="10"
                  className="w-full bg-profundo/50 border border-tierra rounded-lg px-4 py-3 text-white focus:border-ocre focus:outline-none"
                />
                <p className="text-xs text-gris mt-1">
                  Monto que cada miembro debe pagar cada ronda
                </p>
              </div>

              {/* Garantía */}
              <div>
                <label className="block text-white font-display font-bold mb-2">
                  Garantía por Miembro (USDC)
                </label>
                <input
                  type="number"
                  value={config.guaranteeAmount}
                  onChange={(e) => setConfig({ ...config, guaranteeAmount: parseFloat(e.target.value) || 0 })}
                  min="50"
                  step="50"
                  className="w-full bg-profundo/50 border border-tierra rounded-lg px-4 py-3 text-white focus:border-ocre focus:outline-none"
                />
                <p className="text-xs text-gris mt-1">
                  Depósito de seguridad que se devuelve al finalizar
                </p>
              </div>

              {/* Duración */}
              <div>
                <label className="block text-white font-display font-bold mb-2">
                  Duración (Rondas): {config.totalRounds}
                </label>
                <input
                  type="range"
                  min={config.memberCount}
                  max={config.memberCount}
                  value={config.totalRounds}
                  onChange={(e) => setConfig({ ...config, totalRounds: parseInt(e.target.value) })}
                  className="w-full accent-ocre"
                  disabled
                />
                <p className="text-xs text-gris mt-1">
                  Cada miembro recibe el pozo una vez = {config.memberCount} rondas
                </p>
              </div>

              {/* Apalancamiento (solo CREDIT) */}
              {config.mode === "CREDIT" && (
                <div>
                  <label className="block text-white font-display font-bold mb-2">
                    Nivel de Apalancamiento: {config.leverage}x
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="5"
                    step="0.5"
                    value={config.leverage || 2}
                    onChange={(e) => setConfig({ ...config, leverage: parseFloat(e.target.value) })}
                    className="w-full accent-dorado"
                  />
                  <div className="flex justify-between text-xs text-gris mt-1">
                    <span>2x</span>
                    <span>5x</span>
                  </div>
                  <p className="text-xs text-dorado mt-1">
                    El Vault prestará ${((config.leverage || 2) - 1) * monthlyPot} USDC por ronda
                  </p>
                </div>
              )}

              {/* Preview de montos */}
              <div className="bg-profundo/70 rounded-xl p-4 border border-dorado/30 space-y-3">
                <h4 className="font-display font-bold text-white">📊 Resumen Financiero</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gris">Pozo Mensual</div>
                    <div className="text-white font-bold">${monthlyPot} USDC</div>
                  </div>
                  <div>
                    <div className="text-gris">Pool de Garantías</div>
                    <div className="text-white font-bold">${totalGuaranteePool} USDC</div>
                  </div>
                  {config.mode === "CREDIT" && (
                    <>
                      <div>
                        <div className="text-gris">Préstamo Vault</div>
                        <div className="text-dorado font-bold">${protocolLoan} USDC</div>
                      </div>
                      <div>
                        <div className="text-gris">Pozo Total Apalancado</div>
                        <div className="text-dorado font-bold">${monthlyPot * (config.leverage || 2)} USDC</div>
                      </div>
                    </>
                  )}
                  <div>
                    <div className="text-gris">Duración Total</div>
                    <div className="text-white font-bold">{config.totalRounds} meses</div>
                  </div>
                  <div>
                    <div className="text-gris">Compromiso por Miembro</div>
                    <div className="text-white font-bold">${config.cuotaAmount * config.totalRounds} USDC</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Invitar Miembros */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  Invita a los Miembros
                </h3>
                <p className="text-gris text-sm">
                  Necesitas {config.memberCount - 1} miembros más (tú eres el primero)
                </p>
              </div>

              {/* Input para agregar direcciones */}
              <div>
                <label className="block text-white font-display font-bold mb-2">
                  Dirección de Wallet
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 bg-profundo/50 border border-tierra rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-ocre focus:outline-none"
                  />
                  <button
                    onClick={handleAddAddress}
                    className="bg-gradient-to-r from-ceremonial to-ocre text-white px-6 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
                  >
                    Agregar
                  </button>
                </div>
                <p className="text-xs text-gris mt-1">
                  {config.invitedAddresses.length} de {config.memberCount - 1} miembros invitados
                </p>
              </div>

              {/* Lista de direcciones agregadas */}
              {config.invitedAddresses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-display font-bold">Miembros Invitados:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {config.invitedAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-profundo/50 border border-tierra rounded-lg px-4 py-3"
                      >
                        <span className="text-white font-mono text-sm">{addr}</span>
                        <button
                          onClick={() => handleRemoveAddress(addr)}
                          className="text-ceremonial hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info sobre invitaciones */}
              <div className={`rounded-xl p-4 border ${
                config.invitedAddresses.length >= config.memberCount - 1
                  ? "bg-pachamama/10 border-pachamama/50"
                  : "bg-profundo/50 border-tierra"
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {config.invitedAddresses.length >= config.memberCount - 1 ? "✅" : "💡"}
                  </div>
                  <div className="flex-1 text-sm text-gris space-y-2">
                    <p>
                      <strong className="text-white">IMPORTANTE:</strong> Debes agregar TODAS las {config.memberCount - 1} direcciones
                      de los miembros antes de crear el círculo.
                    </p>
                    {config.invitedAddresses.length >= config.memberCount - 1 ? (
                      <p className="text-pachamama font-bold">
                        ✓ ¡Perfecto! Ya agregaste todas las direcciones necesarias.
                      </p>
                    ) : (
                      <p className="text-ceremonial">
                        ⚠️ Faltan {config.memberCount - 1 - config.invitedAddresses.length} miembros por agregar.
                      </p>
                    )}
                    {config.mode === "CREDIT" && (
                      <p className="text-dorado">
                        ⚠️ Para círculos de crédito, los miembros deben tener Aguayo Nivel 1+
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Revisar y Crear */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  Revisa y Confirma
                </h3>
                <p className="text-gris text-sm">
                  Verifica que toda la información sea correcta antes de crear
                </p>
              </div>

              {/* Resumen visual */}
              <div className="bg-gradient-to-br from-profundo via-tierra/10 to-profundo border-2 border-dorado/50 rounded-2xl p-6 space-y-4">
                {/* Título */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-display font-bold text-white">
                      {config.name || "Sin nombre"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        config.mode === "CREDIT"
                          ? "bg-dorado/20 text-dorado border border-dorado/50"
                          : "bg-pachamama/20 text-pachamama border border-pachamama/50"
                      }`}>
                        {config.mode === "CREDIT" ? `CRÉDITO ${config.leverage}x` : "AHORRO"}
                      </span>
                    </div>
                  </div>
                  <div className="text-5xl">
                    {config.mode === "CREDIT" ? "🚀" : "💰"}
                  </div>
                </div>

                {/* Grid de info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                    <div className="text-xs text-gris mb-1">Miembros</div>
                    <div className="text-xl font-display font-bold text-white">
                      {config.memberCount}
                    </div>
                  </div>
                  <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                    <div className="text-xs text-gris mb-1">Cuota Mensual</div>
                    <div className="text-xl font-display font-bold text-white">
                      ${config.cuotaAmount}
                    </div>
                  </div>
                  <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                    <div className="text-xs text-gris mb-1">Garantía</div>
                    <div className="text-xl font-display font-bold text-white">
                      ${config.guaranteeAmount}
                    </div>
                  </div>
                  <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                    <div className="text-xs text-gris mb-1">Pozo Mensual</div>
                    <div className="text-xl font-display font-bold text-dorado">
                      ${config.mode === "CREDIT" ? monthlyPot * (config.leverage || 2) : monthlyPot}
                    </div>
                  </div>
                  <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                    <div className="text-xs text-gris mb-1">Duración</div>
                    <div className="text-xl font-display font-bold text-white">
                      {config.totalRounds} meses
                    </div>
                  </div>
                  <div className="bg-profundo/50 rounded-lg p-3 border border-tierra">
                    <div className="text-xs text-gris mb-1">Invitados</div>
                    <div className="text-xl font-display font-bold text-white">
                      {config.invitedAddresses.length}
                    </div>
                  </div>
                </div>

                {/* Compromisos */}
                <div className="bg-profundo/70 rounded-lg p-4 border border-ocre/30">
                  <h5 className="font-display font-bold text-white mb-2">Tu Compromiso:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gris">Depósito de Garantía:</span>
                      <span className="text-white font-bold">${config.guaranteeAmount} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gris">Cuota x {config.totalRounds} meses:</span>
                      <span className="text-white font-bold">${config.cuotaAmount * config.totalRounds} USDC</span>
                    </div>
                    <div className="border-t border-tierra pt-2 flex justify-between">
                      <span className="text-gris">Total a aportar:</span>
                      <span className="text-dorado font-bold text-lg">
                        ${config.guaranteeAmount + (config.cuotaAmount * config.totalRounds)} USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alertas importantes */}
              <div className="space-y-3">
                {/* Alerta si no tiene Aguayo */}
                {!hasAguayo && !isLoadingAguayo && (
                  <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">🚫</div>
                      <div className="flex-1 text-sm">
                        <p className="text-red-400 font-bold mb-2 text-base">¡NO PUEDES CREAR ESTE CÍRCULO!</p>
                        <p className="text-red-300 mb-2">
                          No tienes un Aguayo NFT. Es OBLIGATORIO tener uno para crear círculos.
                        </p>
                        <p className="text-white font-bold">
                          👉 Ve a "Mi Perfil" y mintea tu Aguayo primero.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alerta sobre miembros con Aguayo */}
                {hasAguayo && (
                  <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚠️</div>
                      <div className="flex-1 text-sm text-gris">
                        <p className="text-yellow-400 font-bold mb-1">Verificación de Miembros:</p>
                        <p className="text-yellow-200">
                          TODOS los miembros invitados ({config.invitedAddresses.length}) DEBEN tener un Aguayo NFT minteado.
                        </p>
                        <p className="text-white mt-2">
                          Si alguno no tiene Aguayo, la transacción fallará y perderás el gas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-ceremonial/10 border border-ceremonial/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1 text-sm text-gris">
                      <p className="text-white font-bold mb-1">Importante:</p>
                      <p>
                        Al crear este Ayllu te comprometes a realizar los pagos mensuales puntualmente.
                        Los incumplimientos quedan registrados permanentemente en tu Aguayo.
                      </p>
                    </div>
                  </div>
                </div>

                {!CONTRACTS_DEPLOYED.circleFactory && (
                  <div className="bg-ocre/10 border border-ocre/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🚧</div>
                      <div className="flex-1 text-sm text-gris">
                        <p className="text-ocre font-bold mb-1">Modo de Prueba:</p>
                        <p>
                          Los smart contracts aún no están desplegados. Esta configuración se guardará
                          pero el círculo se creará cuando los contratos estén listos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-profundo border-t border-tierra p-6 flex justify-between">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="border-2 border-tierra text-gris px-6 py-3 rounded-lg font-display font-bold hover:border-ocre hover:text-ocre transition-colors"
          >
            {currentStep === 1 ? "Cancelar" : "← Atrás"}
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleCreateCircle}
              disabled={
                isCreating ||
                !config.name ||
                config.invitedAddresses.length < config.memberCount - 1 ||
                (!hasAguayo && !isLoadingAguayo)
              }
              className="bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={!hasAguayo ? "Necesitas mintear un Aguayo primero" : ""}
            >
              {isSavingsPending || isCreditPending
                ? "⏳ Esperando confirmación..."
                : isSavingsConfirming || isCreditConfirming
                ? "⛓️ Confirmando en blockchain..."
                : !hasAguayo && !isLoadingAguayo
                ? "🚫 Necesitas Aguayo NFT"
                : "🎉 Crear Ayllu"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
