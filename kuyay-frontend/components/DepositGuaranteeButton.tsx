"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useDepositGuarantee } from "@/hooks/useCircles";
import PaymentLoadingOverlay from "./PaymentLoadingOverlay";
import { CONTRACTS } from "@/lib/contracts/addresses";

interface DepositGuaranteeButtonProps {
  circleAddress: string;
  circleName: string;
  amount: number;
  onDepositSuccess?: () => void;
}

export default function DepositGuaranteeButton({
  circleAddress,
  circleName,
  amount,
  onDepositSuccess,
}: DepositGuaranteeButtonProps) {
  const { address } = useAccount();
  const { depositGuarantee, isPending, isConfirming, isConfirmed, error, depositStep, isProcessing, hash } = useDepositGuarantee();

  // Leer balance de USDC del usuario
  const { data: usdcBalance } = useReadContract({
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

  const balanceInUsdc = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
  const hasEnoughBalance = balanceInUsdc >= amount;
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [overlayStep, setOverlayStep] = useState<"idle" | "approving" | "paying" | "success">("idle");

  // Sincronizar overlayStep con depositStep
  useEffect(() => {
    console.log("🔄 DepositStep changed:", depositStep, "hash:", hash);
    if (depositStep === "approving") {
      setOverlayStep("approving");
    } else if (depositStep === "depositing") {
      setOverlayStep("paying"); // Reusar el mismo estado visual
    }
  }, [depositStep, hash]);

  // Detectar cuando se confirma el DEPÓSITO
  useEffect(() => {
    console.log("✅ Deposit confirmation check:", {
      isConfirmed,
      isConfirming,
      isPending,
      depositStep,
      hash,
      overlayStep,
    });

    if (isConfirmed && depositStep === "depositing") {
      console.log("🎉 Deposit CONFIRMED! Hash:", hash);

      setOverlayStep("success");
      setShowSuccess(true);
      onDepositSuccess?.();

      setTimeout(() => {
        console.log("🚪 Closing overlay...");
        setShowLoadingOverlay(false);
        setOverlayStep("idle");
      }, 2000);

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }
  }, [isConfirmed, isConfirming, isPending, depositStep, hash, overlayStep, onDepositSuccess]);

  // Verificar estado INMEDIATAMENTE después de 3 segundos
  useEffect(() => {
    if (depositStep === "depositing" && hash) {
      console.log("⏱️ Starting immediate check in 3s...");

      const quickCheck = setTimeout(async () => {
        console.log("🔍 Quick check after 3s...");
        try {
          const provider = window.ethereum;
          if (provider) {
            const receipt = await provider.request({
              method: 'eth_getTransactionReceipt',
              params: [hash]
            });

            console.log("📋 Receipt after 3s:", receipt);

            if (receipt && receipt.status === "0x1") {
              console.log("✅ Deposit confirmed! Closing overlay...");
              setOverlayStep("success");
              setShowSuccess(true);
              onDepositSuccess?.();

              setTimeout(() => {
                setShowLoadingOverlay(false);
                setOverlayStep("idle");
              }, 2000);
            } else if (receipt && receipt.status === "0x0") {
              console.error("❌ Deposit FAILED!");
              alert(`❌ Transacción Fallida\n\nLa garantía no se pudo depositar.\n\nVerifica en Arbiscan: https://sepolia.arbiscan.io/tx/${hash}\n\nPosibles razones:\n- Ya depositaste antes\n- El círculo no existe\n- Falta de gas\n\nCierra esta ventana y verifica el error.`);
              setShowLoadingOverlay(false);
              setOverlayStep("idle");
            }
          }
        } catch (err) {
          console.error("Error checking deposit:", err);
        }
      }, 3000);

      // Timeout de 60s como respaldo
      const timeoutId = setTimeout(async () => {
        console.warn("⚠️ Timeout reached (60s)");
        try {
          const provider = window.ethereum;
          if (provider) {
            const receipt = await provider.request({
              method: 'eth_getTransactionReceipt',
              params: [hash]
            });

            if (receipt && receipt.status === "0x1") {
              console.log("✅ Confirmed after timeout");
              setOverlayStep("success");
              setShowSuccess(true);
              onDepositSuccess?.();
              setTimeout(() => {
                setShowLoadingOverlay(false);
                setOverlayStep("idle");
              }, 2000);
            } else if (receipt && receipt.status === "0x0") {
              console.error("❌ Failed after timeout");
              alert("❌ La transacción falló. Cierra esta ventana.");
              setShowLoadingOverlay(false);
              setOverlayStep("idle");
            } else {
              console.warn("⏳ Still pending");
            }
          }
        } catch (err) {
          console.error("Error:", err);
        }
      }, 60000);

      return () => {
        clearTimeout(quickCheck);
        clearTimeout(timeoutId);
      };
    }
  }, [depositStep, hash, onDepositSuccess]);

  // Mostrar overlay cuando se está procesando
  useEffect(() => {
    if (depositStep !== "idle" || isPending || isConfirming) {
      setShowLoadingOverlay(true);
    }
  }, [depositStep, isPending, isConfirming]);

  // Cerrar overlay si hay error
  useEffect(() => {
    if (error) {
      console.log("❌ Error detected, resetting overlay");
      setShowLoadingOverlay(false);
      setOverlayStep("idle");
    }
  }, [error]);

  const handleDeposit = async () => {
    // Verificar balance antes de proceder
    if (!hasEnoughBalance) {
      alert(`❌ Balance insuficiente\n\nNecesitas: $${amount} USDC\nTienes: $${balanceInUsdc.toFixed(2)} USDC\n\nPor favor, obtén USDC de testnet primero.`);
      return;
    }

    try {
      setOverlayStep("idle");
      await depositGuarantee(circleAddress, amount);
    } catch (err) {
      console.error("Error al depositar garantía:", err);
      setShowLoadingOverlay(false);
      setOverlayStep("idle");
    }
  };

  const getButtonContent = () => {
    if (showSuccess) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span>¡Garantía Depositada!</span>
        </div>
      );
    }

    if (depositStep === "approving") {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Aprobando USDC...</span>
        </div>
      );
    }

    if (depositStep === "depositing" || isConfirming) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Depositando garantía...</span>
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

    return (
      <div className="flex items-center gap-2">
        <span>💎</span>
        <span>Depositar Garantía ${amount}</span>
      </div>
    );
  };

  const getButtonClasses = () => {
    const baseClasses = "w-full px-6 py-4 rounded-xl font-display font-bold transition-all text-lg";

    if (showSuccess) {
      return `${baseClasses} bg-gradient-to-r from-pachamama to-ocre text-white cursor-default`;
    }

    if (!hasEnoughBalance) {
      return `${baseClasses} bg-gradient-to-r from-tierra/50 to-gris/50 text-gris cursor-not-allowed opacity-50`;
    }

    if (isProcessing) {
      return `${baseClasses} bg-gradient-to-r from-dorado/50 to-ocre/50 text-white cursor-wait opacity-75`;
    }

    return `${baseClasses} bg-gradient-to-r from-dorado to-ocre text-profundo hover:scale-105 cursor-pointer shadow-xl`;
  };

  return (
    <>
      {/* Overlay de carga */}
      <PaymentLoadingOverlay
        isOpen={showLoadingOverlay}
        step={overlayStep}
        onClose={() => {
          if (error) {
            setShowLoadingOverlay(false);
            setOverlayStep("idle");
          }
        }}
      />

      {/* Botones de verificación manual cuando tarda mucho */}
      {showLoadingOverlay && overlayStep === "paying" && isConfirming && hash && (
        <div className="fixed bottom-4 right-4 z-[10001] space-y-2">
          <button
            onClick={async () => {
              console.log("🔍 Manual deposit verification requested");
              try {
                const receipt = await window.ethereum.request({
                  method: 'eth_getTransactionReceipt',
                  params: [hash]
                });

                console.log("📋 Deposit Receipt:", receipt);

                if (receipt && receipt.status === "0x1") {
                  alert("✅ ¡Garantía depositada exitosamente! Puedes cerrar esta ventana.");
                  setOverlayStep("success");
                  setShowSuccess(true);
                  onDepositSuccess?.();
                  setTimeout(() => {
                    setShowLoadingOverlay(false);
                    setOverlayStep("idle");
                  }, 2000);
                } else if (receipt && receipt.status === "0x0") {
                  alert("❌ El depósito falló. Por favor intenta de nuevo.");
                  setShowLoadingOverlay(false);
                  setOverlayStep("idle");
                } else {
                  alert("⏳ El depósito aún está pendiente. Espera un poco más o verifica en Arbiscan.");
                }
              } catch (err) {
                console.error("Error:", err);
                alert("Error verificando transacción");
              }
            }}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg"
          >
            🔍 Verificar Estado del Depósito
          </button>

          <button
            onClick={() => {
              if (confirm("¿Tu garantía ya se depositó exitosamente? Puedes cerrar y actualizar la página.")) {
                setShowLoadingOverlay(false);
                setOverlayStep("idle");
              }
            }}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-bold shadow-lg"
          >
            ✕ Cerrar (Ya deposité)
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

      <div className="space-y-4">
        {/* Mensaje explicativo */}
        <div className="bg-dorado/10 border border-dorado/30 rounded-xl p-4">
          <h4 className="text-dorado font-display font-bold mb-2 flex items-center gap-2">
            <span>💎</span>
            Paso 1: Depositar Garantía
          </h4>
          <p className="text-sm text-gris leading-relaxed">
            Antes de comenzar con los pagos mensuales, cada miembro debe depositar una garantía de <strong className="text-white">${amount} USDC</strong>.
            Esta garantía te será devuelta al finalizar el círculo exitosamente.
          </p>
          <p className="text-xs text-dorado/80 mt-2">
            ⚡ Una vez que TODOS los miembros depositen, el círculo se activará automáticamente.
          </p>
        </div>

        {/* Mostrar balance de USDC */}
        <div className="text-xs text-gris flex justify-between items-center px-4">
          <span>Tu balance USDC:</span>
          <span className={hasEnoughBalance ? "text-pachamama font-bold" : "text-ceremonial font-bold"}>
            ${balanceInUsdc.toFixed(2)} USDC
          </span>
        </div>

        {/* Botón de depósito */}
        <button
          onClick={handleDeposit}
          disabled={isProcessing || showSuccess || !hasEnoughBalance}
          className={getButtonClasses()}
        >
          {getButtonContent()}
        </button>

        {/* Mensaje cuando no hay suficiente balance */}
        {!hasEnoughBalance && !showLoadingOverlay && (
          <div className="bg-ceremonial/10 border border-ceremonial rounded-xl p-4 text-xs">
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

        {/* Progreso */}
        {!showLoadingOverlay && (depositStep !== "idle" || isProcessing) && !showSuccess && (
          <div className="text-xs text-gris space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                depositStep === "approving" || (isConfirmed && depositStep === "depositing")
                  ? "bg-pachamama animate-pulse"
                  : depositStep === "depositing"
                  ? "bg-gris"
                  : "bg-dorado animate-pulse"
              }`}></div>
              <span>Paso 1: {depositStep === "approving" ? "Aprobando USDC" : isConfirmed && depositStep === "depositing" ? "✓ USDC Aprobado" : "Aprobar USDC"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                depositStep === "depositing"
                  ? "bg-dorado animate-pulse"
                  : "bg-gris"
              }`}></div>
              <span>Paso 2: {depositStep === "depositing" ? "Depositando garantía..." : "Depositar garantía"}</span>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-ceremonial/10 border border-ceremonial rounded-xl p-4 text-sm">
            <div className="text-ceremonial font-bold mb-1">❌ Error al depositar garantía</div>
            <div className="text-gris">
              {error.message?.includes("insufficient funds")
                ? "No tienes suficiente ETH para gas. Obtén ETH de testnet."
                : error.message?.includes("user rejected")
                ? "Transacción cancelada. Intenta de nuevo cuando estés listo."
                : error.message?.includes("already deposited") || error.message?.includes("GuaranteeAlreadyDeposited")
                ? "Ya depositaste tu garantía. Espera a que los demás miembros depositen."
                : "Error inesperado. Por favor intenta de nuevo."}
            </div>
          </div>
        )}

        {/* Mensaje de éxito */}
        {showSuccess && (
          <div className="bg-pachamama/10 border border-pachamama rounded-xl p-4 text-sm animate-fade-in">
            <div className="text-pachamama font-bold mb-1">🎉 ¡Garantía depositada exitosamente!</div>
            <div className="text-gris space-y-1">
              <p>• Tu garantía de ${amount} USDC ha sido depositada</p>
              <p>• El círculo {circleName} está esperando a los demás miembros</p>
              <p>• Una vez que todos depositen, podrás hacer pagos mensuales</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
