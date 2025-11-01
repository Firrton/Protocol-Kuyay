"use client";

import { motion, AnimatePresence } from "framer-motion";

/**
 * Componente de notificación de riesgo
 *
 * Se activa cuando:
 * - Risk score > 70
 * - Success rate < 60%
 * - Hay miembros no elegibles
 */

type RiskLevel = "low" | "medium" | "high" | "critical";

interface RiskNotificationProps {
  riskLevel: RiskLevel;
  riskScore?: number;
  successRate?: number;
  ineligibleMembers?: number;
  message: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export default function RiskNotification({
  riskLevel,
  riskScore,
  successRate,
  ineligibleMembers,
  message,
  onDismiss,
  showDismiss = true,
}: RiskNotificationProps) {
  const config = getRiskConfig(riskLevel);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`${config.bg} ${config.border} border-2 rounded-xl p-6 shadow-xl ${config.shadow}`}
      >
        <div className="flex items-start gap-4">
          {/* Icono animado */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center ${config.animation}`}>
            <span className="text-3xl">{config.icon}</span>
          </div>

          {/* Contenido */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className={`text-xl font-display font-bold ${config.titleColor} mb-2`}>
                  {config.title}
                </h4>
                <p className={`${config.textColor} leading-relaxed mb-4`}>
                  {message}
                </p>

                {/* Métricas */}
                <div className="flex flex-wrap gap-3">
                  {riskScore !== undefined && (
                    <div className={`${config.metricBg} rounded-lg px-3 py-2 border ${config.metricBorder}`}>
                      <div className="text-xs text-gris mb-1">Risk Score</div>
                      <div className={`text-lg font-display font-bold ${config.metricColor}`}>
                        {riskScore}/100
                      </div>
                    </div>
                  )}

                  {successRate !== undefined && (
                    <div className={`${config.metricBg} rounded-lg px-3 py-2 border ${config.metricBorder}`}>
                      <div className="text-xs text-gris mb-1">Tasa de Éxito</div>
                      <div className={`text-lg font-display font-bold ${config.metricColor}`}>
                        {successRate.toFixed(1)}%
                      </div>
                    </div>
                  )}

                  {ineligibleMembers !== undefined && ineligibleMembers > 0 && (
                    <div className={`${config.metricBg} rounded-lg px-3 py-2 border ${config.metricBorder}`}>
                      <div className="text-xs text-gris mb-1">Miembros No Elegibles</div>
                      <div className={`text-lg font-display font-bold ${config.metricColor}`}>
                        {ineligibleMembers}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recomendaciones específicas */}
                {riskLevel === "critical" && (
                  <div className="mt-4 bg-ceremonial/10 border border-ceremonial/30 rounded-lg p-3">
                    <p className="text-sm text-ceremonial font-semibold mb-2">
                      ⚠️ Recomendaciones:
                    </p>
                    <ul className="text-xs text-gris space-y-1 ml-4">
                      <li>• Revisa los niveles de Aguayo de todos los miembros</li>
                      <li>• Considera reducir el tamaño del círculo</li>
                      <li>• Empieza con modo SAVINGS antes de CREDIT</li>
                    </ul>
                  </div>
                )}

                {/* Badge de Stylus */}
                <div className="mt-3 inline-flex items-center gap-2 bg-pachamama/10 border border-pachamama/30 rounded-full px-3 py-1">
                  <span className="text-sm">⚡</span>
                  <span className="text-xs text-pachamama font-semibold">
                    Análisis en tiempo real con Stylus
                  </span>
                </div>
              </div>

              {/* Botón de cerrar */}
              {showDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-profundo/50 transition-colors flex items-center justify-center text-gris hover:text-white"
                  aria-label="Cerrar notificación"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Configuración visual según nivel de riesgo
 */
function getRiskConfig(level: RiskLevel) {
  switch (level) {
    case "low":
      return {
        icon: "✅",
        title: "Riesgo Bajo",
        bg: "bg-gradient-to-br from-pachamama/20 to-profundo",
        border: "border-pachamama/50",
        shadow: "shadow-pachamama/20",
        iconBg: "bg-pachamama/20",
        titleColor: "text-pachamama",
        textColor: "text-white",
        metricBg: "bg-profundo/50",
        metricBorder: "border-pachamama/30",
        metricColor: "text-pachamama",
        animation: "",
      };

    case "medium":
      return {
        icon: "⚠️",
        title: "Riesgo Medio",
        bg: "bg-gradient-to-br from-ocre/20 to-profundo",
        border: "border-ocre/50",
        shadow: "shadow-ocre/20",
        iconBg: "bg-ocre/20",
        titleColor: "text-ocre",
        textColor: "text-white",
        metricBg: "bg-profundo/50",
        metricBorder: "border-ocre/30",
        metricColor: "text-ocre",
        animation: "",
      };

    case "high":
      return {
        icon: "🚨",
        title: "Riesgo Alto",
        bg: "bg-gradient-to-br from-dorado/20 to-profundo",
        border: "border-dorado/50",
        shadow: "shadow-dorado/30",
        iconBg: "bg-dorado/20",
        titleColor: "text-dorado",
        textColor: "text-white",
        metricBg: "bg-profundo/50",
        metricBorder: "border-dorado/30",
        metricColor: "text-dorado",
        animation: "animate-pulse",
      };

    case "critical":
      return {
        icon: "🛑",
        title: "Riesgo Crítico - No Recomendado",
        bg: "bg-gradient-to-br from-ceremonial/20 to-profundo",
        border: "border-ceremonial",
        shadow: "shadow-ceremonial/40",
        iconBg: "bg-ceremonial/30",
        titleColor: "text-ceremonial",
        textColor: "text-white",
        metricBg: "bg-profundo/50",
        metricBorder: "border-ceremonial/30",
        metricColor: "text-ceremonial",
        animation: "animate-pulse",
      };
  }
}

/**
 * Helper para determinar nivel de riesgo basado en métricas
 */
export function calculateRiskLevel(
  riskScore?: number,
  successRate?: number,
  hasIneligible?: boolean
): RiskLevel {
  // Si hay miembros no elegibles, siempre es crítico
  if (hasIneligible) return "critical";

  // Basado en risk score
  if (riskScore !== undefined) {
    if (riskScore >= 80) return "critical";
    if (riskScore >= 60) return "high";
    if (riskScore >= 40) return "medium";
    return "low";
  }

  // Basado en success rate
  if (successRate !== undefined) {
    if (successRate < 50) return "critical";
    if (successRate < 70) return "high";
    if (successRate < 85) return "medium";
    return "low";
  }

  return "low";
}
