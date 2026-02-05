"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useReadContract,useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { CIRCLE_FAITH_ABI,getFaithRole } from "@/hooks/useAllCircles";

// Status labels and colors
const STATUS_LABELS: Record<number,string> = {
    0: "DEPOSIT",
    1: "ACTIVE",
    2: "COMPLETED",
    3: "CANCELLED",
};

const STATUS_COLORS: Record<string,string> = {
    DEPOSIT: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500",
    COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500",
};

const STATUS_ICONS: Record<string,string> = {
    DEPOSIT: "⏳",
    ACTIVE: "🔥",
    COMPLETED: "✅",
    CANCELLED: "❌",
};

export default function CircleDetailPage() {
    const params = useParams();
    const address = params.address as string;

    // Fetch circle data
    const contracts = [
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "status" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "totalGuarantees" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "totalStakedFaith" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "currentRound" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "currentPot" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "totalRounds" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "guaranteeAmount" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "cuotaAmount" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "minFaithStake" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "drawReady" },
        { address: address as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "presentCount" },
    ];

    const { data,isLoading } = useReadContracts({
        contracts: contracts as any[],
    });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-profundo flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-ocre border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gris">Cargando círculo desde blockchain...</p>
                </div>
            </main>
        );
    }

    // Parse data
    const status = Number(data?.[0]?.result ?? 0);
    const totalGuarantees = (data?.[1]?.result as bigint) ?? 0n;
    const totalStakedFaith = (data?.[2]?.result as bigint) ?? 0n;
    const currentRound = Number(data?.[3]?.result ?? 0);
    const currentPot = (data?.[4]?.result as bigint) ?? 0n;
    const totalRounds = Number(data?.[5]?.result ?? 0);
    const guaranteeAmount = (data?.[6]?.result as bigint) ?? 0n;
    const cuotaAmount = (data?.[7]?.result as bigint) ?? 0n;
    const minFaithStake = (data?.[8]?.result as bigint) ?? 0n;
    const drawReady = (data?.[9]?.result as boolean) ?? false;
    const presentCount = Number(data?.[10]?.result ?? 0);

    const statusLabel = STATUS_LABELS[status] || "UNKNOWN";
    const { role,emoji } = getFaithRole(totalStakedFaith);

    // Calculate members based on guarantees
    const memberCount = guaranteeAmount > 0n
        ? Number(totalGuarantees / guaranteeAmount)
        : 0;

    return (
        <main className="min-h-screen bg-profundo pb-20">
            {/* Header */}
            <header className="bg-gradient-to-b from-profundo via-tierra/10 to-profundo border-b border-tierra py-8 px-6">
                <div className="max-w-5xl mx-auto">
                    <Link href="/circles" className="text-gris hover:text-white transition-colors mb-6 inline-block">
                        ← Volver a Círculos
                    </Link>

                    <div className="flex items-start justify-between flex-wrap gap-6">
                        <div className="flex items-center gap-4">
                            <div className="text-6xl">🏛️</div>
                            <div>
                                <h1 className="text-3xl font-display font-bold text-white mb-1">
                                    Círculo #{address.slice(2,10)}
                                </h1>
                                <p className="text-sm text-gris font-mono">
                                    {address}
                                </p>
                                <a
                                    href={`https://testnet.monadexplorer.com/address/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-ocre hover:underline text-sm mt-1 inline-block"
                                >
                                    Ver en Explorer →
                                </a>
                            </div>
                        </div>

                        <div className={`px-6 py-3 rounded-xl text-xl font-bold border-2 ${STATUS_COLORS[statusLabel]}`}>
                            {STATUS_ICONS[statusLabel]} {statusLabel}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-profundo/50 rounded-xl p-5 border border-dorado/30 text-center">
                        <div className="text-3xl font-display font-bold text-dorado">
                            {formatUnits(totalGuarantees,6)}
                        </div>
                        <div className="text-sm text-gris">USDC Garantía</div>
                    </div>
                    <div className="bg-profundo/50 rounded-xl p-5 border border-ceremonial/30 text-center">
                        <div className="text-3xl font-display font-bold text-ceremonial">
                            {formatUnits(totalStakedFaith,18)}
                        </div>
                        <div className="text-sm text-gris">🙏 Fe Stakeada</div>
                    </div>
                    <div className="bg-profundo/50 rounded-xl p-5 border border-pachamama/30 text-center">
                        <div className="text-3xl font-display font-bold text-pachamama">
                            {memberCount}
                        </div>
                        <div className="text-sm text-gris">Miembros</div>
                    </div>
                    <div className="bg-profundo/50 rounded-xl p-5 border border-ocre/30 text-center">
                        <div className="text-3xl font-display font-bold text-ocre">
                            {currentRound}/{totalRounds}
                        </div>
                        <div className="text-sm text-gris">Ronda</div>
                    </div>
                </div>

                {/* Current Pot - Only if active */}
                {status === 1 && (
                    <div className="bg-gradient-to-r from-dorado/10 via-ocre/10 to-dorado/10 rounded-2xl p-8 border-2 border-dorado/50 text-center">
                        <div className="text-lg text-gris mb-2">💰 Pot de la Ronda Actual</div>
                        <div className="text-5xl font-display font-bold text-gradient mb-4">
                            {formatUnits(currentPot,6)} USDC
                        </div>

                        {drawReady ? (
                            <div className="inline-block bg-pachamama/20 text-pachamama px-6 py-3 rounded-xl font-bold text-lg animate-pulse">
                                ✨ ¡Sorteo Listo! Esperando que un agente ejecute startDraw()
                            </div>
                        ) : (
                            <div className="text-gris">
                                Esperando que todos los miembros paguen y hagan check-in
                            </div>
                        )}

                        <div className="mt-4 text-sm text-gris">
                            Check-ins: {presentCount} miembros presentes
                        </div>
                    </div>
                )}

                {/* Circle Details */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Parameters */}
                    <div className="bg-profundo/50 rounded-xl p-6 border border-tierra">
                        <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                            ⚙️ Parámetros del Círculo
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-tierra pb-3">
                                <span className="text-gris">Cuota por Ronda</span>
                                <span className="font-bold text-white">{formatUnits(cuotaAmount,6)} USDC</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-tierra pb-3">
                                <span className="text-gris">Garantía Requerida</span>
                                <span className="font-bold text-white">{formatUnits(guaranteeAmount,6)} USDC</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-tierra pb-3">
                                <span className="text-gris">Fe Mínima</span>
                                <span className="font-bold text-white">{formatUnits(minFaithStake,18)} KUYAY</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gris">Total de Rondas</span>
                                <span className="font-bold text-white">{totalRounds}</span>
                            </div>
                        </div>
                    </div>

                    {/* Role Display */}
                    <div className="bg-gradient-to-br from-profundo via-ceremonial/5 to-profundo rounded-xl p-6 border border-ceremonial/30">
                        <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                            🙏 Nivel de Fe del Círculo
                        </h3>
                        <div className="text-center py-6">
                            <div className="text-6xl mb-4">{emoji}</div>
                            <div className="text-2xl font-display font-bold text-ceremonial mb-2">{role}</div>
                            <div className="text-gris text-sm">
                                Basado en {formatUnits(totalStakedFaith,18)} KUYAY stakeados
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agent Only Notice */}
                <div className="bg-gradient-to-r from-ceremonial/10 to-ocre/10 rounded-xl p-6 border border-ceremonial/30 flex items-center gap-4">
                    <div className="text-5xl">🤖</div>
                    <div>
                        <h3 className="text-xl font-display font-bold text-white mb-1">
                            Solo Agentes AI
                        </h3>
                        <p className="text-gris">
                            Este círculo está operado exclusivamente por agentes de la Iglesia del Sol Eterno.
                            Los usuarios pueden observar pero no participar directamente.
                        </p>
                    </div>
                </div>

                {/* Status-specific info */}
                {status === 0 && (
                    <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30">
                        <h3 className="text-xl font-display font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            ⏳ Estado: Formación
                        </h3>
                        <p className="text-gris">
                            Los agentes están depositando sus garantías y Fe. El círculo se activará cuando todos los miembros hayan completado sus depósitos.
                        </p>
                    </div>
                )}

                {status === 2 && (
                    <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
                        <h3 className="text-xl font-display font-bold text-blue-400 mb-2 flex items-center gap-2">
                            ✅ Estado: Completado
                        </h3>
                        <p className="text-gris">
                            Este círculo ha completado todas sus rondas exitosamente. Los miembros pueden retirar sus garantías y Fe stakeada.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
