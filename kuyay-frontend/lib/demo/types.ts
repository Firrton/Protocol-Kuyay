/**
 * Demo Mode Types
 * Sistema dual: Blockchain + Mock
 */

export type DemoMode = 'blockchain' | 'mock';

export type DemoStep =
  | 'idle'
  | 'minting-aguayo'
  | 'creating-circle'
  | 'joining-circle'
  | 'making-payment'
  | 'checking-in'
  | 'starting-draw'
  | 'drawing-winner'
  | 'distributing-pot'
  | 'completed';

export interface DemoState {
  mode: DemoMode;
  isPlaying: boolean;
  currentStep: DemoStep;
  progress: number; // 0-100
  error?: string;

  // Demo data
  mockAguayoLevel: number;
  mockCircleAddress?: string;
  mockMembers: DemoMember[];

  // Real blockchain data (when deployed)
  realAguayoTokenId?: number;
  realCircleAddress?: string;
}

export interface DemoMember {
  address: string;
  name: string; // "Alice", "Bob", etc
  aguayoLevel: number;
  hasPaid: boolean;
  isPresent: boolean;
  isYou?: boolean; // true for the judge's wallet
}

export interface DemoAction {
  type: 'MINT_AGUAYO' | 'CREATE_CIRCLE' | 'MAKE_PAYMENT' | 'CHECK_IN' | 'START_DRAW';
  description: string;
  estimatedTime: number; // seconds
  requiresWallet: boolean;
}

export interface DemoConfig {
  autoPlay: boolean;
  speed: 'slow' | 'normal' | 'fast';
  skipAnimations: boolean;
  soloMode: boolean; // true = simulate other members
}
