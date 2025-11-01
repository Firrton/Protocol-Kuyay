"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useMintAguayo, useHasAguayo } from "@/hooks/useAguayo";

export default function MintAguayoCard() {
  const { mintAguayo, isPending, isConfirming, isConfirmed, error } = useMintAguayo();
  const { hasAguayo, refetch, isContractDeployed } = useHasAguayo();
  const [showSuccess, setShowSuccess] = useState(false);

  // Refetch cuando se confirme la transacción
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      // Refetch después de 2 segundos para dar tiempo a que se indexe
      setTimeout(() => {
        refetch();
      }, 2000);
    }
  }, [isConfirmed, refetch]);

  // Si ya tiene Aguayo, no mostrar nada
  if (hasAguayo) return null;

  return (
    <div className="bg-gradient-to-br from-ceremonial/10 via-ocre/10 to-dorado/10 border-2 border-dorado/50 rounded-2xl p-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 aguayo-pattern opacity-5"></div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🧵</div>
          <h2 className="text-3xl font-display font-bold text-gradient">
            Teje tu Aguayo Digital
          </h2>
          <p className="text-gris max-w-2xl mx-auto">
            Tu Aguayo es tu identidad financiera on-chain. Cada pago que completas añade un hilo,
            cada círculo terminado añade un borde ceremonial. Es inmutable, no transferible, y
            representa tu reputación en la comunidad Kuyay.
          </p>
        </div>

        {/* Visual explicativo */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-profundo/50 rounded-xl p-4 border border-tierra text-center">
            <div className="text-4xl mb-2">🌱</div>
            <div className="font-display font-bold text-white mb-1">Nivel 0</div>
            <div className="text-sm text-gris">Telar Vacío - Comienza tu historia</div>
          </div>
          <div className="bg-profundo/50 rounded-xl p-4 border border-dorado text-center">
            <div className="text-4xl mb-2">🧵</div>
            <div className="font-display font-bold text-white mb-1">Cada Pago</div>
            <div className="text-sm text-gris">Añade un hilo dorado</div>
          </div>
          <div className="bg-profundo/50 rounded-xl p-4 border border-pachamama text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-display font-bold text-white mb-1">Cada Círculo</div>
            <div className="text-sm text-gris">Añade un borde ceremonial</div>
          </div>
        </div>

        {/* Info importante */}
        <div className="bg-profundo/70 rounded-xl p-4 border border-ocre/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1 space-y-2 text-sm text-gris">
              <p>• <strong className="text-white">Soul-Bound Token (SBT):</strong> No se puede transferir ni vender</p>
              <p>• <strong className="text-white">Gratuito:</strong> Solo pagas el gas de la transacción</p>
              <p>• <strong className="text-white">Permanente:</strong> Tu reputación queda registrada para siempre</p>
              <p>• <strong className="text-white">Único:</strong> Una dirección = Un Aguayo</p>
            </div>
          </div>
        </div>

        {/* Botón de mintear */}
        <div className="text-center">
          {!isContractDeployed ? (
            <div className="bg-ocre/10 border-2 border-ocre/50 rounded-xl p-6 space-y-3">
              <div className="text-4xl">🚧</div>
              <div className="font-display font-bold text-ocre text-xl">
                Smart Contracts No Desplegados
              </div>
              <div className="text-gris text-sm">
                Los contratos están en desarrollo. Cuando estén desplegados en Arbitrum Sepolia,
                podrás mintear tu Aguayo aquí mismo.
              </div>
              <div className="text-xs text-gris/70 font-mono bg-profundo/50 px-3 py-2 rounded">
                Actualiza las direcciones en lib/contracts/addresses.ts
              </div>
            </div>
          ) : !isConfirmed && !showSuccess ? (
            <button
              onClick={mintAguayo}
              disabled={isPending || isConfirming}
              className="bg-gradient-to-r from-ceremonial to-ocre text-white px-12 py-4 rounded-xl font-display font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl"
            >
              {isPending
                ? "Confirma en tu wallet..."
                : isConfirming
                ? "Minteando tu Aguayo..."
                : "✨ Mintear mi Aguayo"}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl animate-pulse">🎉</div>
              <div className="text-2xl font-display font-bold text-pachamama">
                ¡Aguayo Minteado!
              </div>
              <div className="text-gris">
                Tu Telar Vacío (Nivel 0) ha sido creado. Ahora puedes unirte a círculos de ahorro.
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-pachamama to-ocre text-white px-8 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
              >
                Continuar al Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-ceremonial/10 border border-ceremonial rounded-lg p-4 text-center">
            <div className="text-ceremonial font-bold mb-2">Error al mintear</div>
            <div className="text-sm text-gris">
              {error.message || "Ocurrió un error. Por favor intenta de nuevo."}
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {(isPending || isConfirming) && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-ocre border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}
