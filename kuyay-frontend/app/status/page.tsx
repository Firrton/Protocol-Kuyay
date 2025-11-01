"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import ContractStatus from "@/components/ContractStatus";
import WalletInfo from "@/components/WalletInfo";
import ConnectWallet from "@/components/ConnectWallet";
import { useHasAguayo } from "@/hooks/useAguayo";

export default function StatusPage() {
  const { isConnected } = useAccount();
  const { hasAguayo, isLoading, isContractDeployed } = useHasAguayo();

  return (
    <main className="min-h-screen bg-profundo py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-ceremonial hover:text-ocre transition-colors mb-4 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-4xl font-display font-bold text-gradient mb-2">
            Estado del Sistema
          </h1>
          <p className="text-gris">
            Diagnóstico de conexión con contratos en Arbitrum Sepolia
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Wallet Status */}
          <div>
            {isConnected ? (
              <WalletInfo />
            ) : (
              <div className="bg-gradient-to-br from-ocre/20 to-transparent border-2 border-ocre/50 rounded-xl p-6">
                <h3 className="text-xl font-display font-bold mb-4 text-ocre">
                  Conecta tu Wallet
                </h3>
                <p className="text-gris mb-4">
                  Necesitas conectar tu wallet para interactuar con los contratos.
                </p>
                <ConnectWallet />
              </div>
            )}
          </div>

          {/* Contract Status */}
          <div>
            <ContractStatus />
          </div>
        </div>

        {/* Aguayo Status */}
        {isConnected && (
          <div className="bg-gradient-to-br from-pachamama/20 to-transparent border-2 border-pachamama/50 rounded-xl p-6">
            <h3 className="text-xl font-display font-bold mb-4 text-pachamama">
              Estado del Aguayo SBT
            </h3>

            {!isContractDeployed ? (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 font-medium">
                  ⚠️ El contrato AguayoSBT no está desplegado
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-ceremonial border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gris">Verificando tu Aguayo...</p>
              </div>
            ) : hasAguayo ? (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-400 font-medium">
                  ✓ Ya tienes un Aguayo SBT
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block mt-3 px-4 py-2 bg-pachamama/20 hover:bg-pachamama/30 border border-pachamama rounded-lg text-pachamama font-medium transition-all"
                >
                  Ver mi Aguayo →
                </Link>
              </div>
            ) : (
              <div className="bg-ocre/10 border border-ocre/50 rounded-lg p-4">
                <p className="text-ocre font-medium mb-3">
                  No tienes un Aguayo SBT todavía
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block px-4 py-2 bg-ocre/20 hover:bg-ocre/30 border border-ocre rounded-lg text-ocre font-medium transition-all"
                >
                  Mintear Aguayo →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Test Links */}
        <div className="mt-8 bg-gradient-to-br from-ceremonial/10 to-transparent border-2 border-ceremonial/30 rounded-xl p-6">
          <h3 className="text-xl font-display font-bold mb-4 text-ceremonial">
            Páginas de Prueba
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="block p-4 bg-profundo/50 hover:bg-profundo/80 border border-ceremonial/30 rounded-lg transition-all"
            >
              <p className="font-medium text-white">Dashboard</p>
              <p className="text-xs text-gris">Ver y mintear Aguayo, crear círculos</p>
            </Link>
            <Link
              href="/defaulters"
              className="block p-4 bg-profundo/50 hover:bg-profundo/80 border border-ceremonial/30 rounded-lg transition-all"
            >
              <p className="font-medium text-white">Deudores</p>
              <p className="text-xs text-gris">Ver lista de aguayos con manchas</p>
            </Link>
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-8 p-4 bg-profundo/50 rounded-lg border border-ceremonial/20">
          <p className="text-xs text-gris">
            <strong className="text-ceremonial">Importante:</strong> Asegúrate de estar conectado a{" "}
            <span className="text-white font-mono">Arbitrum Sepolia</span> en tu wallet.
          </p>
        </div>
      </div>
    </main>
  );
}
