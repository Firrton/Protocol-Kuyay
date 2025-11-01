import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { CIRCLE_SIMULATOR_ABI } from "@/lib/contracts/abis";
import { parseUnits, formatUnits } from "viem";
import type { SimulationResult } from "@/lib/contracts/abis";

/**
 * Hook para simulación Monte Carlo de circles
 *
 * NOTA: Este contrato usa Stylus (Rust/WASM) para hacer simulaciones
 * imposibles en Solidity puro. Ahorra ~97% de gas vs Solidity.
 */

/**
 * Hook para obtener información del simulador
 */
export function useSimulatorInfo() {
  const { data: owner } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.circleSimulator as `0x${string}`,
    abi: CIRCLE_SIMULATOR_ABI,
    functionName: "owner",
  });

  const { data: simulationCount } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.circleSimulator as `0x${string}`,
    abi: CIRCLE_SIMULATOR_ABI,
    functionName: "simulationCount",
  });

  const { data: lastGasUsed } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.circleSimulator as `0x${string}`,
    abi: CIRCLE_SIMULATOR_ABI,
    functionName: "lastGasUsed",
  });

  return {
    owner,
    simulationCount: simulationCount ? Number(simulationCount) : 0,
    lastGasUsed: lastGasUsed ? Number(lastGasUsed) : 0,
  };
}

/**
 * Hook para simulación rápida (solo vista, no gasta gas)
 *
 * Útil para previews en UI antes de crear un circle
 */
export function useQuickSimulate(
  numMembers: number,
  cuotaAmount: string, // En formato humano (ej: "100")
  defaultProbability: number // 0-10000 (0-100%)
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.circleSimulator as `0x${string}`,
    abi: CIRCLE_SIMULATOR_ABI,
    functionName: "quickSimulate",
    args: [
      numMembers as any,
      parseUnits(cuotaAmount, 6), // Asumiendo USDC (6 decimales)
      defaultProbability as any,
    ],
    query: {
      enabled: numMembers > 0 && Number(cuotaAmount) > 0,
    },
  });

  // Procesar resultados
  const result = data ? {
    successRate: Number(data[0]) / 100, // Convertir de 0-10000 a 0-100
    expectedReturn: data[1],
    expectedReturnFormatted: formatUnits(data[1], 6),
  } : null;

  return {
    result,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para simulación completa (transacción, gasta gas)
 *
 * Ejecuta múltiples iteraciones Monte Carlo y retorna estadísticas completas
 */
export function useFullSimulation() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } =
    useWaitForTransactionReceipt({
      hash,
    });

  const simulateCircle = async (
    numMembers: number,
    cuotaAmount: string,
    numRounds: number = 12,
    avgDefaultProb: number = 1500, // 15% default
    numSimulations: number = 1000
  ) => {
    try {
      writeContract({
        address: CONTRACTS.arbitrumSepolia.circleSimulator as `0x${string}`,
        abi: CIRCLE_SIMULATOR_ABI,
        functionName: "simulateCircle",
        args: [
          numMembers as any,
          parseUnits(cuotaAmount, 6),
          numRounds as any,
          avgDefaultProb as any,
          numSimulations as any,
        ],
      });
    } catch (err) {
      console.error("Error running full simulation:", err);
      throw err;
    }
  };

  // Parsear resultados de los logs si están disponibles
  const parseResults = (): SimulationResult | null => {
    if (!receipt || !receipt.logs) return null;

    // Los resultados vienen en el return value de la transacción
    // Pero como es una transacción, no tenemos acceso directo al return
    // Necesitarías leer los eventos o hacer un call estático después

    return null;
  };

  return {
    simulateCircle,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    results: parseResults(),
  };
}

/**
 * Helper para calcular probabilidad de default basada en niveles de Aguayo
 *
 * Esto es un estimado simple, el RiskOracle tiene cálculos más sofisticados
 */
export function estimateDefaultProbability(averageLevel: number): number {
  // Nivel 1: 20% default
  // Nivel 3: 10% default
  // Nivel 5: 5% default

  if (averageLevel >= 5) return 500;  // 5%
  if (averageLevel >= 3) return 1000; // 10%
  if (averageLevel >= 2) return 1500; // 15%
  return 2000; // 20%
}

/**
 * Helper para interpretar tasa de éxito
 */
export function interpretSuccessRate(rate: number): {
  label: string;
  color: string;
  recommendation: string;
} {
  if (rate >= 90) {
    return {
      label: "Excelente",
      color: "green",
      recommendation: "Este círculo tiene muy baja probabilidad de fallar",
    };
  } else if (rate >= 75) {
    return {
      label: "Bueno",
      color: "blue",
      recommendation: "Este círculo tiene riesgo moderado-bajo",
    };
  } else if (rate >= 50) {
    return {
      label: "Moderado",
      color: "yellow",
      recommendation: "Este círculo tiene riesgo medio, considera mejores miembros",
    };
  } else if (rate >= 25) {
    return {
      label: "Riesgoso",
      color: "orange",
      recommendation: "Este círculo tiene alto riesgo de fallar",
    };
  } else {
    return {
      label: "Muy Riesgoso",
      color: "red",
      recommendation: "NO recomendado - probabilidad muy alta de fallo catastrófico",
    };
  }
}
