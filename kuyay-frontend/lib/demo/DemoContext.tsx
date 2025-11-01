'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { demoService } from './DemoService';
import type { DemoState, DemoStep, DemoConfig, DemoMember } from './types';

interface DemoContextValue {
  state: DemoState;
  config: DemoConfig;

  // Actions
  startDemo: (hasExistingAguayo?: boolean) => void;
  stopDemo: () => void;
  nextStep: () => void;
  resetDemo: () => void;

  // Step-specific actions
  mintAguayo: () => Promise<void>;
  createCircle: () => Promise<void>;
  makePayment: (memberIndex?: number) => Promise<void>;
  checkIn: (memberIndex?: number) => Promise<void>;
  startDraw: () => Promise<void>;

  // Solo mode helpers
  simulateAllMembersPayment: () => Promise<void>;
  simulateAllMembersCheckIn: () => Promise<void>;

  // Config
  updateConfig: (config: Partial<DemoConfig>) => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();

  const [state, setState] = useState<DemoState>({
    mode: demoService.getMode(),
    isPlaying: false,
    currentStep: 'idle',
    progress: 0,
    mockAguayoLevel: 0,
    mockMembers: [],
  });

  const [config, setConfig] = useState<DemoConfig>({
    autoPlay: false,
    speed: 'normal',
    skipAnimations: false,
    soloMode: true, // Por defecto activado para hackathon
  });

  // ============================================
  // DEMO FLOW CONTROL
  // ============================================

  const startDemo = useCallback((hasExistingAguayo = false) => {
    if (!address && demoService.isBlockchainMode()) {
      alert('Conecta tu wallet primero');
      return;
    }

    // Generar miembros demo
    const members = demoService.generateDemoMembers(address || '0x0', 5);

    // Si ya tiene Aguayo, saltear el paso de mintear
    const initialStep = hasExistingAguayo ? 'creating-circle' : 'minting-aguayo';
    const initialProgress = hasExistingAguayo ? 30 : 10;

    setState(prev => ({
      ...prev,
      isPlaying: true,
      currentStep: initialStep,
      progress: initialProgress,
      mockMembers: members,
      mockAguayoLevel: hasExistingAguayo ? 1 : 0,
    }));
  }, [address]);

  const stopDemo = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState({
      mode: demoService.getMode(),
      isPlaying: false,
      currentStep: 'idle',
      progress: 0,
      mockAguayoLevel: 0,
      mockMembers: [],
    });
  }, []);

  const nextStep = useCallback(() => {
    const steps: DemoStep[] = [
      'idle',
      'minting-aguayo',
      'creating-circle',
      'making-payment',
      'checking-in',
      'starting-draw',
      'drawing-winner',
      'distributing-pot',
      'completed'
    ];

    const currentIndex = steps.indexOf(state.currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setState(prev => ({
        ...prev,
        currentStep: nextStep,
        progress: Math.min(100, ((currentIndex + 1) / steps.length) * 100),
      }));
    }
  }, [state.currentStep]);

  // ============================================
  // STEP ACTIONS
  // ============================================

  const mintAguayo = useCallback(async () => {
    setState(prev => ({ ...prev, currentStep: 'minting-aguayo' }));

    try {
      const result = await demoService.mintAguayo();

      if (result.success) {
        setState(prev => ({
          ...prev,
          mockAguayoLevel: 1,
          realAguayoTokenId: result.tokenId,
          progress: 20,
        }));

        if (config.autoPlay) {
          setTimeout(() => nextStep(), 2000);
        }
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [config.autoPlay, nextStep]);

  const createCircle = useCallback(async () => {
    setState(prev => ({ ...prev, currentStep: 'creating-circle' }));

    try {
      const result = await demoService.createCircle({
        mode: 'SAVINGS',
        members: state.mockMembers.map(m => m.address),
        cuotaAmount: 150,
        guaranteeAmount: 300,
      });

      if (result.success) {
        setState(prev => ({
          ...prev,
          mockCircleAddress: result.circleAddress,
          realCircleAddress: result.circleAddress,
          progress: 40,
        }));

        if (config.autoPlay) {
          setTimeout(() => nextStep(), 2000);
        }
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [state.mockMembers, config.autoPlay, nextStep]);

  const makePayment = useCallback(async (memberIndex?: number) => {
    setState(prev => ({ ...prev, currentStep: 'making-payment' }));

    try {
      const member = memberIndex !== undefined
        ? state.mockMembers[memberIndex]
        : state.mockMembers.find(m => m.isYou);

      if (!member) return;

      const result = await demoService.makePayment(
        state.mockCircleAddress || '0x0',
        150
      );

      if (result.success) {
        // Update member payment status
        setState(prev => {
          const updatedMembers = [...prev.mockMembers];
          const idx = updatedMembers.findIndex(m => m.address === member.address);
          if (idx !== -1) {
            updatedMembers[idx] = { ...updatedMembers[idx], hasPaid: true };
          }

          return {
            ...prev,
            mockMembers: updatedMembers,
            progress: 60,
          };
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [state.mockMembers, state.mockCircleAddress]);

  const checkIn = useCallback(async (memberIndex?: number) => {
    setState(prev => ({ ...prev, currentStep: 'checking-in' }));

    try {
      const member = memberIndex !== undefined
        ? state.mockMembers[memberIndex]
        : state.mockMembers.find(m => m.isYou);

      if (!member) return;

      const result = await demoService.checkIn(state.mockCircleAddress || '0x0');

      if (result.success) {
        setState(prev => {
          const updatedMembers = [...prev.mockMembers];
          const idx = updatedMembers.findIndex(m => m.address === member.address);
          if (idx !== -1) {
            updatedMembers[idx] = { ...updatedMembers[idx], isPresent: true };
          }

          return {
            ...prev,
            mockMembers: updatedMembers,
            progress: 80,
          };
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [state.mockMembers, state.mockCircleAddress]);

  const startDraw = useCallback(async () => {
    setState(prev => ({ ...prev, currentStep: 'starting-draw' }));

    try {
      const result = await demoService.startDraw(state.mockCircleAddress || '0x0');

      if (result.success) {
        setState(prev => ({ ...prev, currentStep: 'drawing-winner', progress: 90 }));

        // Simular ganador después de 3 segundos
        setTimeout(() => {
          setState(prev => ({ ...prev, currentStep: 'distributing-pot', progress: 95 }));

          setTimeout(() => {
            setState(prev => ({ ...prev, currentStep: 'completed', progress: 100 }));
          }, 2000);
        }, 3000);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  }, [state.mockCircleAddress]);

  // ============================================
  // SOLO MODE HELPERS
  // ============================================

  const simulateAllMembersPayment = useCallback(async () => {
    if (!config.soloMode) return;

    for (const member of state.mockMembers) {
      if (!member.isYou && !member.hasPaid) {
        await demoService.simulateMemberPayment(member.address);

        setState(prev => {
          const updatedMembers = prev.mockMembers.map(m =>
            m.address === member.address ? { ...m, hasPaid: true } : m
          );
          return { ...prev, mockMembers: updatedMembers };
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [config.soloMode, state.mockMembers]);

  const simulateAllMembersCheckIn = useCallback(async () => {
    if (!config.soloMode) return;

    for (const member of state.mockMembers) {
      if (!member.isYou && !member.isPresent) {
        await demoService.simulateMemberCheckIn(member.address);

        setState(prev => {
          const updatedMembers = prev.mockMembers.map(m =>
            m.address === member.address ? { ...m, isPresent: true } : m
          );
          return { ...prev, mockMembers: updatedMembers };
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [config.soloMode, state.mockMembers]);

  // ============================================
  // CONFIG
  // ============================================

  const updateConfig = useCallback((newConfig: Partial<DemoConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // ============================================
  // AUTO-EXECUTE STEP ACTIONS
  // ============================================

  useEffect(() => {
    if (!state.isPlaying) return;

    // Ejecutar acción automáticamente cuando cambia el paso
    const executeStepAction = async () => {
      switch (state.currentStep) {
        case 'minting-aguayo':
          // No ejecutar si ya tiene aguayo
          if (state.mockAguayoLevel === 0) {
            await mintAguayo();
          }
          break;

        case 'creating-circle':
          // Solo ejecutar si no hay círculo creado
          if (!state.mockCircleAddress) {
            await createCircle();
          }
          break;

        case 'making-payment':
          // Ejecutar pago del usuario principal
          const userMember = state.mockMembers.find(m => m.isYou);
          if (userMember && !userMember.hasPaid) {
            await makePayment();
            // Si está en modo solo, simular pagos de otros miembros
            if (config.soloMode) {
              setTimeout(() => simulateAllMembersPayment(), 1000);
            }
          }
          break;

        case 'checking-in':
          // Ejecutar check-in del usuario principal
          const userMemberCheckIn = state.mockMembers.find(m => m.isYou);
          if (userMemberCheckIn && !userMemberCheckIn.isPresent) {
            await checkIn();
            // Si está en modo solo, simular check-in de otros miembros
            if (config.soloMode) {
              setTimeout(() => simulateAllMembersCheckIn(), 1000);
            }
          }
          break;

        case 'starting-draw':
          await startDraw();
          break;

        default:
          break;
      }
    };

    executeStepAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep, state.isPlaying]); // Solo reaccionar a cambios de paso

  const value: DemoContextValue = {
    state,
    config,
    startDemo,
    stopDemo,
    nextStep,
    resetDemo,
    mintAguayo,
    createCircle,
    makePayment,
    checkIn,
    startDraw,
    simulateAllMembersPayment,
    simulateAllMembersCheckIn,
    updateConfig,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
}
