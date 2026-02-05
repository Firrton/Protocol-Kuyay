// Mock data para demo de Monte Carlo

export interface WalletProfile {
    address: string;
    name: string;
    aguayoLevel: number;
    stains: number;
    riskProfile: "low" | "medium" | "high" | "critical";
    completedCircles: number;
    onTimePaymentRate: number;
}

export interface MonteCarloScenario {
    id: string;
    title: string;
    description: string;
    numMembers: number;
    cuotaAmount: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    expectedSuccessRate: number;
    wallets: WalletProfile[];
    culturalNote: string;
}

// Wallets mock para demo
const MOCK_WALLETS: Record<string,WalletProfile> = {
    maria: {
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f8f3e1",
        name: "María Quispe",
        aguayoLevel: 5,
        stains: 0,
        riskProfile: "low",
        completedCircles: 12,
        onTimePaymentRate: 100,
    },
    juan: {
        address: "0x8f3e35Cc6634C0532925a3b844Bc9e7595f8f3e2",
        name: "Juan Mamani",
        aguayoLevel: 4,
        stains: 0,
        riskProfile: "low",
        completedCircles: 8,
        onTimePaymentRate: 98,
    },
    rosa: {
        address: "0x1a9c35Cc6634C0532925a3b844Bc9e7595f8f3e3",
        name: "Rosa Huanca",
        aguayoLevel: 3,
        stains: 1,
        riskProfile: "medium",
        completedCircles: 5,
        onTimePaymentRate: 85,
    },
    pedro: {
        address: "0x5d2b35Cc6634C0532925a3b844Bc9e7595f8f3e4",
        name: "Pedro Condori",
        aguayoLevel: 2,
        stains: 2,
        riskProfile: "high",
        completedCircles: 3,
        onTimePaymentRate: 60,
    },
    nuevaWallet: {
        address: "0x9e4f35Cc6634C0532925a3b844Bc9e7595f8f3e5",
        name: "Nueva Wallet",
        aguayoLevel: 0,
        stains: 0,
        riskProfile: "high",
        completedCircles: 0,
        onTimePaymentRate: 0,
    },
    scammer: {
        address: "0x3c8a35Cc6634C0532925a3b844Bc9e7595f8f3e6",
        name: "Wallet Sospechosa",
        aguayoLevel: 1,
        stains: 5,
        riskProfile: "critical",
        completedCircles: 2,
        onTimePaymentRate: 20,
    },
    agentAI: {
        address: "0x7b1d35Cc6634C0532925a3b844Bc9e7595f8f3e7",
        name: "🤖 Agente Kuyay",
        aguayoLevel: 4,
        stains: 0,
        riskProfile: "low",
        completedCircles: 15,
        onTimePaymentRate: 100,
    },
};

export const MONTE_CARLO_SCENARIOS: Record<string,MonteCarloScenario> = {
    perfectCircle: {
        id: "perfect",
        title: "🌟 Ayllu Perfecto",
        description: "Todos los miembros tienen excelente reputación y pagan a tiempo.",
        numMembers: 5,
        cuotaAmount: 100,
        riskLevel: "low",
        expectedSuccessRate: 98,
        wallets: [
            MOCK_WALLETS.maria,
            MOCK_WALLETS.juan,
            MOCK_WALLETS.rosa,
            MOCK_WALLETS.agentAI,
            { ...MOCK_WALLETS.maria,address: "0xabc123",name: "Ana Flores" },
        ],
        culturalNote: "Como el tejido perfecto de un aguayo ceremonial, cada hilo contribuye a la fortaleza del todo.",
    },
    riskyCircle: {
        id: "risky",
        title: "⚠️ Ayllu Riesgoso",
        description: "Mezcla de miembros confiables con wallets nuevas sin historial.",
        numMembers: 5,
        cuotaAmount: 150,
        riskLevel: "medium",
        expectedSuccessRate: 72,
        wallets: [
            MOCK_WALLETS.maria,
            MOCK_WALLETS.nuevaWallet,
            { ...MOCK_WALLETS.nuevaWallet,address: "0xdef456",name: "Wallet Nueva 2" },
            MOCK_WALLETS.rosa,
            MOCK_WALLETS.pedro,
        ],
        culturalNote: "Los tejedores novatos pueden aprender del grupo, pero requieren supervisión.",
    },
    dangerousCircle: {
        id: "dangerous",
        title: "🔴 Ayllu Peligroso",
        description: "Incluye wallets con historial de defaults y manchas en su aguayo.",
        numMembers: 5,
        cuotaAmount: 200,
        riskLevel: "high",
        expectedSuccessRate: 45,
        wallets: [
            MOCK_WALLETS.maria,
            MOCK_WALLETS.pedro,
            MOCK_WALLETS.scammer,
            MOCK_WALLETS.nuevaWallet,
            MOCK_WALLETS.rosa,
        ],
        culturalNote: "Un aguayo con muchas manchas pierde su valor ceremonial. El grupo debe reconsiderar.",
    },
    agentCircle: {
        id: "agents",
        title: "🤖 Ayllu de Agentes",
        description: "Círculo donde participan agentes AI junto con humanos.",
        numMembers: 5,
        cuotaAmount: 100,
        riskLevel: "low",
        expectedSuccessRate: 95,
        wallets: [
            MOCK_WALLETS.agentAI,
            { ...MOCK_WALLETS.agentAI,address: "0xagent2",name: "🤖 Agente Claude" },
            { ...MOCK_WALLETS.agentAI,address: "0xagent3",name: "🤖 Agente Gemini" },
            MOCK_WALLETS.maria,
            MOCK_WALLETS.juan,
        ],
        culturalNote: "Los agentes AI nunca olvidan un pago. Son tejedores incansables del ayllu digital.",
    },
};

// Helper functions
export function getWalletRiskColor(risk: WalletProfile["riskProfile"]): string {
    switch (risk) {
        case "low": return "#10b981"; // green
        case "medium": return "#eab308"; // yellow
        case "high": return "#f97316"; // orange
        case "critical": return "#ef4444"; // red
        default: return "#ffffff";
    }
}

export function getAguayoLevelEmoji(level: number): string {
    if (level >= 5) return "⭐⭐⭐⭐⭐";
    if (level >= 4) return "⭐⭐⭐⭐";
    if (level >= 3) return "⭐⭐⭐";
    if (level >= 2) return "⭐⭐";
    if (level >= 1) return "⭐";
    return "🆕";
}
