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
  const [showTimeout, setShowTimeout] = useState(false);

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

  // Timeout para transacciones que tardan mucho
  useEffect(() => {
    if (paymentStep === "paying" && hash) {
      console.log("⏱️ Starting 60s timeout for payment confirmation");
      
      const timeoutId = setTimeout(async () => {
        console.warn("⚠️ Payment confirmation timeout reached (60s)");
        console.log("🔍 Checking transaction manually...");
        
        // Verificar manualmente si la transacción se completó
        try {
          const provider = window.ethereum;
          if (provider) {
            const receipt = await provider.request({
              method: 'eth_getTransactionReceipt',
              params: [hash]
            });
            
            console.log("📋 Manual receipt check:", receipt);
            
            if (receipt && receipt.status === "0x1") {
              console.log("✅ Transaction confirmed manually! Closing overlay...");
              setOverlayStep("success");
              setShowSuccess(true);
              onPaymentSuccess?.();
              
              setTimeout(() => {
                setShowLoadingOverlay(false);
                setOverlayStep("idle");
                setPaymentHash(null);
              }, 2000);
              
              setTimeout(() => {
                setShowSuccess(false);
              }, 5000);
            } else if (receipt && receipt.status === "0x0") {
              console.error("❌ Transaction failed!");
            } else {
              console.warn("⏳ Transaction still pending after 60s");
            }
          }
        } catch (err) {
          console.error("Error checking transaction:", err);
        }
      }, 60000); // 60 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [paymentStep, hash, onPaymentSuccess]);

  // Detectar cuando se confirma el PAGO (no la aprobación)
  useEffect(() => {
    console.log("✅ Confirmation check:", { 
      isConfirmed, 
      isConfirming,
      isPending,
      paymentStep, 
      paymentHash, 
      currentHash: hash, 
      overlayStep,
      hashMatch: hash === paymentHash
    });

    // Solo cerrar cuando:
    // 1. La transacción está confirmada
    // 2. Estamos en el paso de pagar
    if (isConfirmed && paymentStep === "paying") {
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
  }, [isConfirmed, isConfirming, isPending, paymentStep, hash, overlayStep, onPaymentSuccess]);

  // Mostrar overlay cuando se está procesando
  useEffect(() => {
    if (paymentStep !== "idle" || isPending || isConfirming) {
      setShowLoadingOverlay(true);
    }
  }, [paymentStep, isPending, isConfirming]);

  // Timeout de 45 segundos - mostrar botón de verificar manualmente
  useEffect(() => {
    if (paymentStep === "paying" && isConfirming) {
      const timer = setTimeout(() => {
        console.log("⏰ Timeout alcanzado - mostrando opción manual");
        setShowTimeout(true);
      }, 45000); // 45 segundos

      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [paymentStep, isConfirming]);

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

      {/* Botón de verificación manual cuando tarda mucho */}
      {showLoadingOverlay && overlayStep === "paying" && isConfirming && (
        <div className="fixed bottom-4 right-4 z-[10001] space-y-2">
          <button
            onClick={async () => {
              console.log("🔍 Manual verification requested");
              try {
                const receipt = await window.ethereum.request({
                  method: 'eth_getTransactionReceipt',
                  params: [hash]
                });
                
                console.log("📋 Receipt:", receipt);
                
                if (receipt && receipt.status === "0x1") {
                  alert("✅ Transacción completada exitosamente!");
                  setOverlayStep("success");
                  setShowSuccess(true);
                  onPaymentSuccess?.();
                  setTimeout(() => {
                    setShowLoadingOverlay(false);
                    setOverlayStep("idle");
                    setPaymentHash(null);
                  }, 2000);
                } else if (receipt && receipt.status === "0x0") {
                  alert("❌ La transacción falló. Por favor intenta de nuevo.");
                  setShowLoadingOverlay(false);
                  setOverlayStep("idle");
                } else {
                  alert("⏳ La transacción aún está pendiente. Espera un poco más.");
                }
              } catch (err) {
                console.error("Error:", err);
                alert("Error verificando transacción");
              }
            }}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg"
          >
            🔍 Verificar Estado
          </button>
          
          <button
            onClick={() => {
              if (confirm("¿Seguro que quieres cerrar? La transacción puede seguir procesándose.")) {
                setShowLoadingOverlay(false);
                setOverlayStep("idle");
                setPaymentHash(null);
              }
            }}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-bold shadow-lg"
          >
            ✕ Cerrar
          </button>
          
          <a
            href={`https://sepolia.arbiscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 bg-ocre hover:bg-dorado text-white text-center rounded-lg text-xs font-bold shadow-lg"
          >
            🔗 Ver en Arbiscan
          </a>
        </div>
      )}

      {/* Mensaje de timeout - verificar manualmente */}
      {showTimeout && showLoadingOverlay && paymentStep === "paying" && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-profundo/90 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-profundo to-tierra/20 border-2 border-ocre rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="text-6xl">⏰</div>
              <h3 className="text-2xl font-display font-bold text-white">
                Verificación Manual
              </h3>
              <p className="text-gris">
                La transacción está tomando más tiempo de lo esperado. 
                Puedes verificar manualmente en Arbiscan si ya se completó.
              </p>
              
              {hash && (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-ceremonial to-ocre text-white px-6 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
                >
                  🔍 Ver en Arbiscan
                </a>
              )}

              <button
                onClick={() => {
                  console.log("✅ Usuario confirmó pago manual");
                  setShowLoadingOverlay(false);
                  setOverlayStep("idle");
                  setShowTimeout(false);
                  setShowSuccess(true);
                  onPaymentSuccess?.();
                  setTimeout(() => setShowSuccess(false), 5000);
                }}
                className="w-full bg-pachamama text-white px-6 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
              >
                ✅ Confirmar que se completó
              </button>

              <button
                onClick={() => {
                  console.log("❌ Usuario canceló - volverá a intentar");
                  setShowLoadingOverlay(false);
                  setOverlayStep("idle");
                  setShowTimeout(false);
                  setPaymentHash(null);
                }}
                className="w-full border-2 border-tierra text-gris px-6 py-3 rounded-lg font-display font-bold hover:bg-tierra hover:text-profundo transition-all"
              >
                ❌ Cancelar e intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}

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
