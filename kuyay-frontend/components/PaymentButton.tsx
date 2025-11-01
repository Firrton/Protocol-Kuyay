"use client";

import { useState, useEffect } from "react";
import { useMakePayment } from "@/hooks/useCircles";
import PaymentLoadingOverlay from "./PaymentLoadingOverlay";

interface PaymentButtonProps {
  circleAddress: string;
  circleName: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

export default function PaymentButton({
  circleAddress,
  circleName,
  amount,
  onPaymentSuccess,
}: PaymentButtonProps) {
  const { makePayment, isPending, isConfirming, isConfirmed, error, paymentStep, isProcessing, hash } = useMakePayment();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [overlayStep, setOverlayStep] = useState<"idle" | "approving" | "paying" | "success">("idle");
  const [paymentHash, setPaymentHash] = useState<string | null>(null);

  // Sincronizar overlayStep con paymentStep y capturar hash del pago
  useEffect(() => {
    console.log("🔄 PaymentStep changed:", paymentStep, "hash:", hash);
    if (paymentStep === "approving") {
      setOverlayStep("approving");
    } else if (paymentStep === "paying") {
      setOverlayStep("paying");
      // Guardar hash cuando cambia a paying
      if (hash) {
        console.log("💰 Payment transaction started with hash:", hash);
        setPaymentHash(hash);
      }
    }
  }, [paymentStep, hash]);

  // Guardar hash cuando aparece durante el paying
  useEffect(() => {
    if (paymentStep === "paying" && hash && !paymentHash) {
      console.log("💰 Late payment hash capture:", hash);
      setPaymentHash(hash);
    }
  }, [hash, paymentStep, paymentHash]);

  // Detectar cuando se confirma el PAGO (no la aprobación)
  useEffect(() => {
    console.log("✅ Confirmation check:", { 
      isConfirmed, 
      paymentStep, 
      paymentHash, 
      currentHash: hash, 
      overlayStep,
      hashMatch: hash === paymentHash
    });

    // Solo cerrar cuando:
    // 1. La transacción está confirmada
    // 2. Estamos en el paso de pagar
    // 3. El paymentHash coincide con el hash actual (o no hay paymentHash guardado pero hay hash)
    if (isConfirmed && paymentStep === "paying" && (hash === paymentHash || (!paymentHash && hash))) {
      console.log("🎉 Payment CONFIRMED! Hash:", hash);

      // Cambiar a estado de éxito
      setOverlayStep("success");
      setShowSuccess(true);
      onPaymentSuccess?.();

      // Cerrar overlay después de mostrar éxito
      setTimeout(() => {
        console.log("🚪 Closing overlay...");
        setShowLoadingOverlay(false);
        setOverlayStep("idle");
        setPaymentHash(null);
      }, 2000);

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }
  }, [isConfirmed, paymentStep, paymentHash, hash, overlayStep, onPaymentSuccess]);

  // Mostrar overlay cuando se está procesando
  useEffect(() => {
    if (paymentStep !== "idle" || isPending || isConfirming) {
      setShowLoadingOverlay(true);
    }
  }, [paymentStep, isPending, isConfirming]);

  // Cerrar overlay si hay error
  useEffect(() => {
    if (error) {
      console.log("❌ Error detected, resetting overlay");
      setShowLoadingOverlay(false);
      setOverlayStep("idle");
      setPaymentHash(null);
    }
  }, [error]);

  const handlePayment = async () => {
    try {
      setOverlayStep("idle"); // Reset
      setPaymentHash(null); // Reset hash
      await makePayment(circleAddress, amount);
    } catch (err) {
      console.error("Error al hacer pago:", err);
      setShowLoadingOverlay(false);
      setOverlayStep("idle");
      setPaymentHash(null);
    }
  };

  // Obtener el mensaje según el estado
  const getButtonContent = () => {
    if (showSuccess) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span>¡Pago Exitoso!</span>
        </div>
      );
    }

    if (paymentStep === "approving") {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Aprobando USDC...</span>
        </div>
      );
    }

    if (paymentStep === "paying" || isConfirming) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Procesando pago...</span>
        </div>
      );
    }

    if (isPending) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Confirma en wallet...</span>
        </div>
      );
    }

    return `Pagar $${amount}`;
  };

  // Obtener clases del botón según estado
  const getButtonClasses = () => {
    const baseClasses = "px-6 py-3 rounded-lg font-display font-bold transition-all";

    if (showSuccess) {
      return `${baseClasses} bg-gradient-to-r from-pachamama to-ocre text-white cursor-default`;
    }

    if (isProcessing) {
      return `${baseClasses} bg-gradient-to-r from-ceremonial/50 to-ocre/50 text-white cursor-wait opacity-75`;
    }

    return `${baseClasses} bg-gradient-to-r from-ceremonial to-ocre text-white hover:scale-105 cursor-pointer`;
  };

  return (
    <>
      {/* Overlay de carga */}
      <PaymentLoadingOverlay
        isOpen={showLoadingOverlay}
        step={overlayStep}
        onClose={() => {
          // No permitir cerrar durante el proceso
          if (error) {
            setShowLoadingOverlay(false);
            setOverlayStep("idle");
          }
        }}
      />

      <div className="space-y-2">
        <button
          onClick={handlePayment}
          disabled={isProcessing || showSuccess}
          className={getButtonClasses()}
        >
          {getButtonContent()}
        </button>

      {/* Mensajes solo se muestran cuando NO hay overlay */}
      {!showLoadingOverlay && (paymentStep !== "idle" || isProcessing) && !showSuccess && (
        <div className="text-xs text-gris space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              paymentStep === "approving" || (isConfirmed && paymentStep === "paying")
                ? "bg-pachamama animate-pulse"
                : paymentStep === "paying"
                ? "bg-gris"
                : "bg-ceremonial animate-pulse"
            }`}></div>
            <span>Paso 1: {paymentStep === "approving" ? "Aprobando USDC" : isConfirmed && paymentStep === "paying" ? "✓ USDC Aprobado" : "Aprobar USDC"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              paymentStep === "paying"
                ? "bg-ceremonial animate-pulse"
                : "bg-gris"
            }`}></div>
            <span>Paso 2: {paymentStep === "paying" ? "Realizando pago..." : "Realizar pago"}</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-ceremonial/10 border border-ceremonial rounded-lg p-3 text-xs">
          <div className="text-ceremonial font-bold mb-1">❌ Error al procesar pago</div>
          <div className="text-gris">
            {error.message?.includes("insufficient funds")
              ? "No tienes suficiente ETH para gas. Obtén ETH de testnet."
              : error.message?.includes("user rejected")
              ? "Transacción cancelada. Intenta de nuevo cuando estés listo."
              : error.message?.includes("insufficient allowance")
              ? "No tienes suficiente USDC aprobado. Intenta de nuevo."
              : "Error inesperado. Por favor intenta de nuevo."}
          </div>
        </div>
      )}

      {/* Mensaje de éxito expandido */}
      {showSuccess && (
        <div className="bg-pachamama/10 border border-pachamama rounded-lg p-3 text-xs animate-fade-in">
          <div className="text-pachamama font-bold mb-1">🎉 ¡Pago registrado exitosamente!</div>
          <div className="text-gris space-y-1">
            <p>• Tu Aguayo ha sido actualizado (+1 hilo)</p>
            <p>• El círculo {circleName} registró tu pago</p>
            <p>• La página se actualizará automáticamente</p>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
