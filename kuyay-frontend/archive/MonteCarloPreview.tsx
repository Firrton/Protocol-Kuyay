"use client";

import { useState, useEffect } from "react";
import { useQuickSimulate, interpretSuccessRate } from "@/hooks/useCircleSimulator";
import { useCircleRiskEvaluation, interpretRiskScore } from "@/hooks/useRiskOracle";
import RiskNotification, { calculateRiskLevel } from "./RiskNotification";

interface MonteCarloPreviewProps {
  numMembers: number;
  cuotaAmount: string;
  memberAddresses: string[];
  onContinue?: () => void;
}

/**
 * Componente para preview de Monte Carlo antes de crear un circle
 *
 * Muestra:
 * - Simulación probabilística del resultado del circle
 * - Evaluación de riesgo basada en niveles de Aguayo
 * - Leverage disponible y tasa de interés
 * - Recomendaciones
 */
export function MonteCarloPreview({
  numMembers,
  cuotaAmount,
  memberAddresses,
  onContinue,
}: MonteCarloPreviewProps) {
  const [defaultProb, setDefaultProb] = useState(1500); // 15% por defecto
  const [showRiskNotification, setShowRiskNotification] = useState(true);

  // Obtener evaluación de riesgo del RiskOracle
  const {
    allEligible,
    leverage,
    stats,
    riskScore,
    isLoading: riskLoading,
    isReady: riskReady,
  } = useCircleRiskEvaluation(memberAddresses);

  // Ajustar probabilidad de default basada en stats del grupo
  useEffect(() => {
    if (stats) {
      // Nivel más alto = menos default
      const baseProbByLevel = stats.averageLevel >= 5 ? 500 :
                               stats.averageLevel >= 3 ? 1000 :
                               stats.averageLevel >= 2 ? 1500 : 2000;

      // Agregar penalización por manchas (stains)
      const stainPenalty = stats.totalStains * 200; // +2% por mancha

      setDefaultProb(Math.min(baseProbByLevel + stainPenalty, 9000));
    }
  }, [stats]);

  // Ejecutar simulación Monte Carlo
  const { result, isLoading: simLoading, refetch } = useQuickSimulate(
    numMembers,
    cuotaAmount,
    defaultProb
  );

  const isLoading = riskLoading || simLoading;

  if (isLoading) {
    return (
      <div className="p-6 bg-profundo/50 border border-tierra rounded-xl">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-tierra/30 rounded w-3/4"></div>
          <div className="h-4 bg-tierra/30 rounded w-1/2"></div>
        </div>
        <p className="text-sm text-gris mt-4 flex items-center gap-2">
          <span className="animate-spin text-xl">⚡</span>
          Ejecutando simulación Monte Carlo con Stylus...
        </p>
      </div>
    );
  }

  // Calcular nivel de riesgo
  const riskLevel = calculateRiskLevel(riskScore ?? undefined, result?.successRate, !allEligible);
  const shouldShowNotification = riskLevel === "high" || riskLevel === "critical";

  // Si hay miembros no elegibles, mostrar notificación crítica
  if (!allEligible) {
    return (
      <RiskNotification
        riskLevel="critical"
        message="Uno o más miembros no cumplen con los requisitos mínimos para participar en un círculo. Verifica que todos tengan un Aguayo SBT activo y sin manchas críticas."
        ineligibleMembers={memberAddresses.length}
        showDismiss={false}
      />
    );
  }

  const successInterpretation = result ? interpretSuccessRate(result.successRate) : null;
  const riskInterpretation = riskScore !== null ? interpretRiskScore(riskScore) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pachamama to-dorado text-white p-6 rounded-xl shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🧮</span>
          <h2 className="text-2xl font-display font-bold">
            Simulación Monte Carlo
          </h2>
        </div>
        <p className="text-white/90 mb-2">
          Predicción probabilística del resultado basada en 100 escenarios simulados
        </p>
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-sm">⚡</span>
          <span className="text-xs font-semibold">Powered by Stylus (Rust/WASM)</span>
        </div>
      </div>

      {/* Notificación de Riesgo (si aplica) */}
      {shouldShowNotification && showRiskNotification && (
        <RiskNotification
          riskLevel={riskLevel}
          riskScore={riskScore ?? undefined}
          successRate={result?.successRate}
          message={getRiskMessage(riskLevel, riskScore, result?.successRate)}
          onDismiss={() => setShowRiskNotification(false)}
        />
      )}

      {/* Resultados de Simulación */}
      {result && successInterpretation && (
        <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 rounded-xl p-6 shadow-lg"
             style={{ borderColor: getColorHex(successInterpretation.color) }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-xl font-display font-bold text-white">Resultado de Simulación</h3>
            <span className={`px-4 py-2 rounded-full text-white font-display font-bold`}
                  style={{ backgroundColor: getColorHex(successInterpretation.color) }}>
              {successInterpretation.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-profundo/50 border border-tierra/30 p-4 rounded-xl">
              <p className="text-sm text-gris mb-1">Tasa de Éxito</p>
              <p className="text-3xl font-display font-bold text-white">
                {result.successRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-profundo/50 border border-tierra/30 p-4 rounded-xl">
              <p className="text-sm text-gris mb-1">Retorno Esperado</p>
              <p className="text-3xl font-display font-bold text-white">
                ${result.expectedReturnFormatted}
              </p>
            </div>
          </div>

          <div className="bg-dorado/10 border border-dorado/30 p-3 rounded-lg">
            <p className="text-sm text-white leading-relaxed">
              💡 <strong className="text-dorado">Recomendación:</strong> {successInterpretation.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Evaluación de Riesgo */}
      {stats && leverage && riskInterpretation && (
        <div className="bg-gradient-to-br from-profundo to-tierra/5 border-2 border-ocre/30 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <span>🎯</span>
            Evaluación de Riesgo del Grupo
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-profundo/50 border border-tierra/30 p-4 rounded-xl">
              <p className="text-sm text-gris mb-1">Nivel Promedio</p>
              <p className="text-2xl font-display font-bold text-pachamama">
                {stats.averageLevel}
              </p>
            </div>

            <div className="text-center bg-profundo/50 border border-tierra/30 p-4 rounded-xl">
              <p className="text-sm text-gris mb-1">Manchas Totales</p>
              <p className="text-2xl font-display font-bold text-ceremonial">
                {stats.totalStains}
              </p>
            </div>

            <div className="text-center bg-profundo/50 border border-tierra/30 p-4 rounded-xl">
              <p className="text-sm text-gris mb-1">Score de Riesgo</p>
              <p className="text-2xl font-display font-bold" style={{ color: getColorHex(riskInterpretation.color) }}>
                {riskScore}/100
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2" style={{
            borderColor: getColorHex(riskInterpretation.color),
            backgroundColor: `${getColorHex(riskInterpretation.color)}15`
          }}>
            <p className="font-display font-bold mb-1" style={{ color: getColorHex(riskInterpretation.color) }}>
              {riskInterpretation.label}
            </p>
            <p className="text-sm text-white leading-relaxed">
              {riskInterpretation.description}
            </p>
          </div>
        </div>
      )}

      {/* Leverage Disponible */}
      {leverage && (
        <div className="bg-gradient-to-br from-pachamama/20 to-dorado/20 border-2 border-pachamama/50 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-display font-bold text-pachamama mb-4 flex items-center gap-2">
            <span>⚡</span>
            Leverage Disponible (Stylus Power!)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-profundo/50 border border-pachamama/30 rounded-xl p-4">
              <p className="text-sm text-gris mb-1">Multiplicador</p>
              <p className="text-3xl font-display font-bold text-pachamama">
                {leverage.multiplierX}x
              </p>
              <p className="text-xs text-gris mt-1">
                Puedes pedir hasta {leverage.multiplierX}x la garantía
              </p>
            </div>

            <div className="bg-profundo/50 border border-dorado/30 rounded-xl p-4">
              <p className="text-sm text-gris mb-1">Tasa de Interés (APR)</p>
              <p className="text-3xl font-display font-bold text-dorado">
                {leverage.apr}%
              </p>
              <p className="text-xs text-gris mt-1">
                Interés anual basado en el nivel del grupo
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-profundo/70 border border-pachamama/30 rounded-lg">
            <p className="text-sm text-white leading-relaxed">
              <strong className="text-pachamama">⚡ Stylus Magic:</strong> Este cálculo se hace on-chain en Rust/WASM,
              usando 97% menos gas que Solidity.
            </p>
          </div>
        </div>
      )}

      {/* Detalles Técnicos */}
      <details className="bg-profundo/30 border border-tierra/30 p-4 rounded-xl">
        <summary className="cursor-pointer font-display font-semibold text-white hover:text-ocre transition-colors">
          🔬 Detalles Técnicos de la Simulación
        </summary>
        <div className="mt-4 space-y-2 text-sm text-gris bg-profundo/50 p-4 rounded-lg">
          <p>• <strong className="text-white">Algoritmo:</strong> Monte Carlo (100 iteraciones)</p>
          <p>• <strong className="text-white">Probabilidad de Default:</strong> {(defaultProb / 100).toFixed(1)}%</p>
          <p>• <strong className="text-white">Miembros Simulados:</strong> {numMembers}</p>
          <p>• <strong className="text-white">Cuota por Ronda:</strong> ${cuotaAmount} USDC</p>
          <p>• <strong className="text-white">Threshold de Fallo:</strong> {'>'} 30% defaults en una ronda</p>
          <p>• <strong className="text-pachamama">Contrato:</strong> Stylus (Rust/WASM on Arbitrum) ⚡</p>
          <p>• <strong className="text-dorado">Gas Usado:</strong> ~50k (vs ~5M en Solidity puro)</p>
        </div>
      </details>

      {/* Botón de Continuar */}
      {onContinue && (
        <button
          onClick={onContinue}
          disabled={!result || result.successRate < 50}
          className={`w-full py-4 px-6 rounded-xl font-display font-bold text-white text-lg transition-all
            ${result && result.successRate >= 50
              ? 'bg-gradient-to-r from-pachamama to-dorado hover:scale-105 cursor-pointer shadow-xl'
              : 'bg-tierra/30 cursor-not-allowed opacity-50'
            }`}
        >
          {result && result.successRate >= 50
            ? '✅ Continuar con la Creación del Circle'
            : '⚠️ Riesgo muy alto - No recomendado'
          }
        </button>
      )}

      {/* Refresh Button */}
      <button
        onClick={() => refetch()}
        className="w-full py-2 px-4 bg-ocre/10 border border-ocre/30 text-ocre rounded-xl hover:bg-ocre/20 transition-all font-display font-semibold"
      >
        🔄 Refrescar Simulación
      </button>
    </div>
  );
}

// Helper para convertir nombres de colores a hex
function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    green: '#10b981',
    blue: '#3b82f6',
    yellow: '#eab308',
    orange: '#f97316',
    red: '#ef4444',
  };
  return colors[colorName] || '#6b7280';
}

// Helper para generar mensaje de riesgo personalizado
function getRiskMessage(
  riskLevel: string,
  riskScore: number | null,
  successRate?: number
): string {
  if (riskLevel === "critical") {
    return "⚠️ Este círculo tiene un riesgo extremadamente alto de fallar. Múltiples factores indican que no es seguro continuar. Considera mejorar la composición del grupo antes de crear este círculo.";
  }

  if (riskLevel === "high") {
    if (successRate && successRate < 60) {
      return `La simulación Monte Carlo indica una tasa de éxito de solo ${successRate.toFixed(1)}% - significativamente por debajo del umbral recomendado de 70%. Esto sugiere alta probabilidad de defaults en el círculo.`;
    }
    if (riskScore && riskScore > 70) {
      return `El Risk Oracle ha evaluado este grupo con un score de ${riskScore}/100, indicando múltiples factores de riesgo. Revisa los niveles de Aguayo y el historial de manchas de los miembros.`;
    }
    return "Este círculo presenta varios factores de riesgo que podrían afectar su éxito. Revisa cuidadosamente las métricas antes de continuar.";
  }

  return "Este círculo presenta algunos factores de riesgo menores. Revisa las métricas para asegurarte de estar cómodo con el nivel de riesgo.";
}
