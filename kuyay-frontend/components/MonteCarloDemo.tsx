"use client";

import { useState } from "react";
import MonteCarloModal from "./MonteCarloModal";
import {
  MONTE_CARLO_SCENARIOS,
  MonteCarloScenario,
  getWalletRiskColor,
  getAguayoLevelEmoji,
} from "@/lib/mockData/monteCarloScenarios";

/**
 * Componente de demostración de Monte Carlo
 *
 * Muestra diferentes escenarios con wallets problemáticas
 * para demostrar cómo funciona el análisis de riesgo
 */
export default function MonteCarloDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<MonteCarloScenario | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);

  const handleScenarioSelect = (scenario: MonteCarloScenario) => {
    setSelectedScenario(scenario);
    setIsModalOpen(true);
  };

  const scenarios = Object.values(MONTE_CARLO_SCENARIOS);

  return (
    <div className="space-y-6">
      {/* Botón principal de demo */}
      <div className="bg-gradient-to-r from-ceremonial to-ocre p-8 rounded-2xl shadow-2xl border-2 border-dorado">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-6xl">🔮</span>
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">
              Demo: Simulación Monte Carlo
            </h2>
            <p className="text-white/90 text-lg">
              Descubre cómo la IA detecta wallets problemáticas ANTES de que fallen
            </p>
          </div>
        </div>

        <div className="bg-profundo/30 backdrop-blur-sm border border-dorado/30 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-display font-bold text-dorado mb-3 flex items-center gap-2">
            <span>🌾</span>
            ¿Qué es Monte Carlo?
          </h3>
          <p className="text-white/90 leading-relaxed mb-3">
            Como los antiguos andinos que leían las hojas de coca para predecir el futuro,
            <strong className="text-pachamama"> Monte Carlo simula 100 escenarios posibles</strong> para
            predecir si un círculo tendrá éxito o fracasará.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-profundo/50 border border-pachamama/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-pachamama">⚡</span>
                <strong className="text-pachamama">Tecnología Stylus</strong>
              </div>
              <p className="text-white/80">
                Ejecutado en Rust/WASM - 97% más eficiente que Solidity
              </p>
            </div>
            <div className="bg-profundo/50 border border-dorado/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-dorado">🎯</span>
                <strong className="text-dorado">Predicción Precisa</strong>
              </div>
              <p className="text-white/80">
                Identifica riesgos antes de que el círculo comience
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowScenarios(!showScenarios)}
          className="w-full py-4 px-6 bg-gradient-to-r from-pachamama to-dorado text-white rounded-xl font-display font-bold text-lg hover:scale-105 transition-all shadow-xl"
        >
          {showScenarios ? "🔼 Ocultar Escenarios" : "🔽 Ver Escenarios de Demostración"}
        </button>
      </div>

      {/* Selector de escenarios */}
      {showScenarios && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`bg-profundo border-2 rounded-xl p-6 hover:scale-105 transition-all cursor-pointer shadow-xl ${
                scenario.riskLevel === "critical" ? "border-ceremonial animate-pulse" :
                scenario.riskLevel === "high" ? "border-ceremonial" :
                scenario.riskLevel === "medium" ? "border-ocre" :
                "border-pachamama"
              }`}
              onClick={() => handleScenarioSelect(scenario)}
            >
              {/* Header del escenario */}
              <div className="mb-4">
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  {scenario.title}
                </h3>
                <p className="text-sm text-gris leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              {/* Stats del escenario */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-profundo/50 border border-tierra/30 p-3 rounded-lg">
                  <p className="text-xs text-gris mb-1">Miembros</p>
                  <p className="text-2xl font-display font-bold text-white">
                    {scenario.numMembers}
                  </p>
                </div>
                <div className="bg-profundo/50 border border-tierra/30 p-3 rounded-lg">
                  <p className="text-xs text-gris mb-1">Cuota</p>
                  <p className="text-2xl font-display font-bold text-white">
                    ${scenario.cuotaAmount}
                  </p>
                </div>
              </div>

              {/* Predicción */}
              <div className="bg-profundo/70 border-2 p-4 rounded-lg mb-4"
                   style={{ borderColor: scenario.riskLevel === "critical" ? "#ef4444" :
                                        scenario.riskLevel === "high" ? "#f97316" :
                                        scenario.riskLevel === "medium" ? "#eab308" :
                                        "#10b981" }}>
                <p className="text-xs text-gris mb-2">Predicción Monte Carlo</p>
                <p className="text-3xl font-display font-bold mb-2"
                   style={{ color: scenario.riskLevel === "critical" ? "#ef4444" :
                                   scenario.riskLevel === "high" ? "#f97316" :
                                   scenario.riskLevel === "medium" ? "#eab308" :
                                   "#10b981" }}>
                  {scenario.expectedSuccessRate}%
                </p>
                <p className="text-xs text-white/80">
                  Tasa de éxito esperada
                </p>
              </div>

              {/* Lista de wallets */}
              <div className="mb-4">
                <p className="text-xs text-gris mb-2 font-semibold">Composición del Grupo:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {scenario.wallets.map((wallet, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs bg-profundo/50 border border-tierra/30 p-2 rounded"
                    >
                      <span style={{ color: getWalletRiskColor(wallet.riskProfile) }}>●</span>
                      <span className="text-white font-semibold truncate flex-1">
                        {wallet.name}
                      </span>
                      <span className="text-gris">
                        {getAguayoLevelEmoji(wallet.aguayoLevel)}
                      </span>
                      {wallet.stains > 0 && (
                        <span className="text-ceremonial text-xs">
                          🔴{wallet.stains}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota cultural */}
              <div className="bg-gradient-to-r from-dorado/10 to-pachamama/10 border border-dorado/30 p-3 rounded-lg">
                <p className="text-xs text-white/90 leading-relaxed">
                  {scenario.culturalNote}
                </p>
              </div>

              {/* Botón de simulación */}
              <button
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-pachamama to-dorado text-white rounded-lg font-display font-bold hover:scale-105 transition-all shadow-lg"
              >
                🔮 Simular este Ayllu
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Explicación adicional */}
      {showScenarios && (
        <div className="bg-gradient-to-r from-profundo to-tierra/20 border-2 border-tierra p-6 rounded-xl">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <span>💡</span>
            ¿Cómo Leer los Resultados?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-display font-semibold text-pachamama mb-2">
                Indicadores de Riesgo:
              </h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2">
                  <span style={{ color: "#10b981" }}>●</span>
                  <strong>Verde:</strong> Miembro confiable
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: "#eab308" }}>●</span>
                  <strong>Amarillo:</strong> Riesgo moderado
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: "#f97316" }}>●</span>
                  <strong>Naranja:</strong> Alto riesgo
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: "#ef4444" }}>●</span>
                  <strong>Rojo:</strong> Crítico - No recomendado
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-dorado mb-2">
                Símbolos de Aguayo:
              </h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2">
                  ⭐⭐⭐⭐⭐ <span>Nivel 5 - Élite</span>
                </li>
                <li className="flex items-center gap-2">
                  ⭐⭐⭐⭐ <span>Nivel 4 - Confiable</span>
                </li>
                <li className="flex items-center gap-2">
                  ⭐⭐⭐ <span>Nivel 3 - Regular</span>
                </li>
                <li className="flex items-center gap-2">
                  🔴 <span>Manchas - Problemas de pago</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal de simulación */}
      {selectedScenario && (
        <MonteCarloModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedScenario(null);
          }}
          numMembers={selectedScenario.numMembers}
          cuotaAmount={selectedScenario.cuotaAmount}
          memberAddresses={selectedScenario.wallets.map((w) => w.address)}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(234, 179, 8, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 179, 8, 0.7);
        }
      `}</style>
    </div>
  );
}
