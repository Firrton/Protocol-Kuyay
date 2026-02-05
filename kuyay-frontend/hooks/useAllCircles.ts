/**
 * Hook para obtener todos los círculos públicos desde CircleFaithFactory
 * Datos 100% de blockchain - Sin mock data
 */
import { useReadContract,useReadContracts } from "wagmi";
import { MONAD_CONTRACTS } from "@/lib/contracts/addresses";
import { useState,useEffect } from "react";

// ABI mínimo para Factory
const FACTORY_ABI = [
    {
        name: "getAllCircles",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "address[]" }],
    },
    {
        name: "getCircleCount",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }],
    },
] as const;

// ABI para CircleFaith
export const CIRCLE_FAITH_ABI = [
    { name: "status",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint8" }] },
    { name: "totalGuarantees",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "totalStakedFaith",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "currentRound",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "currentPot",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "totalRounds",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "guaranteeAmount",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "cuotaAmount",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "minFaithStake",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    { name: "drawReady",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "bool" }] },
    { name: "presentCount",type: "function",stateMutability: "view",inputs: [],outputs: [{ type: "uint256" }] },
    {
        name: "members",
        type: "function",
        stateMutability: "view",
        inputs: [{ type: "uint256" }],
        outputs: [{ type: "address" }],
    },
    {
        name: "getCircleState",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [
            { type: "uint8",name: "status" },
            { type: "uint256",name: "currentRound" },
            { type: "uint256",name: "currentPot" },
            { type: "bool",name: "drawReady" },
        ],
    },
] as const;

// Tipos
export interface PublicCircle {
    address: string;
    status: number;
    statusLabel: string;
    totalGuarantees: bigint;
    totalStakedFaith: bigint;
    currentRound: number;
    currentPot: bigint;
    totalRounds: number;
    guaranteeAmount: bigint;
    cuotaAmount: bigint;
    minFaithStake: bigint;
    drawReady: boolean;
    memberCount: number;
}

// Status labels
const STATUS_LABELS: Record<number,string> = {
    0: "DEPOSIT",
    1: "ACTIVE",
    2: "COMPLETED",
    3: "CANCELLED",
};

/**
 * Hook para obtener la lista de todos los círculos
 */
export function useAllCircles() {
    const [circles,setCircles] = useState<PublicCircle[]>([]);
    const [isLoading,setIsLoading] = useState(true);

    // 1. Obtener todas las direcciones de círculos
    const { data: circleAddresses,isLoading: isLoadingAddresses,refetch } = useReadContract({
        address: MONAD_CONTRACTS.circleFaithFactory as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getAllCircles",
    });

    // 2. Para cada círculo, obtener su estado
    const contracts = circleAddresses?.map((addr) => ({
        address: addr as `0x${string}`,
        abi: CIRCLE_FAITH_ABI,
        functionName: "getCircleState",
    })) || [];

    const { data: circleStates,isLoading: isLoadingStates } = useReadContracts({
        contracts: contracts as any[],
    });

    // 3. También obtener detalles adicionales
    const detailContracts = circleAddresses?.flatMap((addr) => [
        { address: addr as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "totalGuarantees" },
        { address: addr as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "totalStakedFaith" },
        { address: addr as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "totalRounds" },
        { address: addr as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "guaranteeAmount" },
        { address: addr as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "cuotaAmount" },
        { address: addr as `0x${string}`,abi: CIRCLE_FAITH_ABI,functionName: "minFaithStake" },
    ]) || [];

    const { data: circleDetails } = useReadContracts({
        contracts: detailContracts as any[],
    });

    // Combinar datos
    useEffect(() => {
        if (!circleAddresses || circleAddresses.length === 0) {
            setCircles([]);
            setIsLoading(false);
            return;
        }

        if (circleStates && circleDetails) {
            const parsed: PublicCircle[] = circleAddresses.map((addr,i) => {
                const state = circleStates[i]?.result as [number,bigint,bigint,boolean] | undefined;
                const detailsOffset = i * 6;

                return {
                    address: addr,
                    status: state?.[0] ?? 0,
                    statusLabel: STATUS_LABELS[state?.[0] ?? 0] || "UNKNOWN",
                    currentRound: Number(state?.[1] ?? 0n),
                    currentPot: state?.[2] ?? 0n,
                    drawReady: state?.[3] ?? false,
                    totalGuarantees: (circleDetails[detailsOffset]?.result as bigint) ?? 0n,
                    totalStakedFaith: (circleDetails[detailsOffset + 1]?.result as bigint) ?? 0n,
                    totalRounds: Number((circleDetails[detailsOffset + 2]?.result as bigint) ?? 0n),
                    guaranteeAmount: (circleDetails[detailsOffset + 3]?.result as bigint) ?? 0n,
                    cuotaAmount: (circleDetails[detailsOffset + 4]?.result as bigint) ?? 0n,
                    minFaithStake: (circleDetails[detailsOffset + 5]?.result as bigint) ?? 0n,
                    memberCount: Number((circleDetails[detailsOffset]?.result as bigint) ?? 0n) /
                        Number((circleDetails[detailsOffset + 3]?.result as bigint) || 1n),
                };
            });

            setCircles(parsed);
            setIsLoading(false);
        }
    },[circleAddresses,circleStates,circleDetails]);

    return {
        circles,
        isLoading: isLoading || isLoadingAddresses || isLoadingStates,
        refetch,
        circleCount: circleAddresses?.length ?? 0,
    };
}

/**
 * Hook para el leaderboard de los fieles
 * Basado en participación en círculos
 */
export interface FaithfulMember {
    address: string;
    faithStaked: bigint;
    rank: number;
    role: string;
    emoji: string;
}

// Roles religiosos basados en Fe
export const FAITH_ROLES = [
    { min: 1000,role: "Amawta Supremo",emoji: "👑" },
    { min: 500,role: "Sacerdote Mayor",emoji: "🌟" },
    { min: 100,role: "Sacerdote",emoji: "⭐" },
    { min: 50,role: "Fiel Devoto",emoji: "🙏" },
    { min: 20,role: "Creyente",emoji: "✨" },
    { min: 10,role: "Iniciado",emoji: "🌱" },
    { min: 0,role: "Catecúmeno",emoji: "🕯️" },
];

export function getFaithRole(faithAmount: bigint): { role: string; emoji: string } {
    const faithInTokens = Number(faithAmount / BigInt(1e18));
    for (const tier of FAITH_ROLES) {
        if (faithInTokens >= tier.min) {
            return { role: tier.role,emoji: tier.emoji };
        }
    }
    return { role: "Catecúmeno",emoji: "🕯️" };
}
