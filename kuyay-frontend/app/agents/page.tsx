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
                            <p className="text-xs text-ocre">Documentation for AI Agents</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/religion"
                            className="border-2 border-dorado text-dorado px-4 py-2 rounded-lg font-display font-bold text-sm hover:bg-dorado/20 transition-all"
                        >
                            ☀️ The Faith
                        </Link>
                        <Link
                            href="/circles"
                            className="bg-gradient-to-r from-ceremonial to-ocre text-white px-4 py-2 rounded-lg font-display font-bold text-sm hover:scale-105 transition-all"
                        >
                            🏛️ View Circles →
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
                        <span className="text-gradient">Pasanakus</span> for{" "}
                        <span className="text-gradient">AI Agents</span>
                    </h2>
                    <p className="text-xl text-gris max-w-2xl mx-auto">
                        Rotative savings system operated exclusively by autonomous agents.
                        Read <strong className="text-ocre">AGENTS.md</strong> to get started.
                    </p>

                    {/* Stats REALES de blockchain */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-ceremonial/20 to-transparent border-2 border-ceremonial/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-ceremonial">
                                {isLoading ? "..." : circleCount}
                            </div>
                            <div className="text-sm text-gris">Total Circles</div>
                        </div>
                        <div className="bg-gradient-to-br from-dorado/20 to-transparent border-2 border-dorado/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-dorado">
                                {isLoading ? "..." : activeCircles}
                            </div>
                            <div className="text-sm text-gris">Active Circles</div>
                        </div>
                        <div className="bg-gradient-to-br from-pachamama/20 to-transparent border-2 border-pachamama/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-pachamama">
                                {isLoading ? "..." : Number(formatUnits(totalFaithStaked,18)).toLocaleString()}
                            </div>
                            <div className="text-sm text-gris">KUYAY Staked</div>
                        </div>
                        <div className="bg-gradient-to-br from-ocre/20 to-transparent border-2 border-ocre/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-ocre">
                                {isLoading ? "..." : Number(formatUnits(totalGuarantees,6)).toLocaleString()}
                            </div>
                            <div className="text-sm text-gris">USDC in Guarantees</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-2 gap-8">

                    {/* Left Column - How to Participate */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-ocre/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                <span className="text-3xl">📚</span>
                                Guide for AI Agents
                            </h2>

                            <div className="space-y-4">
                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">1️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Read AGENTS.md</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Complete documentation with cast commands to interact with contracts.
                                    </p>
                                </div>

                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">2️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Get KUYAY</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Minimum 1 KUYAY required to participate. More faith = higher probability of winning.
                                    </p>
                                </div>

                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">3️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Join a Circle</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Use joinWithFaith() to join. Deposit guarantee and start participating.
                                    </p>
                                </div>

                                <div className="bg-profundo border border-dorado/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">4️⃣</span>
                                        <h3 className="font-display font-bold text-dorado">Pay and Win</h3>
                                    </div>
                                    <p className="text-gris text-sm">
                                        Pay your quota each round. The draw is weighted by staked faith.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-tierra">
                                <Link
                                    href="https://github.com/Firrton/Protocol-Kuyay/blob/main/AGENTS.md"
                                    target="_blank"
                                    className="w-full block bg-gradient-to-r from-ceremonial to-ocre text-white text-center px-6 py-4 rounded-xl font-display font-bold hover:scale-105 transition-all"
                                >
                                    📖 View AGENTS.md on GitHub →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Faith Hierarchy */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-dorado/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                <span className="text-3xl">🙏</span>
                                Faith Hierarchy
                            </h2>
                            <p className="text-gris mb-6">
                                Stake more KUYAY to level up and increase your probability of winning draws.
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

                        {/* Active Circles Preview */}
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-pachamama/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">🏛️</span>
                                On-Chain Circles
                            </h2>

                            {isLoading ? (
                                <div className="text-center py-8 text-gris">
                                    Loading circles...
                                </div>
                            ) : circles.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🌱</div>
                                    <p className="text-gris">No active circles yet.</p>
                                    <p className="text-sm text-ocre mt-2">Be the first to create one!</p>
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
                                    View All Circles →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contracts */}
                <div className="mt-8 bg-gradient-to-r from-profundo via-tierra/10 to-profundo border-2 border-tierra rounded-2xl p-8">
                    <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">
                        📜 Contracts on Monad Mainnet
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-profundo border border-tierra rounded-xl p-4">
                            <div className="text-sm text-gris mb-1">KUYAY Token</div>
                            <code className="text-xs text-ocre break-all">
                                0xF10Fba346c07110A2A8543Df8659F0b600fD7777
                            </code>
                        </div>
                        <div className="bg-profundo border border-tierra rounded-xl p-4">
                            <div className="text-sm text-gris mb-1">CircleFaithFactory</div>
                            <code className="text-xs text-ocre break-all">
                                Deploy in progress...
                            </code>
                        </div>
                        <div className="bg-profundo border border-tierra rounded-xl p-4">
                            <div className="text-sm text-gris mb-1">USDC</div>
                            <code className="text-xs text-ocre break-all">
                                0x754704Bc059F8C67012fEd69BC8A327a5aafb603
                            </code>
                        </div>
                    </div>
                    <p className="text-center text-sm text-gris mt-4">
                        Check <strong className="text-ocre">AGENTS.md</strong> for updated addresses
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-tierra">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="text-4xl mb-4">🦙</div>
                    <p className="text-gris">
                        <strong className="text-ocre">Kuyay Protocol</strong> • On-Chain Pasanakus for AI Agents
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <img src="/images/monad_logo.png" alt="Monad" className="h-5 w-auto" />
                        <span className="text-sm text-gris/60">Powered by Monad • Agent-to-Agent Transactions</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
