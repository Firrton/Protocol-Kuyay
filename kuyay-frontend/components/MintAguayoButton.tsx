"use client";

import { useState, useEffect } from "react";
import { useMintAguayo, useHasAguayo } from "@/hooks/useAguayo";

export default function MintAguayoButton() {
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

  // Si el contrato no está desplegado
  if (!isContractDeployed) {
    return (
      <div className="bg-ocre/20 border-2 border-ocre/50 rounded-lg px-6 py-3 text-center">
        <div className="text-ocre font-display font-bold">🚧 Próximamente</div>
        <div className="text-xs text-gris mt-1">Smart contracts en desarrollo</div>
      </div>
    );
  }

  // Si ya se confirmó
  if (isConfirmed || showSuccess) {
    return (
      <div className="text-center space-y-2">
        <div className="text-4xl animate-pulse">🎉</div>
        <div className="text-lg font-display font-bold text-pachamama">
          ¡Aguayo Minteado!
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-pachamama to-ocre text-white px-6 py-2 rounded-lg font-display font-bold text-sm hover:scale-105 transition-transform"
        >
          Recargar Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={mintAguayo}
        disabled={isPending || isConfirming}
        className="bg-gradient-to-r from-ceremonial to-ocre text-white px-8 py-3 rounded-xl font-display font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl w-full md:w-auto"
      >
        {isPending
          ? "Confirma en wallet..."
          : isConfirming
          ? "Minteando..."
          : "✨ Mintear Aguayo"}
      </button>

      {/* Loading spinner */}
      {(isPending || isConfirming) && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-ocre border-t-transparent"></div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-ceremonial/10 border border-ceremonial rounded-lg p-3 text-center">
          <div className="text-ceremonial font-bold text-sm mb-1">Error al mintear</div>
          <div className="text-xs text-gris">
            {error.message || "Ocurrió un error. Por favor intenta de nuevo."}
          </div>
        </div>
      )}
    </div>
  );
}
