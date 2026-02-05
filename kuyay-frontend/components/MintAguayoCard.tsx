"use client";

import { useState,useEffect } from "react";
import Image from "next/image";
import { useMintAguayo,useHasAguayo } from "@/hooks/useAguayo";

export default function MintAguayoCard() {
  const { mintAguayo,isPending,isConfirming,isConfirmed,error } = useMintAguayo();
  const { hasAguayo,refetch,isContractDeployed } = useHasAguayo();
  const [showSuccess,setShowSuccess] = useState(false);

  // Refetch cuando se confirme la transacción
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      // Refetch después de 2 segundos para dar tiempo a que se indexe
      setTimeout(() => {
        refetch();
      },2000);
    }
  },[isConfirmed,refetch]);

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
            Weave your Digital Aguayo
          </h2>
          <p className="text-gris max-w-2xl mx-auto">
            Your Aguayo is your on-chain financial identity. Each payment you complete adds a thread,
            each finished circle adds a ceremonial border. It's immutable, non-transferable, and
            represents your reputation in the Kuyay community.
          </p>
        </div>

        {/* Visual explicativo */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-profundo/50 rounded-xl p-4 border border-tierra text-center">
            <div className="text-4xl mb-2">🌱</div>
            <div className="font-display font-bold text-white mb-1">Level 0</div>
            <div className="text-sm text-gris">Empty Loom - Start your story</div>
          </div>
          <div className="bg-profundo/50 rounded-xl p-4 border border-dorado text-center">
            <div className="text-4xl mb-2">🧵</div>
            <div className="font-display font-bold text-white mb-1">Each Payment</div>
            <div className="text-sm text-gris">Adds a golden thread</div>
          </div>
          <div className="bg-profundo/50 rounded-xl p-4 border border-pachamama text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-display font-bold text-white mb-1">Each Circle</div>
            <div className="text-sm text-gris">Adds a ceremonial border</div>
          </div>
        </div>

        {/* Info importante */}
        <div className="bg-profundo/70 rounded-xl p-4 border border-ocre/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1 space-y-2 text-sm text-gris">
              <p>• <strong className="text-white">Soul-Bound Token (SBT):</strong> Cannot be transferred or sold</p>
              <p>• <strong className="text-white">Free:</strong> You only pay the gas transaction fee</p>
              <p>• <strong className="text-white">Permanent:</strong> Your reputation is recorded forever</p>
              <p>• <strong className="text-white">Unique:</strong> One address = One Aguayo</p>
            </div>
          </div>
        </div>

        {/* Botón de mintear */}
        <div className="text-center">
          {!isContractDeployed ? (
            <div className="bg-ocre/10 border-2 border-ocre/50 rounded-xl p-6 space-y-3">
              <div className="text-4xl">🚧</div>
              <div className="font-display font-bold text-ocre text-xl">
                Smart Contracts Not Deployed
              </div>
              <div className="text-gris text-sm">
                The contracts are under development. When deployed on Monad Mainnet,
                you can mint your Aguayo right here.
              </div>
              <div className="text-xs text-gris/70 font-mono bg-profundo/50 px-3 py-2 rounded">
                Update addresses in lib/contracts/addresses.ts
              </div>
            </div>
          ) : !isConfirmed && !showSuccess ? (
            <button
              onClick={mintAguayo}
              disabled={isPending || isConfirming}
              className="bg-gradient-to-r from-ceremonial to-ocre text-white px-12 py-4 rounded-xl font-display font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl"
            >
              {isPending
                ? "Confirm in your wallet..."
                : isConfirming
                  ? "Minting your Aguayo..."
                  : "✨ Mint my Aguayo"}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl animate-pulse">🎉</div>
              <div className="text-2xl font-display font-bold text-pachamama">
                Aguayo Minted!
              </div>
              <div className="text-gris">
                Your Empty Loom (Level 0) has been created. You can now join savings circles.
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-pachamama to-ocre text-white px-8 py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-ceremonial/10 border border-ceremonial rounded-lg p-4 text-center">
            <div className="text-ceremonial font-bold mb-2">Minting Error</div>
            <div className="text-sm text-gris">
              {error.message || "An error occurred. Please try again."}
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
