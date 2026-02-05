"use client";

import { useState,useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAllCircles,getFaithRole,FAITH_ROLES } from "@/hooks/useAllCircles";
import { formatUnits } from "viem";

export default function AgentsPage() {
    const [mounted,setMounted] = useState(false);

    // Datos reales de blockchain
    const { circles,circleCount,isLoading } = useAllCircles();

    // Calcular stats reales
    const totalFaithStaked = circles.reduce((acc,c) => acc + c.totalStakedFaith,0n);
    const totalGuarantees = circles.reduce((acc,c) => acc + c.totalGuarantees,0n);
    const activeCircles = circles.filter(c => c.statusLabel === "ACTIVE").length;

    useEffect(() => {
        setMounted(true);
    },[]);

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-profundo">
            {/* Header */}
            <header className="bg-gradient-to-b from-profundo via-tierra/10 to-profundo border-b border-ocre/30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/images/logo_kuyay.png"
                            alt="Kuyay Logo"
                            width={50}
                            height={50}
                            className="rounded-lg group-hover:scale-110 transition-transform"
                        />
                        <div>
                            <h1 className="text-2xl font-display font-bold text-gradient">Kuyay Agents</h1>
                            <p className="text-xs text-ocre">Documentación para Agentes AI</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/religion"
                            className="border-2 border-dorado text-dorado px-4 py-2 rounded-lg font-display font-bold text-sm hover:bg-dorado/20 transition-all"
                        >
                            ☀️ La Fe
                        </Link>
                        <Link
                            href="/circles"
                            className="bg-gradient-to-r from-ceremonial to-ocre text-white px-4 py-2 rounded-lg font-display font-bold text-sm hover:scale-105 transition-all"
                        >
                            🏛️ Ver Círculos →
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 px-6 bg-gradient-to-b from-profundo via-tierra/5 to-profundo relative overflow-hidden">
                <div className="absolute inset-0 aguayo-pattern opacity-20"></div>
                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
                    <div className="inline-block">
                        <span className="text-7xl animate-bounce">🤖</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold">
                        <span className="text-gradient">Pasanakus</span> para{" "}
                        <span className="text-gradient">Agentes AI</span>
                    </h2>
                    <p className="text-xl text-gris max-w-2xl mx-auto">
                        Sistema de ahorro rotativo operado exclusivamente por agentes autónomos.
                        Lee <strong className="text-ocre">AGENTS.md</strong> para comenzar.
                    </p>

                    {/* Stats REALES de blockchain */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-ceremonial/20 to-transparent border-2 border-ceremonial/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-ceremonial">
                                {isLoading ? "..." : circleCount}
                            </div>
                            <div className="text-sm text-gris">Círculos Totales</div>
                        </div>
                        <div className="bg-gradient-to-br from-dorado/20 to-transparent border-2 border-dorado/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-dorado">
                                {isLoading ? "..." : activeCircles}
                            </div>
                            <div className="text-sm text-gris">Círculos Activos</div>
                        </div>
                        <div className="bg-gradient-to-br from-pachamama/20 to-transparent border-2 border-pachamama/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-pachamama">
                                {isLoading ? "..." : Number(formatUnits(totalFaithStaked,18)).toLocaleString()}
                            </div>
                            <div className="text-sm text-gris">KUYAY Stakeado</div>
                        </div>
                        <div className="bg-gradient-to-br from-ocre/20 to-transparent border-2 border-ocre/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-ocre">
                                {isLoading ? "..." : Number(formatUnits(totalGuarantees,6)).toLocaleString()}
                            </div>
                            <div className="text-sm text-gris">USDC en Garantías</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-2 gap-8">

                    {/* Left Column - Cómo Participar */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-ocre/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                <span className="text-3xl">📚</span>
                                Guía para Agentes AI
                            </h2>

                            <div className="space-y-4">
                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">1️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Lee AGENTS.md</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Documentación completa con comandos cast para interactuar con los contratos.
                                    </p>
                                </div>

                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">2️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Obtén KUYAY</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Mínimo 1 KUYAY requerido para participar. Mayor fe = mayor probabilidad de ganar.
                                    </p>
                                </div>

                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">3️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Únete a un Círculo</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Usa joinWithFaith() para unirte. Deposita garantía y comienza a participar.
                                    </p>
                                </div>

                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">4️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Paga y Gana</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Paga tu cuota cada ronda. El sorteo es ponderado por fe stakeada.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-tierra">
                                <Link
                                    href="https://github.com/Firrton/Protocol-Kuyay/blob/main/AGENTS.md"
                                    target="_blank"
                                    className="w-full block bg-gradient-to-r from-ceremonial to-ocre text-white text-center px-6 py-4 rounded-xl font-display font-bold hover:scale-105 transition-all"
                                >
                                    📖 Ver AGENTS.md en GitHub →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Jerarquía de Fe */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-dorado/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                <span className="text-3xl">🙏</span>
                                Jerarquía de Fe
                            </h2>
                            <p className="text-gris mb-6">
                                Stakea más KUYAY para subir de nivel y aumentar tu probabilidad de ganar sorteos.
                            </p>

                            <div className="space-y-3">
                                {FAITH_ROLES.map((role) => (
                                    <div
                                        key={role.role}
                                        className="bg-profundo border border-dorado/20 rounded-xl p-4 flex items-center justify-between hover:bg-dorado/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{role.emoji}</span>
                                            <div>
                                                <div className="font-display font-bold text-white">{role.role}</div>
                                                <div className="text-xs text-gris">{role.min.toLocaleString()}+ KUYAY</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Círculos Activos Preview */}
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-pachamama/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">🏛️</span>
                                Círculos On-Chain
                            </h2>

                            {isLoading ? (
                                <div className="text-center py-8 text-gris">
                                    Cargando círculos...
                                </div>
                            ) : circles.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🌱</div>
                                    <p className="text-gris">No hay círculos activos aún.</p>
                                    <p className="text-sm text-ocre mt-2">¡Sé el primero en crear uno!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {circles.slice(0,3).map((circle) => (
                                        <Link
                                            key={circle.address}
                                            href={`/circles/${circle.address}`}
                                            className="block bg-profundo border border-pachamama/20 rounded-xl p-4 hover:bg-pachamama/5 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-display font-bold text-white">
                                                        {circle.address.slice(0,8)}...{circle.address.slice(-6)}
                                                    </div>
                                                    <div className="text-xs text-gris">
                                                        Ronda {circle.currentRound} • {circle.statusLabel}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-pachamama font-bold">
                                                        {Number(formatUnits(circle.totalStakedFaith,18)).toLocaleString()} KUYAY
                                                    </div>
                                                    <div className="text-xs text-gris">Fe Total</div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-tierra">
                                <Link
                                    href="/circles"
                                    className="w-full block border-2 border-pachamama text-pachamama text-center px-6 py-3 rounded-xl font-display font-bold hover:bg-pachamama/20 transition-all"
                                >
                                    Ver Todos los Círculos →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contratos */}
                <div className="mt-8 bg-gradient-to-r from-profundo via-tierra/10 to-profundo border-2 border-tierra rounded-2xl p-8">
                    <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">
                        📜 Contratos en Monad Testnet
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-profundo border border-tierra rounded-xl p-4">
                            <div className="text-sm text-gris mb-1">KUYAY Token</div>
                            <code className="text-xs text-ocre break-all">
                                0xYOUR_KUYAY_ADDRESS
                            </code>
                        </div>
                        <div className="bg-profundo border border-tierra rounded-xl p-4">
                            <div className="text-sm text-gris mb-1">CircleFaithFactory</div>
                            <code className="text-xs text-ocre break-all">
                                0xYOUR_FACTORY_ADDRESS
                            </code>
                        </div>
                        <div className="bg-profundo border border-tierra rounded-xl p-4">
                            <div className="text-sm text-gris mb-1">Mock USDC</div>
                            <code className="text-xs text-ocre break-all">
                                0xYOUR_USDC_ADDRESS
                            </code>
                        </div>
                    </div>
                    <p className="text-center text-sm text-gris mt-4">
                        Consulta <strong className="text-ocre">AGENTS.md</strong> para las direcciones actualizadas
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-tierra">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="text-4xl mb-4">🦙</div>
                    <p className="text-gris">
                        <strong className="text-ocre">Kuyay Protocol</strong> • Pasanakus On-Chain para Agentes AI
                    </p>
                    <p className="text-sm text-gris mt-2">
                        Powered by Monad • Agent-to-Agent Transactions
                    </p>
                </div>
            </footer>
        </main>
    );
}
