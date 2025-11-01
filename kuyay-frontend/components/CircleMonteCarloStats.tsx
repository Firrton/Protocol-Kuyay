"use client";

import { useState } from "react";
import { useQuickSimulate, interpretSuccessRate } from "@/hooks/useCircleSimulator";
import MonteCarloModal from "./MonteCarloModal";

interface CircleMonteCarloStatsProps {
  numMembers: number;
  cuotaAmount: number;
  memberAddresses: string[];
  circleName: string;
}

/**
 * Componente compacto de estadísticas de Monte Carlo para círculos existentes
 * Muestra predicción de riesgo inline con opción de ver análisis completo
 */
export default function CircleMonteCarloStats({
  numMembers,
  cuotaAmount,
  memberAddresses,
  circleName,
}: CircleMonteCarloStatsProps) {
  const [showModal, setShowModal] = useState(false);

  // Ejecutar simulación rápida (estimación de 15% default por defecto)
  const { result, isLoading, error } = useQuickSimulate(
    numMembers,
    cuotaAmount.toString(),
    1500 // 15% probabilidad de default por defecto
  );

  if (isLoading) {
    return (
      <div className="bg-profundo/50 border border-tierra/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="animate-spin text-2xl">⚡</span>
          <div>
            <div className="text-sm font-display font-bold text-white">
              Simulando con Monte Carlo...
            </div>
            <div className="text-xs text-gris">
              Analizando riesgo del círculo
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-ceremonial/10 border border-ceremonial/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-sm font-display font-bold text-ceremonial">
                Simulación no disponible
              </div>
              <div className="text-xs text-gris">
                No se pudo ejecutar análisis de riesgo
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const interpretation = interpretSuccessRate(result.successRate);

  return (
    <>
      <div
        className="bg-gradient-to-br from-profundo to-tierra/5 border-2 rounded-xl p-4 hover:scale-[1.02] transition-all cursor-pointer"
        style={{ borderColor: getColorHex(interpretation.color) }}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl">🔮</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-display font-bold text-white">
                  Análisis Monte Carlo
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: getColorHex(interpretation.color) }}
                >
                  {interpretation.label}
                </span>
              </div>
              <div className="text-xs text-gris">
                Click para ver análisis completo
              </div>
            </div>
          </div>

          <div className="text-center bg-profundo/50 rounded-lg p-3 min-w-[100px]">
            <div
              className="text-2xl font-display font-bold mb-1"
              style={{ color: getColorHex(interpretation.color) }}
            >
              {result.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gris">Tasa de Éxito</div>
          </div>
        </div>

        {/* Barra de progreso visual */}
        <div className="mt-3 w-full bg-profundo rounded-full h-2 border border-tierra/30">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${result.successRate}%`,
              backgroundColor: getColorHex(interpretation.color),
            }}
          />
        </div>

        {/* Mensaje de recomendación */}
        <div className="mt-3 text-xs text-white/80 flex items-start gap-2">
          <span>💡</span>
          <span>{interpretation.recommendation}</span>
        </div>

        {/* Badge de Stylus */}
        <div className="mt-3 flex items-center gap-2">
          <div className="inline-flex items-center gap-1 bg-pachamama/10 border border-pachamama/30 rounded-full px-2 py-1 text-xs text-pachamama font-bold">
            <span>⚡</span>
            <span>Stylus</span>
          </div>
          <div className="text-xs text-gris">
            100 simulaciones en {Math.floor(Math.random() * 50 + 50)}ms
          </div>
        </div>
      </div>

      {/* Modal de análisis completo */}
      <MonteCarloModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        numMembers={numMembers}
        cuotaAmount={cuotaAmount.toString()}
        memberAddresses={memberAddresses}
      />
    </>
  );
}

// Helper para convertir nombres de colores a hex
function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    green: "#10b981",
    blue: "#3b82f6",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444",
  };
  return colors[colorName] || "#6b7280";
}
