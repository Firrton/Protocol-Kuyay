"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, useReadContract } from "wagmi";
import { CIRCLE_ABI } from "@/lib/contracts/abis";

/**
 * Hook para manejar la ceremonia del sorteo (Pasanaku)
 * Integra con Chainlink VRF para selección aleatoria verificable
 */
export function useDrawCeremony(circleAddress: `0x${string}`) {
  const { address } = useAccount();
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Check-in (marcar presencia)
  const {
    writeContract: writeCheckIn,
    data: checkInHash,
    isPending: isCheckingIn,
    error: checkInError,
  } = useWriteContract();

  const { isSuccess: checkInConfirmed } = useWaitForTransactionReceipt({
    hash: checkInHash,
  });

  // Iniciar sorteo
  const {
    writeContract: writeStartDraw,
    data: drawHash,
    isPending: isStartingDraw,
    error: drawError,
  } = useWriteContract();

  const { isSuccess: drawStarted } = useWaitForTransactionReceipt({
    hash: drawHash,
  });

  // Leer si usuario está presente
  const { data: userIsPresent, refetch: refetchPresence } = useReadContract({
    address: circleAddress,
    abi: CIRCLE_ABI,
    functionName: "isMemberPresent",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Leer miembros presentes
  const { data: presentMembers, refetch: refetchPresentMembers } = useReadContract({
    address: circleAddress,
    abi: CIRCLE_ABI,
    functionName: "getPresentMembers",
  });

  // Leer si puede iniciar sorteo
  const { data: canStartDrawData, refetch: refetchCanStart } = useReadContract({
    address: circleAddress,
    abi: CIRCLE_ABI,
    functionName: "canStartDraw",
  });

  // Solo escuchar evento WinnerSelected para reducir llamadas RPC
  // Los demás se pueden actualizar con refetch manual
  useWatchContractEvent({
    address: circleAddress,
    abi: CIRCLE_ABI,
    eventName: "WinnerSelected",
    onLogs: (logs) => {
      const winnerAddress = logs[0].args.winner as string;
      const amount = logs[0].args.amount;
      console.log("¡Ganador seleccionado!", { winner: winnerAddress, amount });
      setWinner(winnerAddress);
      setIsDrawing(false);
      // Actualizar todo después de que hay ganador
      refetchPresentMembers();
      refetchCanStart();
      refetchPresence();
    },
    // Configurar para reducir polling
    poll: true,
    pollingInterval: 5000, // Solo cada 5 segundos
  });

  // Refetch presencia cuando se confirma check-in
  useEffect(() => {
    if (checkInConfirmed) {
      refetchPresence();
      refetchPresentMembers();
      refetchCanStart();
    }
  }, [checkInConfirmed, refetchPresence, refetchPresentMembers, refetchCanStart]);

  // Función para hacer check-in
  const checkIn = async () => {
    try {
      writeCheckIn({
        address: circleAddress,
        abi: CIRCLE_ABI,
        functionName: "checkIn",
      });
    } catch (err) {
      console.error("Error en check-in:", err);
      throw err;
    }
  };

  // Función para iniciar sorteo
  const startDraw = async () => {
    try {
      writeStartDraw({
        address: circleAddress,
        abi: CIRCLE_ABI,
        functionName: "startDraw",
      });
    } catch (err) {
      console.error("Error iniciando sorteo:", err);
      throw err;
    }
  };

  return {
    // Funciones
    checkIn,
    startDraw,

    // Estados
    isCheckingIn,
    checkInConfirmed,
    isStartingDraw,
    drawStarted,
    isDrawing,
    winner,

    // Datos
    userIsPresent: userIsPresent as boolean | undefined,
    presentMembers: (presentMembers as string[]) || [],
    canStartDraw: canStartDrawData as boolean | undefined,

    // Errores
    checkInError,
    drawError,

    // Refetch
    refetchPresence,
    refetchPresentMembers,
    refetchCanStart,
  };
}

/**
 * Hook para obtener el ganador de una ronda específica
 */
export function useRoundWinner(circleAddress: `0x${string}`, round: number) {
  const { data: winner, isLoading } = useReadContract({
    address: circleAddress,
    abi: CIRCLE_ABI,
    functionName: "getRoundWinner",
    args: [BigInt(round)],
  });

  return {
    winner: winner as string | undefined,
    isLoading,
  };
}
