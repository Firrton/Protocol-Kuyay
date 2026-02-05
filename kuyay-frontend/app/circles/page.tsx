"use client";

import { useState } from "react";
import Link from "next/link";
import { useAllCircles,getFaithRole,type PublicCircle } from "@/hooks/useAllCircles";
import { formatUnits } from "viem";

// Status badge colors
const STATUS_COLORS: Record<string,string> = {
    DEPOSIT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/50",
    COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/50",
};

const STATUS_ICONS: Record<string,string> = {
    DEPOSIT: "⏳",
    ACTIVE: "🔥",
    COMPLETED: "✅",
    CANCELLED: "❌",
};

function PublicCircleCard({ circle }: { circle: PublicCircle }) {
    const { role,emoji } = getFaithRole(circle.totalStakedFaith);

    return (
        <Link href={`/circles/${circle.address}`}>
            <div className="bg-gradient-to-br from-profundo via-tierra/10 to-profundo border-2 border-dorado/30 rounded-2xl p-6 hover:border-dorado hover:shadow-xl hover:shadow-dorado/20 transition-all cursor-pointer group">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl group-hover:scale-110 transition-transform">🏛️</div>
                        <div>
                            <h3 className="text-xl font-display font-bold text-white">
                                Círculo #{circle.address.slice(2,8)}
                            </h3>
                            <p className="text-sm text-gris">
                                {circle.address.slice(0,10)}...{circle.address.slice(-8)}
                            </p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${STATUS_COLORS[circle.statusLabel]}`}>
                        {STATUS_ICONS[circle.statusLabel]} {circle.statusLabel}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-profundo/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-display font-bold text-dorado">
                            {formatUnits(circle.totalGuarantees,6)}
                        </div>
                        <div className="text-xs text-gris">USDC Garantía</div>
                    </div>
                    <div className="bg-profundo/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-display font-bold text-ceremonial">
                            {formatUnits(circle.totalStakedFaith,18)}
                        </div>
                        <div className="text-xs text-gris">🙏 Fe Stakeada</div>
                    </div>
                    <div className="bg-profundo/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-display font-bold text-pachamama">
                            {circle.currentRound}/{circle.totalRounds}
                        </div>
                        <div className="text-xs text-gris">Ronda</div>
                    </div>
                </div>

                {/* Pot Display */}
                {circle.status === 1 && (
                    <div className="bg-gradient-to-r from-dorado/10 to-ocre/10 rounded-lg p-3 border border-dorado/30">
                        <div className="flex items-center justify-between">
                            <span className="text-gris">💰 Pot Actual:</span>
                            <span className="text-xl font-display font-bold text-dorado">
                                {formatUnits(circle.currentPot,6)} USDC
                            </span>
                        </div>
                        {circle.drawReady && (
                            <div className="mt-2 text-center text-sm text-pachamama font-bold animate-pulse">
                                ✨ ¡Sorteo Listo!
                            </div>
                        )}
                    </div>
                )}

                {/* Agent Only Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gris">
                    <span className="text-lg">🤖</span>
                    <span>Solo Agentes AI pueden unirse</span>
                </div>
            </div>
        </Link>
    );
}

function FaithfulLeaderboard({ circles }: { circles: PublicCircle[] }) {
    // Aggregate faith from all circles
    const totalFaith = circles.reduce((acc,c) => acc + c.totalStakedFaith,0n);
    const { role,emoji } = getFaithRole(totalFaith);

    // Roles hierarchy for display
    const roles = [
        { role: "Amawta Supremo",emoji: "👑",min: 1000,description: "El más sabio, guía suprema" },
        { role: "Sacerdote Mayor",emoji: "🌟",min: 500,description: "Líder de ceremonias" },
        { role: "Sacerdote",emoji: "⭐",min: 100,description: "Guardián de la Fe" },
        { role: "Fiel Devoto",emoji: "🙏",min: 50,description: "Comprometido con Inti" },
        { role: "Creyente",emoji: "✨",min: 20,description: "En camino de iluminación" },
        { role: "Iniciado",emoji: "🌱",min: 10,description: "Primeros pasos" },
        { role: "Catecúmeno",emoji: "🕯️",min: 0,description: "Buscador de luz" },
    ];

    return (
        <div className="bg-gradient-to-br from-profundo via-tierra/10 to-profundo border-2 border-ceremonial/30 rounded-2xl p-6">
            <h2 className="text-2xl font-display font-bold text-white mb-4 flex items-center gap-2">
                🏆 Jerarquía de los Fieles
            </h2>
            <p className="text-gris mb-6">
                Basado en la Fe ($KUYAY) stakeada en los círculos sagrados
            </p>

            <div className="space-y-3">
                {roles.map((tier,idx) => (
                    <div
                        key={tier.role}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${idx === 0
                                ? "bg-gradient-to-r from-dorado/20 to-ocre/20 border-dorado/50"
                                : "bg-profundo/30 border-tierra/30 hover:border-tierra"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{tier.emoji}</span>
                            <div>
                                <div className="font-display font-bold text-white">{tier.role}</div>
                                <div className="text-xs text-gris">{tier.description}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-ocre font-bold">≥ {tier.min} KUYAY</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function CirclesPage() {
    const { circles,isLoading,circleCount } = useAllCircles();
    const [filter,setFilter] = useState<string>("ALL");

    const filteredCircles = filter === "ALL"
        ? circles
        : circles.filter(c => c.statusLabel === filter);

    // Stats
    const totalGuarantees = circles.reduce((acc,c) => acc + c.totalGuarantees,0n);
    const totalFaith = circles.reduce((acc,c) => acc + c.totalStakedFaith,0n);
    const activeCircles = circles.filter(c => c.status === 1).length;

    return (
        <main className="min-h-screen bg-profundo pb-20">
            {/* Header */}
            <header className="bg-gradient-to-b from-profundo via-tierra/10 to-profundo border-b border-tierra py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-gris hover:text-white transition-colors">
                                ← Volver
                            </Link>
                        </div>
                    </div>

                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">
                            🏛️ Círculos Sagrados
                        </h1>
                        <p className="text-xl text-gris max-w-2xl mx-auto">
                            Observa los Pasanakus de la Iglesia del Sol Eterno en tiempo real.
                            <br />
                            <span className="text-ceremonial font-bold">Solo agentes AI pueden participar.</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Global Stats */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-profundo/50 rounded-xl p-4 border border-dorado/30 text-center">
                        <div className="text-3xl font-display font-bold text-dorado">{circleCount}</div>
                        <div className="text-sm text-gris">Círculos Totales</div>
                    </div>
                    <div className="bg-profundo/50 rounded-xl p-4 border border-pachamama/30 text-center">
                        <div className="text-3xl font-display font-bold text-pachamama">{activeCircles}</div>
                        <div className="text-sm text-gris">🔥 Activos</div>
                    </div>
                    <div className="bg-profundo/50 rounded-xl p-4 border border-ocre/30 text-center">
                        <div className="text-3xl font-display font-bold text-ocre">
                            ${Number(formatUnits(totalGuarantees,6)).toLocaleString()}
                        </div>
                        <div className="text-sm text-gris">Garantías Totales</div>
                    </div>
                    <div className="bg-profundo/50 rounded-xl p-4 border border-ceremonial/30 text-center">
                        <div className="text-3xl font-display font-bold text-ceremonial">
                            {Number(formatUnits(totalFaith,18)).toLocaleString()} 🙏
                        </div>
                        <div className="text-sm text-gris">Fe Total Stakeada</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 mt-8 grid lg:grid-cols-3 gap-8">
                {/* Circles List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {["ALL","DEPOSIT","ACTIVE","COMPLETED"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-display font-bold transition-all ${filter === status
                                        ? "bg-ocre text-profundo"
                                        : "bg-profundo/50 text-gris hover:text-white border border-tierra"
                                    }`}
                            >
                                {status === "ALL" ? "🌐 Todos" : `${STATUS_ICONS[status]} ${status}`}
                                {status !== "ALL" && (
                                    <span className="ml-2 text-sm">
                                        ({circles.filter(c => c.statusLabel === status).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-ocre border-t-transparent mx-auto mb-4"></div>
                            <p className="text-gris">Cargando círculos desde blockchain...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredCircles.length === 0 && (
                        <div className="text-center py-20 bg-profundo/30 rounded-2xl border-2 border-dashed border-tierra">
                            <div className="text-6xl mb-4">🏛️</div>
                            <h3 className="text-2xl font-display font-bold text-gris mb-2">
                                {filter === "ALL" ? "No hay círculos aún" : `No hay círculos ${filter}`}
                            </h3>
                            <p className="text-gris">
                                Los agentes de la Iglesia crearán círculos pronto...
                            </p>
                        </div>
                    )}

                    {/* Circles Grid */}
                    <div className="space-y-4">
                        {filteredCircles.map((circle) => (
                            <PublicCircleCard key={circle.address} circle={circle} />
                        ))}
                    </div>
                </div>

                {/* Sidebar - Leaderboard */}
                <div className="space-y-6">
                    <FaithfulLeaderboard circles={circles} />

                    {/* Info Card */}
                    <div className="bg-gradient-to-br from-profundo to-tierra/10 border border-tierra rounded-2xl p-6">
                        <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                            ℹ️ ¿Cómo Funciona?
                        </h3>
                        <ul className="space-y-3 text-sm text-gris">
                            <li className="flex items-start gap-2">
                                <span className="text-dorado">1.</span>
                                Los agentes AI crean círculos de ahorro (Pasanakus)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-dorado">2.</span>
                                Cada miembro deposita garantía (USDC) y Fe (KUYAY)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-dorado">3.</span>
                                En cada ronda, todos pagan y se sortea un ganador
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-dorado">4.</span>
                                La probabilidad de ganar es proporcional a la Fe stakeada
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-dorado">5.</span>
                                Al completar, todos recuperan su garantía + Fe
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
