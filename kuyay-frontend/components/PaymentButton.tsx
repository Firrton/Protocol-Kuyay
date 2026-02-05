"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useMakePayment } from "@/hooks/useCircles";
import PaymentLoadingOverlay from "./PaymentLoadingOverlay";
import { CONTRACTS } from "@/lib/contracts/addresses";

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
  const { address } = useAccount();
  const { makePayment, isPending, isConfirming, isConfirmed, error, paymentStep, isProcessing, hash } = useMakePayment();

  // Leer balance de USDC del usuario
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.monadMainnet.usdc as `0x${string}`,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Leer el estado actual del círculo para validar
  const { data: circleState, refetch: refetchCircleState } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: [
      {
        name: "getCircleState",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [
          { name: "mode", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "currentRound", type: "uint256" },
          { name: "pot", type: "uint256" },
        ],
      },
    ],
    functionName: "getCircleState",
    query: {
      enabled: !!circleAddress,
    },
  });

  // Convertir balance y monto a números comparables (USDC tiene 6 decimales)
  const balanceInUsdc = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
  const hasEnoughBalance = balanceInUsdc >= amount;

  // Extraer estado del círculo
  const circleStatus = circleState ? (circleState as any)[1] : undefined;
  const currentRound = circleState ? Number((circleState as any)[2]) : 0;
  const isCircleActive = circleStatus === 1; // 1 = ACTIVE
  const isCircleInDeposit = circleStatus === 0; // 0 = DEPOSIT
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

  // Cerrar overlay si hay error
  useEffect(() => {
    if (error) {
      console.log("❌ Error detected, resetting overlay");
      setShowLoadingOverlay(false);
      setOverlayStep("idle");
      setPaymentHash(null);
    }
  }, [error]);

  // Verificar si el usuario ya pagó esta ronda
  const { data: hasUserPaidRound, refetch: refetchHasPaid } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: [
      {
        name: "hasPaidRound",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "", type: "address" },
          { name: "", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ],
    functionName: "hasPaidRound",
    args: address && currentRound > 0 ? [address, BigInt(currentRound)] : undefined,
    query: {
      enabled: !!address && !!circleAddress && currentRound > 0,
    },
  });

  // Verificar si depositó garantía
  const { data: userGuarantee } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: [
      {
        name: "guarantees",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "guarantees",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!circleAddress,
    },
  });

  const hasDepositedGuarantee = userGuarantee ? Number(userGuarantee) > 0 : false;

  const handlePayment = async () => {
    // Refetch para tener datos frescos
    await refetchBalance();
    await refetchCircleState();
    await refetchHasPaid();

    // Verificar si ya pagó esta ronda
    if (hasUserPaidRound) {
      alert(`✅ Ya pagaste esta ronda\n\n¡Ya completaste tu pago de la Ronda ${currentRound}!\n\nNo puedes pagar dos veces la misma ronda.\n\nEspera a que se complete el sorteo para avanzar a la siguiente ronda.`);
      return;
    }

    // Verificar garantía
    if (!hasDepositedGuarantee) {
      alert(`🔒 Garantía no depositada\n\nPrimero debes depositar tu garantía antes de poder hacer pagos.\n\nBusca el botón "Depositar Garantía" y complétalo primero.`);
      return;
    }

    // Verificar balance antes de proceder
    if (!hasEnoughBalance) {
      alert(`❌ Balance insuficiente\n\nNecesitas: $${amount} USDC\nTienes: $${balanceInUsdc.toFixed(2)} USDC\n\nPor favor, obtén USDC de testnet primero.`);
      return;
    }

    // Verificar que el círculo esté en estado ACTIVE
    if (isCircleInDeposit) {
      alert(`⚠️ Círculo en fase de garantías\n\nEste círculo aún está esperando que todos los miembros depositen su garantía.\n\nNo puedes hacer pagos hasta que todos depositen y el círculo se active.`);
      return;
    }

    if (!isCircleActive) {
      alert(`⚠️ Círculo no activo\n\nEste círculo no está en estado activo.\n\nEstado del círculo: ${circleStatus}\n\nPor favor verifica el estado en Arbiscan.`);
      return;
    }

    if (currentRound === 0) {
      alert(`⚠️ Círculo no iniciado\n\nEl círculo aún no ha iniciado su primera ronda.\n\nEspera a que el círculo se active.`);
      return;
    }

    console.log("✅ Validaciones pasadas:", {
      hasEnoughBalance,
      hasDepositedGuarantee,
      hasUserPaidRound,
      isCircleActive,
      circleStatus,
      currentRound,
    });

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
    if (hasUserPaidRound) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span>Ya Pagaste Esta Ronda</span>
        </div>
      );
    }

    if (!hasDepositedGuarantee) {
      return (
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>Deposita Garantía Primero</span>
        </div>
      );
    }

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

    if (!hasEnoughBalance) {
      return `${baseClasses} bg-gradient-to-r from-tierra/50 to-gris/50 text-gris cursor-not-allowed opacity-50`;
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

      <div className="space-y-2">
        {/* Mostrar balance de USDC */}
        <div className="text-xs text-gris mb-2 flex justify-between items-center">
          <span>Tu balance USDC:</span>
          <span className={hasEnoughBalance ? "text-pachamama font-bold" : "text-ceremonial font-bold"}>
            ${balanceInUsdc.toFixed(2)} USDC
          </span>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing || showSuccess || !hasEnoughBalance || hasUserPaidRound || !hasDepositedGuarantee}
          className={getButtonClasses()}
        >
          {getButtonContent()}
        </button>

        {/* Mensaje cuando ya pagó */}
        {hasUserPaidRound && !showLoadingOverlay && (
          <div className="bg-pachamama/10 border border-pachamama rounded-lg p-3 text-xs">
            <div className="text-pachamama font-bold mb-2">✅ Ya completaste tu pago</div>
            <div className="text-gris">
              <p>Ya pagaste tu cuota de la Ronda {currentRound}.</p>
              <p className="mt-2">Espera a que:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Todos los miembros paguen</li>
                <li>Se realice el sorteo</li>
                <li>Avance a la siguiente ronda</li>
              </ol>
            </div>
          </div>
        )}

        {/* Mensaje cuando no ha depositado garantía */}
        {!hasDepositedGuarantee && !hasUserPaidRound && !showLoadingOverlay && (
          <div className="bg-ceremonial/10 border border-ceremonial rounded-lg p-3 text-xs">
            <div className="text-ceremonial font-bold mb-2">🔒 Garantía no depositada</div>
            <div className="text-gris">
              <p>Antes de poder hacer pagos, debes depositar tu garantía.</p>
              <p className="mt-2 font-bold text-white">¿Qué hacer?</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Busca el botón "Depositar Garantía" en la tarjeta del círculo</li>
                <li>Deposita la garantía requerida</li>
                <li>Luego podrás hacer pagos normalmente</li>
              </ol>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay suficiente balance */}
        {!hasEnoughBalance && !hasUserPaidRound && hasDepositedGuarantee && !showLoadingOverlay && (
          <div className="bg-ceremonial/10 border border-ceremonial rounded-lg p-3 text-xs">
            <div className="text-ceremonial font-bold mb-2">⚠️ Balance insuficiente de USDC</div>
            <div className="text-gris space-y-2">
              <p>Necesitas <span className="text-white font-bold">${amount} USDC</span> pero solo tienes <span className="text-white font-bold">${balanceInUsdc.toFixed(2)} USDC</span></p>
              <div className="pt-2 border-t border-ceremonial/30">
                <p className="font-bold text-white mb-1">Cómo obtener USDC de testnet:</p>
                <ol className="list-decimal list-inside space-y-1 text-gris">
                  <li>Ve al <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="text-ocre hover:text-dorado underline">Circle Faucet</a></li>
                  <li>Conecta tu wallet</li>
                  <li>Selecciona "Arbitrum Sepolia"</li>
                  <li>Solicita USDC de testnet (10 USDC gratis)</li>
                  <li>Espera 1-2 minutos y actualiza esta página</li>
                </ol>
              </div>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full mt-2 px-4 py-2 bg-ocre hover:bg-dorado text-white text-center rounded-lg font-bold transition-colors"
              >
                🚰 Ir al Faucet de USDC
              </a>
            </div>
          </div>
        )}

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