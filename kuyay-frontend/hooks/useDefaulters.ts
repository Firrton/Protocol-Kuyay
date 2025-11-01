"use client";

import { useState, useEffect } from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { CONTRACTS, CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";
import { AGUAYO_SBT_ABI, type AguayoMetadata } from "@/lib/contracts/abis";

export interface Defaulter {
  address: string;
  tokenId: number;
  aguayoLevel: number;
  stains: number;
  totalDefaults: number;
  lastDefaultDate: Date;
  amountOwed: number;
  status: "UNPAID" | "LIQUIDATED" | "PARTIALLY_PAID";
  circleName: string;
}

/**
 * Hook para obtener la lista de deudores (Aguayos con stains > 0)
 * Usa eventos StainAdded del contrato AguayoSBT para construir la lista
 */
export function useDefaulters() {
  const publicClient = usePublicClient();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Función para obtener metadata de un Aguayo
  const getAguayoMetadata = async (tokenId: bigint): Promise<AguayoMetadata | null> => {
    if (!publicClient || !CONTRACTS_DEPLOYED.aguayoSBT) return null;

    try {
      const metadata = await publicClient.readContract({
        address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
        abi: AGUAYO_SBT_ABI,
        functionName: "getAguayoMetadata",
        args: [tokenId],
      });

      return {
        level: Number(metadata.level),
        totalThreads: Number(metadata.totalThreads),
        completedCircles: Number(metadata.completedCircles),
        stains: Number(metadata.stains),
        lastActivityTimestamp: BigInt(metadata.lastActivityTimestamp),
        isStained: metadata.isStained,
      };
    } catch (err) {
      console.error(`Error obteniendo metadata para tokenId ${tokenId}:`, err);
      return null;
    }
  };

  // Función para obtener owner de un Aguayo
  const getAguayoOwner = async (tokenId: bigint): Promise<string | null> => {
    if (!publicClient || !CONTRACTS_DEPLOYED.aguayoSBT) return null;

    try {
      const owner = await publicClient.readContract({
        address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
        abi: AGUAYO_SBT_ABI,
        functionName: "ownerOf",
        args: [tokenId],
      });

      return owner as string;
    } catch (err) {
      console.error(`Error obteniendo owner para tokenId ${tokenId}:`, err);
      return null;
    }
  };

  // Función para construir lista de deudores desde eventos
  const buildDefaultersList = async () => {
    if (!publicClient || !CONTRACTS_DEPLOYED.aguayoSBT) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Obtener eventos StainAdded históricos
      const logs = await publicClient.getLogs({
        address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
        event: {
          type: "event",
          name: "StainAdded",
          inputs: [
            { indexed: true, type: "uint256", name: "tokenId" },
            { indexed: true, type: "address", name: "owner" },
            { indexed: false, type: "uint16", name: "newStainCount" },
          ],
        },
        fromBlock: "earliest",
        toBlock: "latest",
      });

      // Agrupar eventos por tokenId para obtener el último evento de cada Aguayo
      const tokenIdMap = new Map<bigint, typeof logs[0]>();

      for (const log of logs) {
        const tokenId = log.args.tokenId!;
        const existing = tokenIdMap.get(tokenId);

        // Guardar solo el evento más reciente por tokenId
        if (!existing || (log.blockNumber && existing.blockNumber && log.blockNumber > existing.blockNumber)) {
          tokenIdMap.set(tokenId, log);
        }
      }

      // Construir lista de deudores
      const defaultersList: Defaulter[] = [];

      for (const [tokenId, log] of tokenIdMap.entries()) {
        // Obtener metadata actual del Aguayo
        const metadata = await getAguayoMetadata(tokenId);

        // Solo incluir si tiene stains > 0 actualmente
        if (metadata && metadata.stains > 0) {
          const owner = await getAguayoOwner(tokenId);

          if (owner) {
            // Obtener timestamp del bloque para lastDefaultDate
            const block = log.blockNumber ? await publicClient.getBlock({ blockNumber: log.blockNumber }) : null;
            const lastDefaultDate = block ? new Date(Number(block.timestamp) * 1000) : new Date();

            // Determinar estado basado en stains
            let status: "UNPAID" | "LIQUIDATED" | "PARTIALLY_PAID" = "UNPAID";
            if (metadata.stains >= 3) {
              status = "LIQUIDATED";
            } else if (metadata.stains === 1) {
              status = "PARTIALLY_PAID";
            }

            defaultersList.push({
              address: `${owner.slice(0, 6)}...${owner.slice(-4)}`,
              tokenId: Number(tokenId),
              aguayoLevel: metadata.level,
              stains: metadata.stains,
              totalDefaults: metadata.stains, // En este contexto, stains = defaults
              lastDefaultDate,
              amountOwed: metadata.stains * 300, // Estimación: $300 por default
              status,
              circleName: "Círculo Desconocido", // TODO: Obtener de Circle contract si está disponible
            });
          }
        }
      }

      // Ordenar por número de stains (descendente)
      defaultersList.sort((a, b) => b.stains - a.stains);

      setDefaulters(defaultersList);
    } catch (err) {
      console.error("Error construyendo lista de deudores:", err);
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar lista inicial al montar
  useEffect(() => {
    buildDefaultersList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient]);

  // Escuchar nuevos eventos StainAdded en tiempo real
  useWatchContractEvent({
    address: CONTRACTS.arbitrumSepolia.aguayoSBT as `0x${string}`,
    abi: AGUAYO_SBT_ABI,
    eventName: "StainAdded",
    onLogs: () => {
      // Cuando se agrega una nueva mancha, refetch toda la lista
      console.log("Nuevo evento StainAdded detectado, actualizando lista...");
      buildDefaultersList();
    },
    enabled: CONTRACTS_DEPLOYED.aguayoSBT,
  });

  return {
    defaulters,
    isLoading,
    error,
    refetch: buildDefaultersList,
    isContractDeployed: CONTRACTS_DEPLOYED.aguayoSBT,
  };
}
