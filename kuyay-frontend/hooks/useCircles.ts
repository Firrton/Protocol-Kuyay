import { useAccount,useReadContract,useWriteContract,useWaitForTransactionReceipt,useReadContracts } from "wagmi";
import { CONTRACTS,CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";
import { parseUnits } from "viem";
import { useState,useEffect,useCallback } from "react";
import { ERC20_ABI,CIRCLE_ABI,CIRCLE_FACTORY_ABI } from "@/lib/contracts/abis";

/**
 * Hook para crear un círculo de ahorro
 */
export function useCreateSavingsCircle() {
  const { address: userAddress } = useAccount();
  const { writeContract,data: hash,isPending,error } = useWriteContract();

  const { isLoading: isConfirming,isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const createSavingsCircle = async (
    cuotaAmount: number,
    guaranteeAmount: number,
    invitedAddresses: string[]
  ) => {
    if (!CONTRACTS_DEPLOYED.circleFactory) {
      throw new Error("CircleFactory contract not deployed yet");
    }

    if (!userAddress) {
      throw new Error("Connect your wallet first");
    }

    // Array de miembros = [usuario actual, ...direcciones invitadas]
    const members: `0x${string}`[] = [userAddress,...invitedAddresses as `0x${string}`[]];

    try {
      writeContract({
        address: CONTRACTS.monadMainnet.circleFactory as `0x${string}`,
        abi: CIRCLE_FACTORY_ABI,
        functionName: "createSavingsCircle",
        args: [
          members,
          parseUnits(guaranteeAmount.toString(),6),
          parseUnits(cuotaAmount.toString(),6)
        ]
      });
    } catch (err) {
      console.error("Error creating savings circle:",err);
      throw err;
    }
  };

  return {
    createSavingsCircle,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

/**
 * Hook para crear un círculo de crédito
 */
export function useCreateCreditCircle() {
  const { address: userAddress } = useAccount();
  const { writeContract,data: hash,isPending,error } = useWriteContract();

  const { isLoading: isConfirming,isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const createCreditCircle = async (
    cuotaAmount: number,
    guaranteeAmount: number,
    invitedAddresses: string[]
  ) => {
    if (!CONTRACTS_DEPLOYED.circleFactory) {
      throw new Error("CircleFactory contract not deployed yet");
    }

    if (!userAddress) {
      throw new Error("Connect your wallet first");
    }

    // Array de miembros = [usuario actual, ...direcciones invitadas]
    const members: `0x${string}`[] = [userAddress,...invitedAddresses as `0x${string}`[]];

    try {
      writeContract({
        address: CONTRACTS.monadMainnet.circleFactory as `0x${string}`,
        abi: CIRCLE_FACTORY_ABI,
        functionName: "createCreditCircle",
        args: [
          members,
          parseUnits(guaranteeAmount.toString(),6),
          parseUnits(cuotaAmount.toString(),6)
        ]
      });
    } catch (err) {
      console.error("Error creating credit circle:",err);
      throw err;
    }
  };

  return {
    createCreditCircle,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

/**
 * Hook para obtener los círculos de un usuario
 * TODO: Implementar cuando el contrato esté disponible
 */
export function useUserCircles() {
  const { address } = useAccount();

  const { data: circles,isLoading,refetch } = useReadContract({
    address: CONTRACTS.monadMainnet.circleFactory as `0x${string}`,
    abi: CIRCLE_FACTORY_ABI,
    functionName: "getUserCircles",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  return {
    circles: circles || [],
    isLoading: CONTRACTS_DEPLOYED.circleFactory ? isLoading : false,
    refetch,
  };
}

/**
 * Hook para obtener los círculos del usuario CON todos sus detalles
 * Combina getUserCircles + detalles de cada círculo
 */
export function useUserCirclesWithDetails() {
  const { address } = useAccount();

  // Primero obtener las direcciones de los círculos
  const { data: circleAddresses,isLoading: isLoadingAddresses,refetch } = useReadContract({
    address: CONTRACTS.monadMainnet.circleFactory as `0x${string}`,
    abi: CIRCLE_FACTORY_ABI,
    functionName: "getUserCircles",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  const addresses = (circleAddresses as string[]) || [];

  // Necesitamos saber la ronda actual primero para verificar hasPaidRound
  // Pero como getCircleState ya nos da la ronda, lo manejamos después

  // Crear array de contratos a llamar para obtener todos los detalles
  const contracts = addresses.flatMap((circleAddress) => [
    {
      address: circleAddress as `0x${string}`,
      abi: CIRCLE_ABI,
      functionName: "getCircleState",
    },
    {
      address: circleAddress as `0x${string}`,
      abi: CIRCLE_ABI,
      functionName: "cuotaAmount",
    },
    {
      address: circleAddress as `0x${string}`,
      abi: CIRCLE_ABI,
      functionName: "guaranteeAmount",
    },
    {
      address: circleAddress as `0x${string}`,
      abi: CIRCLE_ABI,
      functionName: "totalRounds",
    },
    {
      address: circleAddress as `0x${string}`,
      abi: CIRCLE_ABI,
      functionName: "getMembers",
    },
  ]);

  // Obtener todos los datos en paralelo
  const { data: contractsData,isLoading: isLoadingDetails } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: addresses.length > 0 && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  // Cast to a simpler type immediately to help TypeScript
  const processedData = (contractsData as any[]) || [];

  // Procesar los datos y crear el array de círculos con detalles
  const circlesWithDetails = addresses.map((circleAddress,index) => {
    const baseIndex = index * 5; // 5 llamadas por círculo

    if (processedData.length < baseIndex + 5) {
      return null;
    }

    const circleState = processedData[baseIndex]?.result as [number,number,bigint,bigint] | undefined;
    const cuotaAmount = processedData[baseIndex + 1]?.result as bigint | undefined;
    const guaranteeAmount = processedData[baseIndex + 2]?.result as bigint | undefined;
    const totalRounds = processedData[baseIndex + 3]?.result as bigint | undefined;
    const members = processedData[baseIndex + 4]?.result as string[] | undefined;

    if (!circleState || !cuotaAmount || !guaranteeAmount || !totalRounds || !members) {
      return null;
    }

    const [mode,status,round,pot] = circleState;

    return {
      name: `Círculo ${index + 1}`, // Puedes mejorar esto obteniendo el nombre del contrato si existe
      address: circleAddress,
      mode: mode === 0 ? "SAVINGS" as const : "CREDIT" as const,
      status: status === 0 ? "DEPOSIT" as const : status === 1 ? "ACTIVE" as const : "COMPLETED" as const,
      currentRound: Number(round),
      totalRounds: Number(totalRounds),
      memberCount: members.length,
      cuotaAmount: Number(cuotaAmount) / 1e6, // Convertir de 6 decimales USDC
      guaranteeAmount: Number(guaranteeAmount) / 1e6,
      currentPot: Number(pot) / 1e6,
      nextPaymentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Por ahora 7 días (puedes mejorarlo)
      hasUserPaid: false, // Se actualiza con un hook separado useHasUserPaid
      leverage: mode === 1 ? "2.5x" : undefined, // TODO: obtener del contrato si está disponible
      protocolLoan: mode === 1 ? Number(cuotaAmount) * members.length * 2.5 / 1e6 : undefined, // Calculado para CREDIT mode
      members: members.map((addr) => ({
        address: addr,
        hasPaid: false, // TODO: implementar
        aguayoLevel: 1, // TODO: obtener del contrato Aguayo
      })),
    };
  }).filter((circle) => circle !== null);

  return {
    circles: circlesWithDetails,
    isLoading: isLoadingAddresses || isLoadingDetails,
    refetch,
  };
}

/**
 * Hook para verificar cuántos miembros han pagado en la ronda actual
 */
export function useRoundPaymentStatus(circleAddress: string,currentRound: number,members: string[]) {
  // Obtener estado de pago de cada miembro
  const contracts = members.map((member) => ({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "hasPaidRound",
    args: [member as `0x${string}`,BigInt(currentRound)],
  }));

  const { data,isLoading,refetch } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!circleAddress && members.length > 0 && CONTRACTS_DEPLOYED.circleFactory,
      // Deshabilitar cache para forzar actualización
      gcTime: 0,
      staleTime: 0,
    },
  });

  // Explicitly cast to avoid TypeScript deep instantiation issues
  const resultsArray = (data as any[]) || [];
  const paidMembers = resultsArray.filter((result: any) => result.result === true).length;
  const allPaid = paidMembers === members.length && members.length > 0;

  console.log("💰 Payment Status:",{
    paidMembers,
    totalMembers: members.length,
    allPaid,
    data: resultsArray.map((r: any) => r.result)
  });

  return {
    paidMembers,
    totalMembers: members.length,
    allPaid,
    isLoading,
    refetch,
  };
}

/**
 * Hook para obtener detalles de un círculo específico
 * Obtiene toda la información del círculo usando múltiples llamadas al contrato
 */
export function useCircleDetails(circleAddress: string | undefined) {
  // Obtener el estado del círculo (mode, status, round, pot)
  const { data: circleState } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "getCircleState",
    query: {
      enabled: !!circleAddress && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  // Obtener cuota mensual
  const { data: cuotaAmount } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "cuotaAmount",
    query: {
      enabled: !!circleAddress && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  // Obtener garantía
  const { data: guaranteeAmount } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "guaranteeAmount",
    query: {
      enabled: !!circleAddress && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  // Obtener total de rondas
  const { data: totalRounds } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "totalRounds",
    query: {
      enabled: !!circleAddress && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  // Obtener miembros
  const { data: members } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "getMembers",
    query: {
      enabled: !!circleAddress && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  if (!circleState || !cuotaAmount || !guaranteeAmount || !totalRounds || !members) {
    return {
      details: undefined,
      isLoading: true,
    };
  }

  // Mapear los datos del contrato al formato esperado
  const [mode,status,round,pot] = circleState as [number,number,bigint,bigint];

  const details = {
    address: circleAddress || "",
    mode: mode === 0 ? "SAVINGS" : "CREDIT",
    status: status === 0 ? "DEPOSIT" : status === 1 ? "ACTIVE" : "COMPLETED",
    currentRound: Number(round),
    totalRounds: Number(totalRounds),
    memberCount: (members as string[]).length,
    cuotaAmount: Number(cuotaAmount) / 1e6, // Convertir de 6 decimales USDC
    guaranteeAmount: Number(guaranteeAmount) / 1e6,
    currentPot: Number(pot) / 1e6,
    members: members as string[],
  };

  return {
    details,
    isLoading: false,
  };
}

/**
 * Hook para hacer un pago en un círculo
 * Maneja el flujo completo: aprobar USDC → hacer pago
 */
export function useMakePayment() {
  const { address } = useAccount();
  const { writeContract,data: hash,isPending,error,reset } = useWriteContract();
  const [paymentStep,setPaymentStep] = useState<"idle" | "approving" | "paying">("idle");
  const [pendingPayment,setPendingPayment] = useState<{ circleAddress: string; amount: bigint } | null>(null);
  const [approvalHash,setApprovalHash] = useState<string | undefined>(undefined);
  const [paymentHash,setPaymentHash] = useState<string | undefined>(undefined);

  const { isLoading: isConfirming,isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const executePayment = useCallback(async (circleAddress: string) => {
    if (!CONTRACTS_DEPLOYED.circleFactory) {
      throw new Error("Contracts not deployed yet");
    }

    try {
      console.log("💰 Executing payment to:",circleAddress);
      setPaymentStep("paying");

      writeContract({
        address: circleAddress as `0x${string}`,
        abi: CIRCLE_ABI,
        functionName: "makeRoundPayment",
        gas: 800000n, // ⬆️ Gas aumentado para makeRoundPayment + updateAguayo + posible VRF
      });
    } catch (err) {
      console.error("❌ Error making payment:",err);
      setPaymentStep("idle");
      throw err;
    }
  },[writeContract]);

  // Guardar hash cuando se genera
  useEffect(() => {
    if (hash) {
      if (paymentStep === "approving") {
        console.log("📝 Approval hash:",hash);
        setApprovalHash(hash);
      } else if (paymentStep === "paying") {
        console.log("📝 Payment hash:",hash);
        setPaymentHash(hash);
      }
    }
  },[hash,paymentStep]);

  // Cuando se confirma la aprobación, proceder con el pago
  useEffect(() => {
    console.log("🔍 Approval check:",{
      isConfirmed,
      paymentStep,
      hasPendingPayment: !!pendingPayment,
      currentHash: hash,
      approvalHash
    });

    if (isConfirmed && paymentStep === "approving" && pendingPayment && hash === approvalHash) {
      console.log("✅ Approval confirmed! Proceeding to payment in 5s...");
      // Esperar un momento para que la aprobación se registre en blockchain
      setTimeout(() => {
        executePayment(pendingPayment.circleAddress);
      },5000);
    }
  },[isConfirmed,paymentStep,pendingPayment,hash,approvalHash,executePayment]);

  const makePayment = async (circleAddress: string,amount: number) => {
    if (!CONTRACTS_DEPLOYED.circleFactory) {
      // Modo mock - simular
      console.log("Making payment (mock):",{ circleAddress,amount });
      alert(`Modo demo: Pagarías $${amount} USDC al círculo ${circleAddress.slice(0,6)}...`);
      return;
    }

    try {
      const amountInWei = parseUnits(amount.toString(),6); // USDC tiene 6 decimales

      // Reset hashes
      setApprovalHash(undefined);
      setPaymentHash(undefined);

      setPendingPayment({ circleAddress,amount: amountInWei });
      setPaymentStep("approving");

      // Paso 1: Aprobar USDC
      writeContract({
        address: CONTRACTS.monadMainnet.usdc as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [circleAddress as `0x${string}`,amountInWei],
        gas: 100000n, // Gas limit explícito para aprobación
      });
    } catch (err) {
      console.error("Error initiating payment:",err);
      setPaymentStep("idle");
      setPendingPayment(null);
      throw err;
    }
  };

  // Reset cuando se completa el pago
  useEffect(() => {
    console.log("🔄 Reset check:",{
      isConfirmed,
      paymentStep,
      currentHash: hash,
      paymentHash
    });

    if (isConfirmed && paymentStep === "paying" && hash === paymentHash) {
      console.log("✅ Payment confirmed! Resetting in 3s...");
      // Pago completado
      setTimeout(() => {
        console.log("🔄 Resetting payment state to idle");
        setPaymentStep("idle");
        setPendingPayment(null);
        setApprovalHash(undefined);
        setPaymentHash(undefined);
        reset();
      },3000);
    }
  },[isConfirmed,paymentStep,hash,paymentHash,reset]);

  return {
    makePayment,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    paymentStep,
    isProcessing: paymentStep !== "idle" || isPending || isConfirming,
  };
}

/**
 * Hook para depositar garantía en un círculo
 * Maneja el flujo completo: aprobar USDC → depositar garantía
 */
export function useDepositGuarantee() {
  const { address } = useAccount();
  const { writeContract,data: hash,isPending,error,reset } = useWriteContract();
  const [depositStep,setDepositStep] = useState<"idle" | "approving" | "depositing">("idle");
  const [pendingDeposit,setPendingDeposit] = useState<{ circleAddress: string; amount: bigint } | null>(null);
  const [approvalHash,setApprovalHash] = useState<string | undefined>(undefined);
  const [depositHash,setDepositHash] = useState<string | undefined>(undefined);

  const { isLoading: isConfirming,isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const executeDeposit = useCallback(async (circleAddress: string) => {
    if (!CONTRACTS_DEPLOYED.circleFactory) {
      throw new Error("Contracts not deployed yet");
    }

    try {
      console.log("💎 Executing guarantee deposit to:",circleAddress);
      setDepositStep("depositing");

      writeContract({
        address: circleAddress as `0x${string}`,
        abi: CIRCLE_ABI,
        functionName: "depositGuarantee",
        gas: 500000n,
      });
    } catch (err) {
      console.error("❌ Error depositing guarantee:",err);
      setDepositStep("idle");
      throw err;
    }
  },[writeContract]);

  // Guardar hash cuando se genera
  useEffect(() => {
    if (hash) {
      if (depositStep === "approving") {
        console.log("📝 Approval hash:",hash);
        setApprovalHash(hash);
      } else if (depositStep === "depositing") {
        console.log("📝 Deposit hash:",hash);
        setDepositHash(hash);
      }
    }
  },[hash,depositStep]);

  // Cuando se confirma la aprobación, proceder con el depósito
  useEffect(() => {
    console.log("🔍 Approval check:",{
      isConfirmed,
      depositStep,
      hasPendingDeposit: !!pendingDeposit,
      currentHash: hash,
      approvalHash
    });

    if (isConfirmed && depositStep === "approving" && pendingDeposit && hash === approvalHash) {
      console.log("✅ Approval confirmed! Proceeding to deposit in 2s...");
      setTimeout(() => {
        executeDeposit(pendingDeposit.circleAddress);
      },2000);
    }
  },[isConfirmed,depositStep,pendingDeposit,hash,approvalHash,executeDeposit]);

  const depositGuarantee = async (circleAddress: string,amount: number) => {
    if (!CONTRACTS_DEPLOYED.circleFactory) {
      console.log("Depositing guarantee (mock):",{ circleAddress,amount });
      alert(`Modo demo: Depositarías $${amount} USDC como garantía al círculo ${circleAddress.slice(0,6)}...`);
      return;
    }

    try {
      const amountInWei = parseUnits(amount.toString(),6); // USDC tiene 6 decimales

      // Reset hashes
      setApprovalHash(undefined);
      setDepositHash(undefined);

      setPendingDeposit({ circleAddress,amount: amountInWei });
      setDepositStep("approving");

      // Paso 1: Aprobar USDC
      writeContract({
        address: CONTRACTS.monadMainnet.usdc as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [circleAddress as `0x${string}`,amountInWei],
        gas: 100000n,
      });
    } catch (err) {
      console.error("Error initiating deposit:",err);
      setDepositStep("idle");
      setPendingDeposit(null);
      throw err;
    }
  };

  // Reset cuando se completa el depósito
  useEffect(() => {
    if (isConfirmed && depositStep === "depositing" && hash === depositHash) {
      console.log("✅ Deposit confirmed! Resetting in 3s...");
      setTimeout(() => {
        console.log("🔄 Resetting deposit state to idle");
        setDepositStep("idle");
        setPendingDeposit(null);
        setApprovalHash(undefined);
        setDepositHash(undefined);
        reset();
      },3000);
    }
  },[isConfirmed,depositStep,hash,depositHash,reset]);

  return {
    depositGuarantee,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    depositStep,
    isProcessing: depositStep !== "idle" || isPending || isConfirming,
  };
}

/**
 * Hook para verificar si el usuario ha pagado la ronda actual
 */
export function useHasUserPaid(circleAddress: string | undefined,currentRound: number) {
  const { address } = useAccount();

  const { data: hasPaid,isLoading,refetch } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "hasPaidRound",
    args: address && currentRound > 0
      ? [address as `0x${string}`,BigInt(currentRound)]
      : undefined,
  });

  return {
    hasPaid: hasPaid ?? false,
    isLoading,
    refetch,
  };
}

/**
 * Hook para verificar si el usuario ya depositó su garantía
 */
export function useHasDepositedGuarantee(circleAddress: string | undefined) {
  const { address } = useAccount();

  const { data: guaranteeAmount,isLoading,refetch } = useReadContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "guarantees",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!circleAddress && !!address && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  // Si guaranteeAmount > 0, significa que ya depositó
  const hasDeposited = guaranteeAmount ? Number(guaranteeAmount) > 0 : false;

  return {
    hasDeposited,
    isLoading,
    refetch,
  };
}

/**
 * Hook para obtener el estado de depósito de todos los miembros de un círculo
 */
export function useMembersGuaranteeStatus(circleAddress: string | undefined,members: string[]) {
  // Crear array de contratos para verificar cada miembro
  const contracts = members.map((memberAddress) => ({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "guarantees",
    args: [memberAddress as `0x${string}`],
  }));

  const { data: guaranteesData,isLoading,refetch } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!circleAddress && members.length > 0 && CONTRACTS_DEPLOYED.circleFactory,
    },
  });

  // Procesar los datos y crear un array con el estado de cada miembro
  const membersStatus = members.map((memberAddress,index) => {
    const guaranteeAmount = guaranteesData?.[index]?.result as bigint | undefined;
    const hasDeposited = guaranteeAmount ? Number(guaranteeAmount) > 0 : false;

    return {
      address: memberAddress,
      hasDeposited,
      guaranteeAmount: guaranteeAmount ? Number(guaranteeAmount) / 1e6 : 0,
    };
  });

  // Contar cuántos han depositado
  const depositedCount = membersStatus.filter((m) => m.hasDeposited).length;

  return {
    membersStatus,
    depositedCount,
    totalMembers: members.length,
    isLoading,
    refetch,
  };
}
