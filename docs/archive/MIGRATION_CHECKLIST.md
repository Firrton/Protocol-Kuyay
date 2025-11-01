# 📋 Kuyay Protocol - Migration Checklist

## 📍 DEPLOYMENT GUIDES UBICACIONES

✅ **Circle Simulator (Monte Carlo):**
- `/Users/firrton/Desktop/Protocol-Kuyay/stylus-contracts/circle-simulator/DEPLOYMENT_GUIDE.md`
- `/Users/firrton/Desktop/Protocol-Kuyay/CIRCLE_SIMULATOR_COMPLETE.md` (Resumen ejecutivo)

---

## 📊 CONTRATOS EXISTENTES (Foundry Solidity)

```
foundry/src/
├── Circle.sol           # 🟢 Queda en Solidity (contract principal)
├── CircleFactory.sol    # 🔄 MIGRAR a Stylus
├── RiskOracle.sol       # 🔄 MIGRAR a Stylus
├── KuyayVault.sol       # 🔄 MIGRAR a Stylus
└── AguayoSBT.sol        # 🟢 Queda en Solidity (OpenZeppelin)
```

---

## ✅ COMPLETADOS (100%)

### 1. Circle Simulator (NEW - Hackathon Feature)
**Ubicación:** `stylus-contracts/circle-simulator/`
**Status:** ✅ 100% - Compilado y listo
- Contract size: 15.8 KiB
- WASM size: 48.7 KiB
- Gas savings: 97% vs Solidity
- Functions: `simulate_circle()`, `quick_simulate()`
- ABI exported: `ICircleSimulator.sol`

---

## 🟡 CONTRATOS A MIGRAR (Pendientes)

### 2. RiskOracle
**Solidity:** `foundry/src/RiskOracle.sol`
**Stylus:** `stylus-contracts/risk-oracle/src/lib.rs`
**Status:** 🟡 Código escrito, pero NO COMPILA
**Problema:** Errores de sintaxis SDK (versión 0.9.0 obsoleta)
**Solución:** Actualizar a SDK 0.8.4 (como circle-simulator)

**Funciones principales:**
- `initialize()`
- `are_all_members_eligible()`
- `get_leverage_level()`
- `get_weighted_probabilities()`
- `is_member_eligible()`

**Por qué migrar:** 
- Cálculos intensivos (loops sobre miembros)
- 83% gas savings estimado
- Storage caching beneficioso

---

### 3. KuyayVault
**Solidity:** `foundry/src/KuyayVault.sol`
**Stylus:** `stylus-contracts/kuyay-vault/src/lib.rs`
**Status:** 🟡 Código escrito, pero NO COMPILA
**Problema:** Errores de sintaxis SDK (versión 0.9.0 obsoleta)
**Solución:** Actualizar a SDK 0.8.4

**Funciones principales:**
- `initialize()`
- `deposit()` / `withdraw()`
- `batch_deposit()` ← Feature exclusiva Stylus
- `request_loan()` / `repay_loan()`
- `calculate_total_debt()`
- `liquidate_circle()`

**Por qué migrar:**
- Cálculos de interés compuesto
- Batch operations (imposibles en Solidity eficientemente)
- 85% gas savings estimado

---

### 4. CircleFactory
**Solidity:** `foundry/src/CircleFactory.sol`
**Stylus:** `stylus-contracts/circle-factory/src/lib.rs`
**Status:** 🔴 80% completado - FALTA TERMINAR
**Problema:** Estructura creada, falta implementación completa

**Funciones principales:**
- `create_circle()` - Validación batch de miembros
- `preview_circle()` - Simulación pre-creación
- Admin functions

**Por qué migrar:**
- Validación batch de múltiples miembros
- Interoperabilidad con Circle.sol (Solidity)
- Preview/simulation optimizado

---

## 🟢 CONTRATOS QUE QUEDAN EN SOLIDITY (No Migrar)

### Circle.sol
**Razón:** Contrato principal, state machine complejo
**Interoperabilidad:** Llamará a RiskOracle (Stylus), KuyayVault (Stylus), CircleFactory (Stylus)
**Dependencias:** Chainlink VRF (debe quedar en Solidity)

### AguayoSBT.sol  
**Razón:** Usa OpenZeppelin extensivamente (ERC721, AccessControl)
**Interoperabilidad:** RiskOracle (Stylus) lo leerá via `sol_interface!`

### Chainlink VRF
**Razón:** Integración externa, no podemos migrarlo
**Status:** Queda en Solidity

---

## 🎯 PLAN DE ACCIÓN (Orden Recomendado)

### Paso 1: Arreglar RiskOracle (2 horas)
```bash
cd stylus-contracts/risk-oracle

# 1. Actualizar Cargo.toml (como circle-simulator)
# 2. Arreglar imports (SDK 0.8.4)
# 3. Copiar Cargo.lock del circle-simulator
# 4. Agregar rust-toolchain.toml
# 5. Compilar
cargo stylus check

# 6. Exportar ABI
cargo stylus export-abi > IRiskOracle.sol
```

### Paso 2: Arreglar KuyayVault (2 horas)
```bash
cd stylus-contracts/kuyay-vault

# Mismo proceso que RiskOracle
cargo stylus check
cargo stylus export-abi > IKuyayVault.sol
```

### Paso 3: Completar CircleFactory (3 horas)
```bash
cd stylus-contracts/circle-factory

# 1. Revisar código del CircleFactory.sol original
# 2. Implementar funciones faltantes
# 3. Compilar
cargo stylus check

# 4. Exportar ABI
cargo stylus export-abi > ICircleFactory.sol
```

### Paso 4: Deploy Todo (1 hora)
```bash
# Deploy en orden de dependencias:

# 1. RiskOracle (no depende de nadie)
cd risk-oracle
cargo stylus deploy --private-key=$PRIVATE_KEY --endpoint=$RPC_URL
# RISK_ORACLE_ADDRESS=0x...

# 2. KuyayVault (no depende de nadie)
cd ../kuyay-vault
cargo stylus deploy --private-key=$PRIVATE_KEY --endpoint=$RPC_URL
# VAULT_ADDRESS=0x...

# 3. CircleFactory (puede usar RiskOracle)
cd ../circle-factory
cargo stylus deploy --private-key=$PRIVATE_KEY --endpoint=$RPC_URL
# FACTORY_ADDRESS=0x...

# 4. Circle Simulator (independiente - hackathon)
cd ../circle-simulator
cargo stylus deploy --private-key=$PRIVATE_KEY --endpoint=$RPC_URL
# SIMULATOR_ADDRESS=0x...

# 5. Contratos Solidity (Circle.sol, AguayoSBT.sol)
cd ../../foundry
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## 📊 RESUMEN DE ESTADO

| Contrato | Original | Stylus | Status | Priority |
|----------|----------|--------|--------|----------|
| **CircleSimulator** | N/A (New) | ✅ DONE | 100% | HACKATHON |
| **RiskOracle** | ✅ Solidity | 🟡 Needs fix | 70% | HIGH |
| **KuyayVault** | ✅ Solidity | 🟡 Needs fix | 70% | HIGH |
| **CircleFactory** | ✅ Solidity | 🔴 Incomplete | 50% | MEDIUM |
| **Circle.sol** | ✅ Solidity | 🚫 No migrar | N/A | - |
| **AguayoSBT.sol** | ✅ Solidity | 🚫 No migrar | N/A | - |

---

## ⏱️ TIEMPO ESTIMADO TOTAL

- Arreglar RiskOracle: **2 horas**
- Arreglar KuyayVault: **2 horas**
- Completar CircleFactory: **3 horas**
- Deploy y testing: **1 hora**

**TOTAL: 8 horas** para tener todo listo

---

## 🚀 SIGUIENTE PASO INMEDIATO

**OPCIÓN 1: Arreglar contratos existentes (RiskOracle + KuyayVault)**
- Más rápido (solo fix de sintaxis)
- Menos riesgo
- Funcionalidad ya implementada

**OPCIÓN 2: Completar CircleFactory**
- Más tiempo
- Requiere leer Solidity original
- Implementar lógica faltante

**RECOMENDACIÓN: Opción 1 primero** (4 horas), luego Opción 2 (3 horas)

---

## 📁 ESTRUCTURA FINAL

```
stylus-contracts/
├── circle-simulator/     # ✅ DONE - Hackathon feature
│   ├── src/lib.rs
│   ├── ICircleSimulator.sol
│   └── DEPLOYMENT_GUIDE.md
│
├── risk-oracle/          # 🟡 TODO - Fix sintaxis
│   ├── src/lib.rs
│   └── Cargo.toml (actualizar)
│
├── kuyay-vault/          # 🟡 TODO - Fix sintaxis  
│   ├── src/lib.rs
│   └── Cargo.toml (actualizar)
│
└── circle-factory/       # 🔴 TODO - Completar código
    ├── src/lib.rs
    └── Cargo.toml (actualizar)

foundry/src/
├── Circle.sol            # 🟢 Solidity (no migrar)
└── AguayoSBT.sol         # 🟢 Solidity (no migrar)
```

---

## ✅ CHECKLIST FINAL

### Stylus Contracts
- [x] CircleSimulator compilado ✅
- [ ] RiskOracle compilado
- [ ] KuyayVault compilado
- [ ] CircleFactory completado y compilado

### ABIs Exportados
- [x] ICircleSimulator.sol ✅
- [ ] IRiskOracle.sol
- [ ] IKuyayVault.sol
- [ ] ICircleFactory.sol

### Deployment
- [ ] RiskOracle deployed
- [ ] KuyayVault deployed
- [ ] CircleFactory deployed
- [ ] CircleSimulator deployed
- [ ] Circle.sol deployed (Solidity)
- [ ] AguayoSBT.sol deployed (Solidity)

### Integration
- [ ] Circle.sol actualizado con addresses de Stylus
- [ ] Frontend ABIs actualizados
- [ ] Frontend contract addresses actualizados

---

**¿Empezamos con RiskOracle y KuyayVault?** 🚀
