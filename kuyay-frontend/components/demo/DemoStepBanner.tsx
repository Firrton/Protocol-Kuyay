'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useDemo } from '@/lib/demo/DemoContext';
import type { DemoStep } from '@/lib/demo/types';
import { ArrowRight, CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface StepInfo {
  title: string;
  description: string;
  action?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const stepInfoMap: Record<DemoStep, StepInfo> = {
  'idle': {
    title: 'Modo Demo',
    description: 'Inicia el demo para ver cómo funciona Kuyay',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  'minting-aguayo': {
    title: 'Paso 1: Mintea tu Aguayo NFT',
    description: 'Primero necesitas tu identificación digital (Aguayo) para participar en Kuyay',
    action: 'Ve a "Mi Perfil" y haz clic en "Mintear Aguayo"',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300'
  },
  'creating-circle': {
    title: 'Creando tu Ayllu (Círculo)',
    description: 'Estás formando tu comunidad de ahorro',
    action: 'Espera mientras se configura tu círculo...',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300'
  },
  'joining-circle': {
    title: 'Uniéndote al Círculo',
    description: 'Te estás uniendo a un círculo existente',
    action: 'Procesando tu entrada al círculo...',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300'
  },
  'making-payment': {
    title: 'Realizando Pago',
    description: 'Haciendo tu contribución al círculo',
    action: 'El demo está procesando el pago automáticamente...',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300'
  },
  'checking-in': {
    title: 'Registrando Asistencia',
    description: 'Confirmando tu participación en esta ronda',
    action: 'Registrando check-in automático...',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300'
  },
  'starting-draw': {
    title: 'Iniciando Sorteo',
    description: 'Preparando el sorteo para determinar el ganador',
    action: 'Configurando el sorteo...',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300'
  },
  'drawing-winner': {
    title: 'Sorteando Ganador',
    description: 'Seleccionando al ganador de esta ronda',
    action: 'Ejecutando sorteo aleatorio...',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300'
  },
  'distributing-pot': {
    title: 'Distribuyendo Fondos',
    description: 'Transfiriendo el pozo al ganador',
    action: 'Procesando distribución...',
    icon: <Circle className="w-5 h-5" />,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300'
  },
  'completed': {
    title: 'Demo Completado',
    description: '¡Has completado el ciclo completo de un Ayllu!',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300'
  }
};

const allSteps: DemoStep[] = [
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

interface DemoStepBannerProps {
  onNavigateToProfile?: () => void;
}

export default function DemoStepBanner({ onNavigateToProfile }: DemoStepBannerProps) {
  const { state } = useDemo();

  if (!state.isPlaying && state.currentStep === 'idle') {
    return null;
  }

  const currentStepInfo = stepInfoMap[state.currentStep];
  const currentStepIndex = allSteps.indexOf(state.currentStep);
  const progress = ((currentStepIndex + 1) / allSteps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${currentStepInfo.bgColor} ${currentStepInfo.borderColor} border-2 rounded-lg p-4 mb-6 shadow-lg`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Icon & Content */}
        <div className="flex items-start gap-3 flex-1">
          <div className={`${currentStepInfo.color} mt-0.5`}>
            {currentStepInfo.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg ${currentStepInfo.color} mb-1`}>
              {currentStepInfo.title}
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              {currentStepInfo.description}
            </p>

            {currentStepInfo.action && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 bg-white/50 px-3 py-2 rounded-md border border-gray-200">
                <ArrowRight className="w-4 h-4" />
                <span>{currentStepInfo.action}</span>
              </div>
            )}

            {/* Special button for minting step */}
            {state.currentStep === 'minting-aguayo' && onNavigateToProfile && (
              <button
                onClick={onNavigateToProfile}
                className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Ir a Mintear Aguayo
              </button>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="text-right min-w-[80px]">
          <div className="text-2xl font-bold" style={{ color: currentStepInfo.color.replace('text-', '') }}>
            {currentStepIndex + 1}/{allSteps.length}
          </div>
          <div className="text-xs text-gray-600 mt-1">Pasos</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500"
        />
      </div>
    </motion.div>
  );
}
