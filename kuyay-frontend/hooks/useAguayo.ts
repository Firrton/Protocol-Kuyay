import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";
import { AGUAYO_SBT_ABI, type AguayoMetadata } from "@/lib/contracts/abis";

/**
 * Hook para verificar si el usuario tiene un Aguayo
 */
export function useHasAguayo() {
  const { address } = useAccount();

  const { data: hasAguayo, isLoading, refetch } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
    abi: AGUAYO_SBT_ABI,
    functionName: "hasAguayo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS_DEPLOYED.aguayoSBT, // Solo ejecutar si hay address Y contrato desplegado
    },
  });

  return {
    hasAguayo: hasAguayo ?? false,
    isLoading: CONTRACTS_DEPLOYED.aguayoSBT ? isLoading : false, // Si no hay contrato, no está cargando
    refetch,
    isContractDeployed: CONTRACTS_DEPLOYED.aguayoSBT,
  };
}

/**
 * Hook para obtener el tokenId del Aguayo del usuario
 */
export function useAguayoTokenId() {
  const { address } = useAccount();
  const { hasAguayo } = useHasAguayo();

  const { data: tokenId, isLoading } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
    abi: AGUAYO_SBT_ABI,
    functionName: "getAguayoByUser",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && hasAguayo && CONTRACTS_DEPLOYED.aguayoSBT,
    },
  });

  return {
    tokenId: tokenId ? Number(tokenId) : undefined,
    isLoading: CONTRACTS_DEPLOYED.aguayoSBT ? isLoading : false,
  };
}

/**
 * Hook para obtener la metadata completa del Aguayo
 */
export function useAguayoMetadata() {
  const { tokenId } = useAguayoTokenId();

  const { data: metadata, isLoading, refetch } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
    abi: AGUAYO_SBT_ABI,
    functionName: "getAguayoMetadata",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId && CONTRACTS_DEPLOYED.aguayoSBT,
    },
  });

  // Convertir valores a tipos correctos para UI
  const normalizedMetadata: AguayoMetadata | undefined = metadata
    ? {
        level: Number(metadata.level),
        totalThreads: Number(metadata.totalThreads),
        completedCircles: Number(metadata.completedCircles),
        stains: Number(metadata.stains),
        lastActivityTimestamp: BigInt(metadata.lastActivityTimestamp),
        isStained: metadata.isStained,
      }
    : undefined;

  return {
    metadata: normalizedMetadata,
    isLoading: CONTRACTS_DEPLOYED.aguayoSBT ? isLoading : false,
    refetch,
  };
}

/**
 * Hook para mintear un Aguayo
 */
export function useMintAguayo() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const mintAguayo = async () => {
    try {
      writeContract({
        address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
        abi: AGUAYO_SBT_ABI,
        functionName: "mintAguayo",
      });
    } catch (err) {
      console.error("Error minting Aguayo:", err);
      throw err;
    }
  };

  return {
    mintAguayo,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

/**
 * Hook para verificar si el Aguayo es elegible para crédito
 */
export function useIsEligibleForCredit() {
  const { tokenId } = useAguayoTokenId();

  const { data: isEligible, isLoading } = useReadContract({
    address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
    abi: AGUAYO_SBT_ABI,
    functionName: "isEligibleForCredit",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId && CONTRACTS_DEPLOYED.aguayoSBT,
    },
  });

  return {
    isEligible: isEligible ?? false,
    isLoading: CONTRACTS_DEPLOYED.aguayoSBT ? isLoading : false,
  };
}
