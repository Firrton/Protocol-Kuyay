/**
 * DemoService - Abstracción dual mode
 * Funciona tanto con blockchain como con mock data
 */

import { parseUnits } from 'viem';
import { CONTRACTS_DEPLOYED } from '@/lib/contracts/addresses';
import type { DemoMode, DemoMember } from './types';

export class DemoService {
  private mode: DemoMode;

  constructor() {
    // Auto-detect mode based on contract deployment
    this.mode = CONTRACTS_DEPLOYED.aguayoSBT ? 'blockchain' : 'mock';
  }

  getMode(): DemoMode {
    return this.mode;
  }

  isDemoMode(): boolean {
    return this.mode === 'mock';
  }

  isBlockchainMode(): boolean {
    return this.mode === 'blockchain';
  }

  // ============================================
  // MINT AGUAYO
  // ============================================

  async mintAguayo(): Promise<{ success: boolean; txHash?: string; tokenId?: number }> {
    if (this.isDemoMode()) {
      // Mock: simular delay
      await this.delay(2000);
      return { success: true, tokenId: 1 };
    } else {
      // Blockchain: el frontend usará los hooks reales
      throw new Error('Use useMintAguayo hook for blockchain mode');
    }
  }

  // ============================================
  // CREATE CIRCLE
  // ============================================

  async createCircle(params: {
    mode: 'SAVINGS' | 'CREDIT';
    members: string[];
    cuotaAmount: number;
    guaranteeAmount: number;
    leverage?: number;
  }): Promise<{ success: boolean; circleAddress?: string }> {
    if (this.isDemoMode()) {
      await this.delay(3000);
      return {
        success: true,
        circleAddress: '0x' + Math.random().toString(16).substring(2, 42)
      };
    } else {
      throw new Error('Use createCircle hooks for blockchain mode');
    }
  }

  // ============================================
  // MAKE PAYMENT
  // ============================================

  async makePayment(circleAddress: string, amount: number): Promise<{ success: boolean }> {
    if (this.isDemoMode()) {
      await this.delay(2500);
      return { success: true };
    } else {
      throw new Error('Use useMakePayment hook for blockchain mode');
    }
  }

  // ============================================
  // CHECK IN
  // ============================================

  async checkIn(circleAddress: string): Promise<{ success: boolean }> {
    if (this.isDemoMode()) {
      await this.delay(1500);
      return { success: true };
    } else {
      throw new Error('Use checkIn transaction for blockchain mode');
    }
  }

  // ============================================
  // START DRAW
  // ============================================

  async startDraw(circleAddress: string): Promise<{ success: boolean; requestId?: string }> {
    if (this.isDemoMode()) {
      await this.delay(2000);
      const requestId = Math.floor(Math.random() * 1000000).toString();

      // Simular VRF callback después de 3 segundos
      setTimeout(() => {
        console.log('VRF callback simulated');
      }, 3000);

      return { success: true, requestId };
    } else {
      throw new Error('Use startDraw transaction for blockchain mode');
    }
  }

  // ============================================
  // SOLO MODE: Simular otros miembros
  // ============================================

  generateDemoMembers(userAddress: string, count: number = 5): DemoMember[] {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const members: DemoMember[] = [];

    // El usuario siempre es el primero
    members.push({
      address: userAddress,
      name: 'Tú',
      aguayoLevel: 3,
      hasPaid: false,
      isPresent: false,
      isYou: true,
    });

    // Generar otros miembros simulados
    for (let i = 0; i < count - 1; i++) {
      members.push({
        address: '0x' + Math.random().toString(16).substring(2, 42),
        name: names[i] || `Miembro ${i + 1}`,
        aguayoLevel: Math.floor(Math.random() * 5) + 1,
        hasPaid: false,
        isPresent: false,
        isYou: false,
      });
    }

    return members;
  }

  // Simular que otros miembros pagan (solo demo mode)
  async simulateMemberPayment(memberAddress: string): Promise<{ success: boolean }> {
    if (this.isDemoMode()) {
      await this.delay(1000);
      return { success: true };
    }
    throw new Error('Solo available in demo mode');
  }

  // Simular que otros miembros hacen check-in (solo demo mode)
  async simulateMemberCheckIn(memberAddress: string): Promise<{ success: boolean }> {
    if (this.isDemoMode()) {
      await this.delay(800);
      return { success: true };
    }
    throw new Error('Solo available in demo mode');
  }

  // ============================================
  // UTILS
  // ============================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtener tiempo estimado para una acción
  getEstimatedTime(action: string, mode: DemoMode = this.mode): number {
    if (mode === 'mock') {
      const times: Record<string, number> = {
        mintAguayo: 2,
        createCircle: 3,
        makePayment: 2.5,
        checkIn: 1.5,
        startDraw: 5,
      };
      return times[action] || 2;
    } else {
      // Blockchain times (más lentos)
      const times: Record<string, number> = {
        mintAguayo: 15,
        createCircle: 20,
        makePayment: 10,
        checkIn: 8,
        startDraw: 30,
      };
      return times[action] || 10;
    }
  }
}

// Singleton instance
export const demoService = new DemoService();
