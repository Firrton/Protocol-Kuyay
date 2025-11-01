'use client';

import { useState } from 'react';
import { useDemo } from '@/lib/demo/DemoContext';
import { demoService } from '@/lib/demo/DemoService';
import { useHasAguayo } from '@/hooks/useAguayo';

export default function DemoController() {
  const { state, config, startDemo, stopDemo, resetDemo, updateConfig } = useDemo();
  const [isExpanded, setIsExpanded] = useState(false);

  // Verificar si el usuario ya tiene Aguayo
  const { hasAguayo } = useHasAguayo();

  const mode = demoService.getMode();
  const isBlockchain = mode === 'blockchain';
  const isDemoMode = mode === 'mock';

  const handleStartDemo = () => {
    startDemo(hasAguayo);
  };

  return (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-6 py-3 rounded-full font-display font-bold shadow-2xl transition-all ${
            isBlockchain
              ? 'bg-gradient-to-r from-pachamama to-ceremonial text-white'
              : 'bg-gradient-to-r from-ocre to-dorado text-profundo'
          } hover:scale-105 active:scale-95`}
        >
          {isExpanded ? '✕' : '▶'} {isBlockchain ? '🔗 Demo Blockchain' : '🎮 Demo Mode'}
        </button>
      </div>

      {/* Panel Expandido */}
      {isExpanded && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-profundo border-2 border-dorado rounded-2xl shadow-2xl p-6 animate-fade-in">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Control de Demo
            </h3>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                isBlockchain
                  ? 'bg-pachamama/20 text-pachamama border border-pachamama'
                  : 'bg-ocre/20 text-ocre border border-ocre'
              }`}>
                {isBlockchain ? '🔗 Blockchain Mode' : '🎮 Mock Mode'}
              </div>
              {isDemoMode && (
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-dorado/20 text-dorado border border-dorado">
                  ⚡ Instant
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          {state.isPlaying && (
            <div className="mb-4 bg-tierra/20 border border-tierra rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gris">Progreso</span>
                <span className="text-sm font-bold text-white">{Math.round(state.progress)}%</span>
              </div>
              <div className="h-2 bg-profundo rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ceremonial to-ocre transition-all duration-500"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gris">
                Paso actual: <span className="text-white font-bold">{state.currentStep}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="mb-4 bg-ceremonial/10 border border-ceremonial rounded-lg p-3">
              <div className="text-xs text-ceremonial">{state.error}</div>
            </div>
          )}

          {/* Controles */}
          <div className="space-y-3">
            {!state.isPlaying ? (
              <>
                <button
                  onClick={handleStartDemo}
                  className="w-full bg-gradient-to-r from-ceremonial to-ocre text-white py-3 rounded-lg font-display font-bold hover:scale-105 transition-transform"
                >
                  ▶ Iniciar Demo Completo
                </button>
                {hasAguayo && (
                  <div className="text-xs text-green-400 text-center">
                    ✓ Aguayo detectado - Saltando paso de minteo
                  </div>
                )}

                {/* Config: Solo Mode */}
                <label className="flex items-center gap-3 p-3 bg-tierra/10 rounded-lg cursor-pointer hover:bg-tierra/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.soloMode}
                    onChange={(e) => updateConfig({ soloMode: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">Modo Solo</div>
                    <div className="text-xs text-gris">
                      Simula automáticamente a otros miembros
                    </div>
                  </div>
                </label>

                {/* Config: Auto Play */}
                <label className="flex items-center gap-3 p-3 bg-tierra/10 rounded-lg cursor-pointer hover:bg-tierra/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.autoPlay}
                    onChange={(e) => updateConfig({ autoPlay: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">Auto-Play</div>
                    <div className="text-xs text-gris">
                      Avanza automáticamente entre pasos
                    </div>
                  </div>
                </label>
              </>
            ) : (
              <>
                <button
                  onClick={stopDemo}
                  className="w-full border-2 border-ceremonial text-ceremonial py-3 rounded-lg font-display font-bold hover:bg-ceremonial hover:text-white transition-all"
                >
                  ⏸ Pausar Demo
                </button>
                <button
                  onClick={resetDemo}
                  className="w-full border-2 border-tierra text-gris py-2 rounded-lg font-display font-bold hover:bg-tierra hover:text-profundo transition-all text-sm"
                >
                  ↻ Reiniciar
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="mt-4 pt-4 border-t border-tierra">
            <div className="text-xs text-gris space-y-1">
              {isBlockchain ? (
                <>
                  <p>✓ Contratos desplegados en Arbitrum Sepolia</p>
                  <p>✓ Transacciones reales en blockchain</p>
                  <p>⏱️ Tiempo estimado: ~5-10 minutos</p>
                </>
              ) : (
                <>
                  <p>⚡ Simulación instantánea</p>
                  <p>📋 Sin transacciones reales</p>
                  <p>⏱️ Tiempo estimado: ~60 segundos</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
