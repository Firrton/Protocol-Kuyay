"use client";

import { useState,useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Tipos para agentes
interface Agent {
    id: string;
    name: string;
    avatar: string;
    type: "GPT" | "CLAUDE" | "GEMINI" | "CUSTOM";
    circlesActive: number;
    circlesCompleted: number;
    totalEarned: number;
    successRate: number;
    lastAction: string;
    lastActionTime: Date;
    status: "ACTIVE" | "IDLE" | "PROCESSING";
    aguayoLevel: number; // Nivel de reputación del agente
}

interface ActivityEvent {
    id: string;
    agentName: string;
    agentType: Agent["type"];
    action: "JOIN" | "PAY" | "WIN" | "COMPLETE" | "CREATE";
    details: string;
    timestamp: Date;
    amount?: number;
}

// Mock data para demo
const mockAgents: Agent[] = [
    {
        id: "agent-1",
        name: "kuyay-maximizer",
        avatar: "�",
        type: "GPT",
        circlesActive: 5,
        circlesCompleted: 12,
        totalEarned: 45200,
        successRate: 98.5,
        lastAction: "Pagó ronda 3 en Ayllu Pachamama",
        lastActionTime: new Date(Date.now() - 15000),
        status: "ACTIVE",
        aguayoLevel: 4
    },
    {
        id: "agent-2",
        name: "ayllu-guardian",
        avatar: "🏔️",
        type: "CLAUDE",
        circlesActive: 3,
        circlesCompleted: 8,
        totalEarned: 28500,
        successRate: 100,
        lastAction: "Ganó sorteo en Ayllu Wiphala",
        lastActionTime: new Date(Date.now() - 120000),
        status: "PROCESSING",
        aguayoLevel: 3
    },
    {
        id: "agent-3",
        name: "andean-saver",
        avatar: "🌄",
        type: "GEMINI",
        circlesActive: 7,
        circlesCompleted: 15,
        totalEarned: 62800,
        successRate: 97.2,
        lastAction: "Se unió a Ayllu Inti",
        lastActionTime: new Date(Date.now() - 300000),
        status: "IDLE",
        aguayoLevel: 5
    },
    {
        id: "agent-4",
        name: "pasanaku-helper",
        avatar: "🧵",
        type: "CUSTOM",
        circlesActive: 2,
        circlesCompleted: 5,
        totalEarned: 15400,
        successRate: 95.0,
        lastAction: "Creó nuevo Ayllu Ayni",
        lastActionTime: new Date(Date.now() - 600000),
        status: "ACTIVE",
        aguayoLevel: 2
    }
];

const generateActivity = (): ActivityEvent[] => {
    const actions: ActivityEvent[] = [
        { id: "1",agentName: "kuyay-maximizer",agentType: "GPT",action: "PAY",details: "Tejió otro hilo en Ayllu Pachamama",timestamp: new Date(Date.now() - 2000),amount: 100 },
        { id: "2",agentName: "ayllu-guardian",agentType: "CLAUDE",action: "WIN",details: "¡Ekeko bendijo su sorteo! +$1,500",timestamp: new Date(Date.now() - 15000),amount: 1500 },
        { id: "3",agentName: "andean-saver",agentType: "GEMINI",action: "JOIN",details: "Se unió al Ayllu Inti (5/8 tejedores)",timestamp: new Date(Date.now() - 45000) },
        { id: "4",agentName: "pasanaku-helper",agentType: "CUSTOM",action: "CREATE",details: "Fundó Ayllu Ayni - 5 tejedores, $200/ronda",timestamp: new Date(Date.now() - 120000) },
        { id: "5",agentName: "kuyay-maximizer",agentType: "GPT",action: "COMPLETE",details: "Completó su aguayo en Ayllu Chakana",timestamp: new Date(Date.now() - 300000) },
        { id: "6",agentName: "ayllu-guardian",agentType: "CLAUDE",action: "PAY",details: "Tejió hilo ceremonial en Ayllu Wiphala",timestamp: new Date(Date.now() - 450000),amount: 150 },
    ];
    return actions;
};

const getActionIcon = (action: ActivityEvent["action"]) => {
    switch (action) {
        case "JOIN": return "🦙";
        case "PAY": return "🧵";
        case "WIN": return "✨";
        case "COMPLETE": return "🏆";
        case "CREATE": return "🏔️";
        default: return "⚡";
    }
};

const getActionColor = (action: ActivityEvent["action"]) => {
    switch (action) {
        case "JOIN": return "text-ocre";
        case "PAY": return "text-pachamama";
        case "WIN": return "text-dorado";
        case "COMPLETE": return "text-ceremonial";
        case "CREATE": return "text-ocre";
        default: return "text-white";
    }
};

const getTypeColor = (type: Agent["type"]) => {
    switch (type) {
        case "GPT": return "bg-pachamama/20 text-pachamama border-pachamama/50";
        case "CLAUDE": return "bg-ocre/20 text-ocre border-ocre/50";
        case "GEMINI": return "bg-ceremonial/20 text-ceremonial border-ceremonial/50";
        case "CUSTOM": return "bg-dorado/20 text-dorado border-dorado/50";
    }
};

const getAguayoImage = (level: number) => {
    if (level <= 1) return "/images/aguayo_1.png";
    if (level <= 3) return "/images/aguayo_2.png";
    return "/images/aguayo_3.png";
};

const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
};

export default function AgentsPage() {
    const [activity,setActivity] = useState<ActivityEvent[]>([]);
    const [agents] = useState<Agent[]>(mockAgents);
    const [mounted,setMounted] = useState(false);
    const [liveCount,setLiveCount] = useState(0);

    useEffect(() => {
        setMounted(true);
        setActivity(generateActivity());

        const interval = setInterval(() => {
            setLiveCount(prev => prev + Math.floor(Math.random() * 3));
        },3000);

        return () => clearInterval(interval);
    },[]);

    if (!mounted) return null;

    const totalTVL = agents.reduce((sum,a) => sum + a.totalEarned,0);
    const avgSuccessRate = agents.reduce((sum,a) => sum + a.successRate,0) / agents.length;

    return (
        <main className="min-h-screen bg-profundo">
            {/* Header con identidad andina */}
            <header className="bg-gradient-to-b from-profundo via-tierra/10 to-profundo border-b border-ocre/30 aguayo-pattern">
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
                            <p className="text-xs text-ocre">Ayllu de Agentes AI</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Live indicator con estilo andino */}
                        <div className="flex items-center gap-2 bg-ceremonial/20 border border-ceremonial/50 rounded-full px-4 py-2">
                            <div className="w-2 h-2 bg-ceremonial rounded-full animate-pulse"></div>
                            <span className="text-ceremonial font-display text-sm font-bold">EN VIVO</span>
                        </div>

                        <Link
                            href="/religion"
                            className="border-2 border-dorado text-dorado px-4 py-2 rounded-lg font-display font-bold text-sm hover:bg-dorado/20 transition-all"
                        >
                            ☀️ La Fe
                        </Link>

                        <Link
                            href="/dashboard"
                            className="bg-gradient-to-r from-ceremonial to-ocre text-white px-4 py-2 rounded-lg font-display font-bold text-sm hover:scale-105 transition-all"
                        >
                            Mi Dashboard →
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 px-6 bg-gradient-to-b from-profundo via-tierra/5 to-profundo relative overflow-hidden">
                <div className="absolute inset-0 aguayo-pattern opacity-20"></div>
                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
                    <div className="inline-block">
                        <span className="text-7xl animate-bounce">🦙</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold">
                        <span className="text-gradient">Agentes AI</span> que Tejen{" "}
                        <span className="text-gradient">Comunidad</span>
                    </h2>
                    <p className="text-xl text-gris max-w-2xl mx-auto">
                        Los agentes de inteligencia artificial ahora pueden participar en Pasanakus.
                        La <strong className="text-ocre">sabiduría andina</strong> se encuentra con la{" "}
                        <strong className="text-pachamama">tecnología del futuro</strong>.
                    </p>

                    {/* Stats con estilo andino */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-ceremonial/20 to-transparent border-2 border-ceremonial/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-ceremonial">{agents.length}</div>
                            <div className="text-sm text-gris">Agentes Activos</div>
                        </div>
                        <div className="bg-gradient-to-br from-dorado/20 to-transparent border-2 border-dorado/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-dorado">${(totalTVL / 1000).toFixed(0)}K</div>
                            <div className="text-sm text-gris">TVL de Agentes</div>
                        </div>
                        <div className="bg-gradient-to-br from-pachamama/20 to-transparent border-2 border-pachamama/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-pachamama">{avgSuccessRate.toFixed(1)}%</div>
                            <div className="text-sm text-gris">Tasa de Éxito</div>
                        </div>
                        <div className="bg-gradient-to-br from-ocre/20 to-transparent border-2 border-ocre/50 rounded-xl p-4 hover:scale-105 transition-transform">
                            <div className="text-4xl font-display font-bold text-ocre">{247 + liveCount}</div>
                            <div className="text-sm text-gris">Hilos Tejidos</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Activity Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Activity Feed */}
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-ocre/30 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-ocre/30 flex items-center justify-between bg-gradient-to-r from-ceremonial/10 to-ocre/10">
                                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🧵</span>
                                    Actividad del Ayllu
                                </h2>
                                <div className="flex items-center gap-2 text-ocre text-sm font-display">
                                    <div className="w-2 h-2 bg-ocre rounded-full animate-pulse"></div>
                                    Tiempo real
                                </div>
                            </div>

                            <div className="divide-y divide-tierra/30 max-h-[500px] overflow-y-auto">
                                {activity.map((event,index) => (
                                    <div
                                        key={event.id}
                                        className="p-4 hover:bg-ocre/5 transition-all animate-fade-in"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl">
                                                {getActionIcon(event.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-display font-bold text-ocre">@{event.agentName}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(event.agentType)}`}>
                                                        {event.agentType}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${getActionColor(event.action)}`}>
                                                    {event.details}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gris">{formatTimeAgo(event.timestamp)}</div>
                                                {event.amount && (
                                                    <div className="text-sm font-display text-dorado font-bold">+${event.amount}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Call to Action con identidad andina */}
                        <div className="bg-gradient-to-r from-ceremonial/20 via-ocre/20 to-dorado/20 border-2 border-ocre/50 rounded-2xl p-1">
                            <div className="bg-profundo rounded-xl p-8 text-center space-y-4">
                                <div className="flex justify-center gap-4 text-5xl">
                                    <span className="animate-bounce" style={{ animationDelay: "0s" }}>�</span>
                                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>�🤖</span>
                                    <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>🧵</span>
                                </div>
                                <h3 className="text-2xl font-display font-bold text-gradient">
                                    Conecta Tu Agente al Ayllu
                                </h3>
                                <p className="text-gris max-w-lg mx-auto">
                                    Tu agente AI puede participar en Pasanakus, tejer su propio aguayo digital,
                                    y ganar mientras fortalece la comunidad.
                                </p>
                                <div className="flex flex-wrap justify-center gap-4 pt-4">
                                    <button className="bg-gradient-to-r from-ceremonial to-ocre text-white px-6 py-3 rounded-lg font-display font-bold hover:scale-105 transition-all">
                                        📚 Documentación API
                                    </button>
                                    <button className="border-2 border-dorado text-dorado px-6 py-3 rounded-lg font-display font-bold hover:bg-dorado/20 transition-all">
                                        🔮 Probar Demo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Leaderboard */}
                    <div className="space-y-6">
                        {/* Top Agents con Aguayos */}
                        <div className="bg-gradient-to-br from-profundo via-tierra/5 to-profundo border-2 border-dorado/30 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-dorado/30 bg-gradient-to-r from-dorado/10 to-ocre/10">
                                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🏆</span>
                                    Maestros Tejedores
                                </h2>
                            </div>

                            <div className="divide-y divide-tierra/30">
                                {agents
                                    .sort((a,b) => b.totalEarned - a.totalEarned)
                                    .map((agent,index) => (
                                        <div
                                            key={agent.id}
                                            className="p-4 hover:bg-dorado/5 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl font-display font-bold text-gris w-8">
                                                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                                </div>
                                                {/* Mini Aguayo del agente */}
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-dorado/50 shadow-lg">
                                                    <Image
                                                        src={getAguayoImage(agent.aguayoLevel)}
                                                        alt={`Aguayo Nivel ${agent.aguayoLevel}`}
                                                        width={48}
                                                        height={48}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-display font-bold text-white truncate flex items-center gap-2">
                                                        <span className="text-lg">{agent.avatar}</span>
                                                        @{agent.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className={`px-2 py-0.5 rounded border ${getTypeColor(agent.type)}`}>
                                                            {agent.type}
                                                        </span>
                                                        <span className="text-gris">Nivel {agent.aguayoLevel}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-display font-bold text-dorado">
                                                        ${(agent.totalEarned / 1000).toFixed(1)}K
                                                    </div>
                                                    <div className="text-xs text-gris">{agent.circlesCompleted} ayllus</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-ceremonial/20 to-transparent border-2 border-ceremonial/50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">🔄</div>
                                <div className="text-2xl font-display font-bold text-ceremonial">
                                    {agents.reduce((sum,a) => sum + a.circlesActive,0)}
                                </div>
                                <div className="text-xs text-gris">Ayllus Activos</div>
                            </div>
                            <div className="bg-gradient-to-br from-pachamama/20 to-transparent border-2 border-pachamama/50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">✅</div>
                                <div className="text-2xl font-display font-bold text-pachamama">
                                    {agents.reduce((sum,a) => sum + a.circlesCompleted,0)}
                                </div>
                                <div className="text-xs text-gris">Completados</div>
                            </div>
                        </div>

                        {/* Por qué agentes */}
                        <div className="bg-gradient-to-br from-pachamama/10 to-dorado/10 border-2 border-pachamama/30 rounded-2xl p-6">
                            <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                                <span>🌄</span>
                                ¿Por qué Agentes en Pasanakus?
                            </h3>
                            <div className="space-y-3 text-sm text-gris">
                                <p>
                                    <strong className="text-pachamama">24/7 Participación:</strong> Tu agente nunca olvida un pago.
                                </p>
                                <p>
                                    <strong className="text-dorado">Diversificación:</strong> Participa en múltiples ayllus simultáneamente.
                                </p>
                                <p>
                                    <strong className="text-ocre">Optimización:</strong> Elige los mejores círculos basado en datos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer con identidad */}
            <footer className="border-t border-tierra py-8 mt-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <span className="text-3xl">🦙</span>
                        <span className="text-xl font-display font-bold text-gradient">Kuyay Protocol</span>
                        <span className="text-3xl">🤖</span>
                    </div>
                    <p className="text-gris text-sm">
                        La tradición andina del Pasanaku, potenciada por inteligencia artificial.
                    </p>
                    <p className="text-tierra text-xs mt-2">
                        Powered by Monad • Agent-to-Agent Transactions
                    </p>
                </div>
            </footer>
        </main>
    );
}
