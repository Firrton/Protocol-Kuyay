"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { AGUAYO_SBT_ABI } from "@/lib/contracts/abis";
import { useHasAguayo, useAguayoTokenId, useAguayoMetadata } from "@/hooks/useAguayo";
import Link from "next/link";

export default function DebugPage() {
  const { address, isConnected } = useAccount();

  // Hook results
  const { hasAguayo, isLoading, isContractDeployed, refetch } = useHasAguayo();
  const { tokenId } = useAguayoTokenId();
  const { metadata } = useAguayoMetadata();

  // Direct contract call
  const { data: hasAguayoDirect, error: hasAguayoError } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
    abi: AGUAYO_SBT_ABI,
    functionName: "hasAguayo",
    args: address ? [address] : undefined,
  });

  // Get token ID direct
  const { data: tokenIdDirect, error: tokenIdError } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
    abi: AGUAYO_SBT_ABI,
    functionName: "getAguayoByUser",
    args: address ? [address] : undefined,
  });

  return (
    <main className="min-h-screen bg-profundo p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-ceremonial hover:text-ocre">
            ← Volver al Dashboard
          </Link>
        </div>

        <h1 className="text-4xl font-display font-bold text-gradient mb-8">
          Debug Panel - Aguayo SBT
        </h1>

        {/* Wallet Status */}
        <div className="bg-gradient-to-br from-tierra/20 to-transparent border-2 border-tierra/50 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-display font-bold text-pachamama mb-4">
            Wallet Status
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-white">
              <span className="text-gris">Connected:</span>{" "}
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "✓ Yes" : "✗ No"}
              </span>
            </p>
            {address && (
              <p className="text-white break-all">
                <span className="text-gris">Address:</span> {address}
              </p>
            )}
          </div>
        </div>

        {/* Contract Status */}
        <div className="bg-gradient-to-br from-ceremonial/20 to-transparent border-2 border-ceremonial/50 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-display font-bold text-ceremonial mb-4">
            Contract Status
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-white break-all">
              <span className="text-gris">AguayoSBT Address:</span>{" "}
              {CONTRACTS.arbitrumSepolia.aguayoSBT}
            </p>
            <p className="text-white">
              <span className="text-gris">Deployed:</span>{" "}
              <span className={isContractDeployed ? "text-green-400" : "text-red-400"}>
                {isContractDeployed ? "✓ Yes" : "✗ No"}
              </span>
            </p>
          </div>
        </div>

        {/* Hook Results */}
        <div className="bg-gradient-to-br from-pachamama/20 to-transparent border-2 border-pachamama/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold text-pachamama">
              Hook Results (useHasAguayo)
            </h2>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-pachamama/20 hover:bg-pachamama/30 border border-pachamama rounded-lg text-white transition-all"
            >
              🔄 Refetch
            </button>
          </div>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-white">
              <span className="text-gris">Loading:</span>{" "}
              <span className={isLoading ? "text-yellow-400" : "text-green-400"}>
                {isLoading ? "Yes" : "No"}
              </span>
            </p>
            <p className="text-white">
              <span className="text-gris">hasAguayo:</span>{" "}
              <span className={hasAguayo ? "text-green-400" : "text-red-400"}>
                {hasAguayo ? "✓ TRUE" : "✗ FALSE"}
              </span>
            </p>
            <p className="text-white">
              <span className="text-gris">Token ID:</span> {tokenId ?? "null"}
            </p>
            {metadata && (
              <div className="mt-4 p-4 bg-profundo/50 rounded-lg">
                <p className="text-gris mb-2">Metadata:</p>
                <pre className="text-white text-xs overflow-auto">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Direct Contract Calls */}
        <div className="bg-gradient-to-br from-ocre/20 to-transparent border-2 border-ocre/50 rounded-xl p-6">
          <h2 className="text-2xl font-display font-bold text-ocre mb-4">
            Direct Contract Calls
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-profundo/50 rounded-lg">
              <p className="text-gris mb-2">hasAguayo() call:</p>
              <div className="font-mono text-sm">
                <p className="text-white">
                  <span className="text-gris">Result:</span>{" "}
                  <span className={hasAguayoDirect ? "text-green-400" : "text-red-400"}>
                    {hasAguayoDirect !== undefined
                      ? hasAguayoDirect
                        ? "✓ TRUE"
                        : "✗ FALSE"
                      : "null"}
                  </span>
                </p>
                {hasAguayoError && (
                  <p className="text-red-400 mt-2">
                    Error: {hasAguayoError.message}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-profundo/50 rounded-lg">
              <p className="text-gris mb-2">getAguayoByUser() call:</p>
              <div className="font-mono text-sm">
                <p className="text-white">
                  <span className="text-gris">Result:</span>{" "}
                  {tokenIdDirect !== undefined
                    ? String(tokenIdDirect)
                    : "null"}
                </p>
                {tokenIdError && (
                  <p className="text-red-400 mt-2">
                    Error: {tokenIdError.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Link */}
        {address && (
          <div className="mt-6 p-4 bg-profundo/30 rounded-lg border border-tierra/30">
            <p className="text-gris text-sm mb-2">Verificar en Arbiscan:</p>
            <a
              href={`https://sepolia.arbiscan.io/address/${CONTRACTS.arbitrumSepolia.aguayoSBT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ceremonial hover:text-ocre font-mono text-sm break-all"
            >
              {CONTRACTS.arbitrumSepolia.aguayoSBT} →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
