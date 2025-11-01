# 🚀 Stylus Contracts Integration Guide

## ✅ Contratos Integrados

### CircleSimulator (Monte Carlo Engine)
- **Address:** `0x319570972527b9e3c989902311b9f808fe3553a4`
- **Función:** Simulación probabilística de resultados de circles
- **Tech:** Rust/WASM on Arbitrum Stylus
- **Gas Savings:** 97% vs Solidity puro

### RiskOracle (Risk Evaluation Engine)
- **Address:** `0xc9ca3c1ceaf97012daae2f270f65d957113da3be`
- **Función:** Evaluación de riesgo y cálculo de leverage dinámico
- **Tech:** Rust/WASM on Arbitrum Stylus
- **Leverage:** Hasta 5x basado en niveles de Aguayo SBT

---

## 📦 Archivos Actualizados

### 1. Contract Addresses
```typescript
// lib/contracts/addresses.ts
export const CONTRACTS = {
  arbitrumSepolia: {
    // ... contratos existentes
    circleSimulator: "0x319570972527b9e3c989902311b9f808fe3553a4",
    riskOracle: "0xc9ca3c1ceaf97012daae2f270f65d957113da3be",
  }
}
```

### 2. ABIs
```typescript
// lib/contracts/abis.ts
export const CIRCLE_SIMULATOR_ABI = [...]; // ✅ Agregado
export const RISK_ORACLE_ABI = [...];      // ✅ Agregado
```

### 3. Custom Hooks
- `hooks/useCircleSimulator.ts` - Hook para Monte Carlo simulation
- `hooks/useRiskOracle.ts` - Hook para risk evaluation

### 4. Components
- `components/MonteCarloPreview.tsx` - Componente de preview

---

## 🎯 Uso Básico

### 1. Preview de Monte Carlo (Antes de crear circle)

```typescript
import { MonteCarloPreview } from "@/components/MonteCarloPreview";

function CreateCirclePage() {
  const [members, setMembers] = useState<string[]>([]);
  const [cuota, setCuota] = useState("100");

  return (
    <div>
      {/* ... form para seleccionar miembros ... */}

      {members.length >= 3 && (
        <MonteCarloPreview
          numMembers={members.length}
          cuotaAmount={cuota}
          memberAddresses={members}
          onContinue={() => {
            // Usuario acepta el riesgo, continuar con creación
            createCircle();
          }}
        />
      )}
    </div>
  );
}
```

### 2. Verificar Elegibilidad de Miembros

```typescript
import { useAllMembersEligibility } from "@/hooks/useRiskOracle";

function MemberSelector() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { allEligible, isLoading } = useAllMembersEligibility(selectedMembers);

  return (
    <div>
      {/* ... selector de miembros ... */}

      {selectedMembers.length > 0 && (
        <div className={allEligible ? "text-green-600" : "text-red-600"}>
          {allEligible
            ? "✅ Todos los miembros son elegibles"
            : "⚠️ Algunos miembros no son elegibles"}
        </div>
      )}
    </div>
  );
}
```

### 3. Mostrar Leverage Disponible

```typescript
import { useLeverageLevel } from "@/hooks/useRiskOracle";

function LeverageDisplay({ members }: { members: string[] }) {
  const { leverage, isLoading } = useLeverageLevel(members);

  if (isLoading) return <div>Calculando leverage...</div>;
  if (!leverage) return null;

  return (
    <div className="bg-green-50 p-4 rounded">
      <h3>⚡ Leverage Disponible</h3>
      <p>Multiplicador: <strong>{leverage.multiplierX}x</strong></p>
      <p>Tasa APR: <strong>{leverage.apr}%</strong></p>
    </div>
  );
}
```

### 4. Quick Simulation (Solo Vista)

```typescript
import { useQuickSimulate } from "@/hooks/useCircleSimulator";

function QuickPreview() {
  const { result, isLoading } = useQuickSimulate(
    10,      // 10 miembros
    "100",   // 100 USDC cuota
    1500     // 15% probabilidad de default
  );

  if (isLoading) return <div>Simulando...</div>;
  if (!result) return null;

  return (
    <div>
      <p>Tasa de Éxito: {result.successRate.toFixed(1)}%</p>
      <p>Retorno Esperado: ${result.expectedReturnFormatted}</p>
    </div>
  );
}
```

### 5. Full Simulation (Con Transacción)

```typescript
import { useFullSimulation } from "@/hooks/useCircleSimulator";

function FullSimulationButton() {
  const { simulateCircle, isPending, isConfirmed } = useFullSimulation();

  const runSimulation = () => {
    simulateCircle(
      10,      // miembros
      "100",   // cuota
      12,      // rondas
      1500,    // 15% default
      1000     // 1000 simulaciones
    );
  };

  return (
    <button
      onClick={runSimulation}
      disabled={isPending}
    >
      {isPending ? "Simulando..." : "Ejecutar Simulación Completa"}
    </button>
  );
}
```

### 6. Risk Evaluation Completa

```typescript
import { useCircleRiskEvaluation } from "@/hooks/useRiskOracle";

function RiskDashboard({ members }: { members: string[] }) {
  const {
    allEligible,
    leverage,
    stats,
    riskScore,
    isLoading,
    isReady
  } = useCircleRiskEvaluation(members);

  if (isLoading) return <div>Evaluando riesgo...</div>;
  if (!isReady) return <div>Datos no disponibles</div>;

  return (
    <div>
      <h3>Evaluación de Riesgo</h3>
      <p>Elegibilidad: {allEligible ? "✅" : "❌"}</p>
      <p>Leverage: {leverage?.multiplierX}x @ {leverage?.apr}% APR</p>
      <p>Nivel Promedio: {stats?.averageLevel}</p>
      <p>Manchas Totales: {stats?.totalStains}</p>
      <p>Risk Score: {riskScore}/100</p>
    </div>
  );
}
```

---

## 🎨 Integración en Flow de Creación de Circle

### Paso 1: Modificar CreateCircleForm

```typescript
// pages/create-circle.tsx o app/create/page.tsx

import { useState } from "react";
import { MonteCarloPreview } from "@/components/MonteCarloPreview";
import { useCreateSavingsCircle } from "@/hooks/useCircles";

export default function CreateCirclePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    members: [] as string[],
    cuota: "100",
    guarantee: "500",
  });

  const { createSavingsCircle, isPending } = useCreateSavingsCircle();

  const handleCreate = async () => {
    await createSavingsCircle(
      Number(formData.cuota),
      Number(formData.guarantee),
      formData.members
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 1 && (
        <div>
          <h2>Paso 1: Selecciona Miembros</h2>
          {/* ... form para miembros ... */}
          <button onClick={() => setStep(2)}>
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Paso 2: Preview de Monte Carlo</h2>
          <MonteCarloPreview
            numMembers={formData.members.length}
            cuotaAmount={formData.cuota}
            memberAddresses={formData.members}
            onContinue={() => setStep(3)}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Paso 3: Confirmar Creación</h2>
          {/* ... resumen final ... */}
          <button
            onClick={handleCreate}
            disabled={isPending}
          >
            {isPending ? "Creando..." : "Crear Circle"}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Features Disponibles

### Monte Carlo Simulation
- ✅ Quick simulation (view function, no gas)
- ✅ Full simulation (transaction, estadísticas completas)
- ✅ Success rate calculation
- ✅ Expected return estimation
- ✅ Best/worst case scenarios (percentiles)
- ✅ Variance calculation

### Risk Oracle
- ✅ Member eligibility checks
- ✅ Group risk evaluation
- ✅ Dynamic leverage calculation (1x-5x)
- ✅ Dynamic interest rates (8-15% APR)
- ✅ Stain penalty system
- ✅ Tier-based risk assessment

---

## ⚡ Performance

### CircleSimulator
- Quick simulation: ~50k gas
- Full simulation (1000 runs): ~500k gas
- **Savings:** 97% vs Solidity implementation

### RiskOracle
- Eligibility check: ~30k gas
- Leverage calculation: ~50k gas
- Group stats: ~60k gas

---

## 🎯 Best Practices

### 1. Always Check Eligibility First
```typescript
const { allEligible } = useAllMembersEligibility(members);

if (!allEligible) {
  // Show error, don't continue
  return <ErrorMessage />;
}
```

### 2. Show Monte Carlo Preview Before Creation
```typescript
// Siempre mostrar preview antes de crear
{step === "preview" && (
  <MonteCarloPreview
    onContinue={() => setStep("confirm")}
  />
)}
```

### 3. Use Quick Simulate for Real-time Feedback
```typescript
// Mientras usuario edita parámetros
const { result } = useQuickSimulate(members, cuota, defaultProb);

// Mostrar feedback en tiempo real
```

### 4. Combine Risk Score with Success Rate
```typescript
const { riskScore } = useCircleRiskEvaluation(members);
const { result } = useQuickSimulate(...);

// Solo permitir creación si ambos son buenos
const canCreate = riskScore < 50 && result.successRate > 70;
```

---

## 🐛 Troubleshooting

### "Contract not deployed" error
```typescript
import { CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";

if (!CONTRACTS_DEPLOYED.circleSimulator) {
  console.error("CircleSimulator not deployed yet");
}
```

### "Execution reverted" en simulation
- Verificar que los parámetros estén en rango válido
- `numMembers`: 1-100
- `numSimulations`: 1-10000
- `defaultProbability`: 0-10000

### No se muestran resultados
- Asegurarse de que `cuotaAmount` sea > 0
- Verificar que `memberAddresses` no esté vacío
- Revisar que el wallet esté conectado

---

## 📖 Type Definitions

```typescript
// Simulation Result
type SimulationResult = {
  successRate: number;      // 0-10000 (0-100%)
  expectedReturn: bigint;
  successes: number;
  bestCase: bigint;
  worstCase: bigint;
};

// Leverage Info
type Leverage = {
  multiplier: bigint;        // 200 = 2x
  multiplierX: number;       // 2
  interestRate: bigint;      // 1500 bps
  apr: number;               // 15%
};

// Group Stats
type GroupStats = {
  averageLevel: number;
  totalStains: number;
  stainsPerMember: number;
};
```

---

## 🚀 Next Steps

1. ✅ Integrar MonteCarloPreview en flow de creación
2. ✅ Mostrar leverage disponible en UI
3. ✅ Agregar badges de elegibilidad a miembros
4. ⏳ Implementar notificaciones cuando riesgo es muy alto
5. ⏳ Agregar analytics de simulaciones ejecutadas
6. ⏳ Crear dashboard de risk metrics

---

**¡Todo listo para usar los contratos Stylus en tu frontend!** 🎉

Para más info:
- Deployed contracts: `stylus-contracts/DEPLOYMENT_SUMMARY.md`
- Monte Carlo tests: `stylus-contracts/MONTE_CARLO_VERIFICATION.md`
