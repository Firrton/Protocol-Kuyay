"use client";

import { useState } from "react";
import { useCircleRiskEvaluation } from "@/hooks/useRiskOracle";

interface QuickRiskBadgeProps {
  memberAddresses: string[];
  onViewDetails?: () => void;
  compact?: boolean;
}

export default function QuickRiskBadge({
  memberAddresses,
  onViewDetails,
  compact = false,
}: QuickRiskBadgeProps) {
  const { allEligible, leverage, stats, riskScore, isLoading, isReady } =
    useCircleRiskEvaluation(memberAddresses);

  if (!memberAddresses || memberAddresses.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-tierra/10 border border-tierra rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-tierra rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-tierra/30 rounded w-32 mb-2"></div>
            <div className="h-3 bg-tierra/20 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="bg-tierra/10 border border-tierra rounded-xl p-4">
        <p className="text-gris text-sm">Datos no disponibles</p>
      </div>
    );
  }

  // Determinar nivel de riesgo y color
  const getRiskLevel = () => {
    if (!allEligible) return { level: "ALTO", color: "ceremonial", emoji: "🔴", bg: "bg-ceremonial/10", border: "border-ceremonial" };
    if (riskScore > 60) return { level: "ALTO", color: "ceremonial", emoji: "🔴", bg: "bg-ceremonial/10", border: "border-ceremonial" };
    if (riskScore > 30) return { level: "MEDIO", color: "ocre", emoji: "🟡", bg: "bg-ocre/10", border: "border-ocre" };
    return { level: "BAJO", color: "pachamama", emoji: "🟢", bg: "bg-pachamama/10", border: "border-pachamama" };
  };

  const risk = getRiskLevel();

  // Mensajes en quechua/español que mantienen la esencia
  const getMessage = () => {
    if (!allEligible) {
      return "Algunos miembros no son elegibles para unirse al Ayllu. Verifica sus Aguayos.";
    }
    if (risk.level === "ALTO") {
      return "Este Ayllu tiene riesgo elevado. Considera fortalecer el grupo antes de tejer juntos.";
    }
    if (risk.level === "MEDIO") {
      return "El Ayllu muestra equilibrio moderado. La reciprocidad será clave para el éxito.";
    }
    return "¡Tinkunakuy! Este Ayllu está bien balanceado. Los hilos se tejerán con confianza.";
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${risk.bg} border ${risk.border}`}>
        <span className="text-lg">{risk.emoji}</span>
        <span className={`text-sm font-display font-bold text-${risk.color}`}>
          Riesgo {risk.level}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 ${risk.border} ${risk.bg} overflow-hidden`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{risk.emoji}</div>
            <div>
              <h3 className={`text-xl font-display font-bold text-${risk.color}`}>
                Riesgo {risk.level}
              </h3>
              <p className="text-sm text-gris mt-1">{getMessage()}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-white">
              {allEligible ? "✅" : "❌"}
            </div>
            <div className="text-xs text-gris mt-1">Elegibilidad</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-display font-bold text-white">
              {stats?.averageLevel.toFixed(1)}
            </div>
            <div className="text-xs text-gris mt-1">Nivel Promedio</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-display font-bold text-white">
              {leverage?.multiplierX}x
            </div>
            <div className="text-xs text-gris mt-1">Leverage</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-display font-bold text-white">
              {riskScore.toFixed(0)}
            </div>
            <div className="text-xs text-gris mt-1">Score Riesgo</div>
          </div>
        </div>

        {/* Manchas (si hay) */}
        {stats && stats.totalStains > 0 && (
          <div className="bg-profundo/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-ceremonial text-xl">⚠️</span>
              <p className="text-sm text-gris">
                El Ayllu tiene <span className="text-white font-bold">{stats.totalStains} Q'ipi</span> (manchas).
                Cada mancha representa un pago incumplido en el pasado.
              </p>
            </div>
          </div>
        )}

        {/* Botón para ver simulación detallada */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className={`w-full px-4 py-3 rounded-lg font-display font-bold transition-all border-2 ${
              risk.level === "BAJO"
                ? `border-pachamama text-pachamama hover:bg-pachamama hover:text-profundo`
                : risk.level === "MEDIO"
                ? `border-ocre text-ocre hover:bg-ocre hover:text-profundo`
                : `border-ceremonial text-ceremonial hover:bg-ceremonial hover:text-profundo`
            }`}
          >
            🔍 Ver Simulación Monte Carlo Completa
          </button>
        )}

        {/* Explicación cultural */}
        <div className="mt-4 pt-4 border-t border-tierra/30">
          <p className="text-xs text-gris italic">
            💡 <strong className="text-white">Ayni:</strong> En la cosmovisión andina, el Ayni es el principio de reciprocidad.
            Este análisis te ayuda a formar Ayllus donde todos tejen con responsabilidad.
          </p>
        </div>
      </div>
    </div>
  );
}
