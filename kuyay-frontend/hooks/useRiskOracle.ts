import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { RISK_ORACLE_ABI } from "@/lib/contracts/abis";
import type { LeverageTier } from "@/lib/contracts/abis";

/**
 * Hook para Risk Oracle (Stylus contract)
 *
 * Evalúa riesgo de circles basado en niveles de Aguayo SBT
 * y calcula leverage permitido + tasas de interés
 */

/**
 * Hook para verificar elegibilidad de un miembro
 */
export function useMemberEligibility(
  memberAddress: string | undefined,
  isCreditMode: boolean = false
) {
  const { data: isEligible, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "isMemberEligible",
    args: [memberAddress as `0x${string}`, isCreditMode],
    query: {
      enabled: !!memberAddress,
    },
  });

  return {
    isEligible: isEligible ?? false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para verificar si TODOS los miembros son elegibles
 */
export function useAllMembersEligibility(memberAddresses: string[]) {
  const { data: allEligible, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "areAllMembersEligible",
    args: [memberAddresses as `0x${string}`[]],
    query: {
      enabled: memberAddresses.length > 0,
    },
  });

  return {
    allEligible: allEligible ?? false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para obtener nivel de leverage para un grupo
 *
 * Retorna el multiplicador y la tasa de interés basado en
 * los niveles promedio del grupo
 */
export function useLeverageLevel(memberAddresses: string[]) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "getLeverageLevel",
    args: [memberAddresses as `0x${string}`[]],
    query: {
      enabled: memberAddresses.length > 0,
    },
  });

  // Procesar resultados
  const result = data ? {
    multiplier: data[0],
    multiplierX: Number(data[0]) / 100, // Convertir 200 -> 2x
    interestRate: data[1],
    apr: Number(data[1]) / 100, // Convertir 1500 bps -> 15%
  } : null;

  return {
    leverage: result,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para obtener estadísticas del grupo
 */
export function useGroupStats(memberAddresses: string[]) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "getGroupStats",
    args: [memberAddresses as `0x${string}`[]],
    query: {
      enabled: memberAddresses.length > 0,
    },
  });

  const stats = data ? {
    averageLevel: Number(data[0]),
    totalStains: Number(data[1]),
    stainsPerMember: Number(data[1]) / memberAddresses.length,
  } : null;

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para obtener tier basado en nivel promedio
 */
export function useTierForLevel(averageLevel: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "getTierForAverageLevel",
    args: [averageLevel as any],
    query: {
      enabled: averageLevel > 0,
    },
  });

  const tier = data ? {
    multiplier: data[0],
    multiplierX: Number(data[0]) / 100,
    interestRate: data[1],
    apr: Number(data[1]) / 100,
  } : null;

  return {
    tier,
    isLoading,
    error,
  };
}

/**
 * Hook para obtener información de todos los tiers
 */
export function useAllTiers() {
  const { data: tierCount } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "getLeverageTierCount",
  });

  const count = tierCount ? Number(tierCount) : 0;

  // Para cada tier, obtener su información
  // Nota: En producción, esto debería optimizarse con multicall
  const tiers: LeverageTier[] = [];

  return {
    tierCount: count,
    tiers, // TODO: Implementar multicall para obtener todos los tiers eficientemente
  };
}

/**
 * Hook para obtener configuración del RiskOracle
 */
export function useRiskOracleConfig() {
  const { data: owner } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "owner",
  });

  const { data: aguayoSbt } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "aguayoSbt",
  });

  const { data: minLevelForCredit } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "minLevelForCredit",
  });

  const { data: maxLeverageMultiplier } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "maxLeverageMultiplier",
  });

  const { data: baseInterestRate } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "baseInterestRateBps",
  });

  const { data: riskPremium } = useReadContract({
    address: CONTRACTS.monadMainnet.riskOracle as `0x${string}`,
    abi: RISK_ORACLE_ABI,
    functionName: "riskPremiumPerStainBps",
  });

  return {
    owner,
    aguayoSbt,
    minLevelForCredit: minLevelForCredit ? Number(minLevelForCredit) : 0,
    maxLeverageMultiplier: maxLeverageMultiplier ? Number(maxLeverageMultiplier) : 0,
    maxLeverageX: maxLeverageMultiplier ? Number(maxLeverageMultiplier) / 100 : 0,
    baseInterestRate: baseInterestRate ? Number(baseInterestRate) : 0,
    baseAPR: baseInterestRate ? Number(baseInterestRate) / 100 : 0,
    riskPremium: riskPremium ? Number(riskPremium) : 0,
    riskPremiumPercent: riskPremium ? Number(riskPremium) / 100 : 0,
  };
}

/**
 * Hook combinado para evaluación completa de un circle
 *
 * Combina elegibilidad, leverage, y estadísticas en un solo hook
 */
export function useCircleRiskEvaluation(memberAddresses: string[]) {
  const { allEligible, isLoading: eligibilityLoading } = useAllMembersEligibility(memberAddresses);
  const { leverage, isLoading: leverageLoading } = useLeverageLevel(memberAddresses);
  const { stats, isLoading: statsLoading } = useGroupStats(memberAddresses);

  const isLoading = eligibilityLoading || leverageLoading || statsLoading;

  // Calcular score de riesgo (0-100, menor es mejor)
  const riskScore = stats ? calculateRiskScore(stats.averageLevel, stats.totalStains) : null;

  return {
    allEligible,
    leverage,
    stats,
    riskScore,
    isLoading,
    isReady: !isLoading && allEligible && !!leverage && !!stats,
  };
}

/**
 * Helper para calcular score de riesgo
 */
function calculateRiskScore(averageLevel: number, totalStains: number): number {
  // Nivel más alto = menos riesgo
  // Más manchas = más riesgo

  const levelScore = (5 - averageLevel) * 10; // 0-50 puntos
  const stainScore = Math.min(totalStains * 10, 50); // 0-50 puntos

  return levelScore + stainScore; // 0-100 (0 = sin riesgo, 100 = muy riesgoso)
}

/**
 * Helper para interpretar score de riesgo
 */
export function interpretRiskScore(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score <= 20) {
    return {
      label: "Riesgo Bajo",
      color: "green",
      description: "Grupo de alta calidad con bajo riesgo",
    };
  } else if (score <= 40) {
    return {
      label: "Riesgo Moderado",
      color: "blue",
      description: "Grupo con perfil de riesgo aceptable",
    };
  } else if (score <= 60) {
    return {
      label: "Riesgo Medio",
      color: "yellow",
      description: "Grupo con algunos factores de riesgo",
    };
  } else if (score <= 80) {
    return {
      label: "Riesgo Alto",
      color: "orange",
      description: "Grupo con múltiples factores de riesgo",
    };
  } else {
    return {
      label: "Riesgo Muy Alto",
      color: "red",
      description: "Grupo con perfil de riesgo inaceptable",
    };
  }
}
