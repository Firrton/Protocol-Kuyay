# 🚀 Guía Completa de Deployment - Kuyay Protocol Stylus

## 📋 Pre-requisitos

### 1. Instalar cargo-stylus (CLI oficial de Arbitrum)

```bash
cargo install --force cargo-stylus
```

Verificar instalación:
```bash
cargo stylus --version
```

### 2. Fondos en Arbitrum Sepolia Testnet

Necesitas ETH en Arbitrum Sepolia para:
- Gas de deployment (~0.01 ETH por contrato)
- Activación de contratos Stylus

**Faucets:**
- https://faucet.quicknode.com/arbitrum/sepolia
- https://www.alchemy.com/faucets/arbitrum-sepolia

## 🔐 Configuración de Private Key

### Opción 1: Variable de Entorno (MÁS SEGURA)

Crea un archivo `.env` en el directorio raíz del proyecto:

```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/stylus-contracts
touch .env
```

**Contenido de `.env`:**
```env
# Arbitrum Sepolia Testnet
PRIVATE_KEY=tu_private_key_aqui_sin_0x
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# O usa tu propio RPC de Alchemy/Infura
# RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**⚠️ IMPORTANTE:**
- NO incluyas el prefijo `0x` en la private key
- Asegúrate que `.env` esté en `.gitignore`

Verifica `.gitignore`:
```bash
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
```

### Opción 2: Usar Keystore (Más seguro para producción)

```bash
# Crear keystore (te pedirá una contraseña)
cast wallet import deployer --interactive

# Usarás esta cuenta en los deploys
cast wallet list
```

## 📦 Contratos a Deployar

Tu proyecto tiene estos contratos:

```
stylus-contracts/
├── circle-simulator/    ✅ LISTO (52KB)
├── risk-oracle/        ✅ LISTO (89KB)
├── kuyay-vault/        ❌ NECESITA COMPILACIÓN
├── circle-factory/     ❌ NECESITA COMPILACIÓN
└── test-simulator/     ⚠️  SOLO PARA TESTING
```

## 🔄 Orden de Deployment

### Fase 1: Contratos Base (Sin dependencias)

1. **AguayoSBT** (Solidity - ya deployado?)
2. **CircleSimulator** (Stylus)
3. **RiskOracle** (Stylus)

### Fase 2: Contratos que dependen de otros

4. **KuyayVault** (depende de RiskOracle)
5. **CircleFactory** (depende de RiskOracle, Vault, Simulator)

## 📝 Proceso de Deployment Paso a Paso

### PASO 1: Compilar todos los contratos a WASM

```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/stylus-contracts

# CircleSimulator
cd circle-simulator
cargo build --release --target wasm32-unknown-unknown
cd ..

# RiskOracle
cd risk-oracle
cargo build --release --target wasm32-unknown-unknown
cd ..

# KuyayVault (si está listo)
cd kuyay-vault
cargo build --release --target wasm32-unknown-unknown
cd ..
```

### PASO 2: Verificar WASM files

```bash
# Deben existir estos archivos:
ls -lh */target/wasm32-unknown-unknown/release/*.wasm | grep -v "\.d$\|deps"
```

Deberías ver:
```
circle_simulator.wasm    (~52KB)
risk_oracle.wasm         (~89KB)
kuyay_vault.wasm         (esperado ~80KB)
```

### PASO 3: Check validez de contratos (ANTES de deployar)

```bash
# Cargar .env
source .env

# Verificar CircleSimulator
cd circle-simulator
cargo stylus check \
  --wasm-file target/wasm32-unknown-unknown/release/circle_simulator.wasm \
  --endpoint $RPC_URL

# Verificar RiskOracle
cd ../risk-oracle
cargo stylus check \
  --wasm-file target/wasm32-unknown-unknown/release/risk_oracle.wasm \
  --endpoint $RPC_URL
```

**Output esperado:**
```
✅ Program succeeded Stylus onchain activation checks
```

### PASO 4: Deploy CircleSimulator

```bash
cd circle-simulator

cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint $RPC_URL \
  --wasm-file target/wasm32-unknown-unknown/release/circle_simulator.wasm
```

**Output:**
```
deployed code at address: 0x[SIMULATOR_ADDRESS]
activated code at address: 0x[SIMULATOR_ADDRESS]
```

**📝 GUARDA ESTA ADDRESS:** La necesitarás después.

### PASO 5: Deploy RiskOracle

Primero necesitas la address del contrato AguayoSBT:

```bash
# Si ya tienes AguayoSBT deployado en Solidity
export AGUAYO_SBT_ADDRESS=0x...

cd risk-oracle

cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint $RPC_URL \
  --wasm-file target/wasm32-unknown-unknown/release/risk_oracle.wasm
```

**📝 GUARDA ESTA ADDRESS:** `RISK_ORACLE_ADDRESS`

### PASO 6: Inicializar contratos

Después del deploy, necesitas llamar a las funciones `initialize()`:

```javascript
// Usando ethers.js o cast

// 1. Inicializar CircleSimulator
cast send $SIMULATOR_ADDRESS \
  "initialize()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

// 2. Inicializar RiskOracle con la address de AguayoSBT
cast send $RISK_ORACLE_ADDRESS \
  "initialize(address)" $AGUAYO_SBT_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### PASO 7: Configurar RiskOracle (Tiers de leverage)

```bash
# Agregar tier 1: Nivel 1+, 2x leverage, 15% interest
cast send $RISK_ORACLE_ADDRESS \
  "addLeverageTier(uint8,uint256,uint256)" \
  1 \
  200 \
  1500 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Agregar tier 2: Nivel 3+, 3x leverage, 12% interest
cast send $RISK_ORACLE_ADDRESS \
  "addLeverageTier(uint8,uint256,uint256)" \
  3 \
  300 \
  1200 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Agregar tier 3: Nivel 5+, 5x leverage, 10% interest
cast send $RISK_ORACLE_ADDRESS \
  "addLeverageTier(uint8,uint256,uint256)" \
  5 \
  500 \
  1000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## 🧪 Verificación Post-Deployment

### 1. Verificar CircleSimulator

```bash
# Quick test: simular un circle
cast call $SIMULATOR_ADDRESS \
  "quick_simulate(uint8,uint256,uint32)" \
  10 \
  100 \
  1500 \
  --rpc-url $RPC_URL

# Debe retornar: (success_rate, expected_return)
```

### 2. Verificar RiskOracle

```bash
# Ver configuración
cast call $RISK_ORACLE_ADDRESS \
  "aguayo_sbt()" \
  --rpc-url $RPC_URL

cast call $RISK_ORACLE_ADDRESS \
  "min_level_for_credit()" \
  --rpc-url $RPC_URL
```

### 3. Verificar en Arbiscan

```
https://sepolia.arbiscan.io/address/[TU_CONTRACT_ADDRESS]
```

## 📊 Tracking de Addresses Deployadas

Crea un archivo `deployed-addresses.json`:

```json
{
  "network": "arbitrum-sepolia",
  "timestamp": "2025-11-01",
  "contracts": {
    "AguayoSBT": "0x...",
    "CircleSimulator": "0x...",
    "RiskOracle": "0x...",
    "KuyayVault": "0x...",
    "CircleFactory": "0x..."
  }
}
```

## 🔧 Scripts de Deployment Automatizados

### Script 1: Deploy All

Crea `scripts/deploy-all.sh`:

```bash
#!/bin/bash

# Load environment
source .env

echo "🚀 Deploying Kuyay Protocol to Arbitrum Sepolia..."

# Deploy CircleSimulator
echo "📦 Deploying CircleSimulator..."
cd circle-simulator
SIMULATOR_ADDRESS=$(cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint $RPC_URL \
  --wasm-file target/wasm32-unknown-unknown/release/circle_simulator.wasm \
  | grep "deployed code at address:" | awk '{print $5}')

echo "✅ CircleSimulator: $SIMULATOR_ADDRESS"
cd ..

# Deploy RiskOracle
echo "📦 Deploying RiskOracle..."
cd risk-oracle
ORACLE_ADDRESS=$(cargo stylus deploy \
  --private-key $PRIVATE_KEY \
  --endpoint $RPC_URL \
  --wasm-file target/wasm32-unknown-unknown/release/risk_oracle.wasm \
  | grep "deployed code at address:" | awk '{print $5}')

echo "✅ RiskOracle: $ORACLE_ADDRESS"
cd ..

# Save addresses
cat > deployed-addresses.json <<EOF
{
  "network": "arbitrum-sepolia",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "CircleSimulator": "$SIMULATOR_ADDRESS",
    "RiskOracle": "$ORACLE_ADDRESS"
  }
}
EOF

echo ""
echo "✅ Deployment complete!"
echo "📝 Addresses saved to deployed-addresses.json"
```

Hacer ejecutable:
```bash
chmod +x scripts/deploy-all.sh
```

### Script 2: Initialize Contracts

Crea `scripts/initialize-contracts.sh`:

```bash
#!/bin/bash

source .env

# Load deployed addresses
SIMULATOR_ADDRESS=$(jq -r '.contracts.CircleSimulator' deployed-addresses.json)
ORACLE_ADDRESS=$(jq -r '.contracts.RiskOracle' deployed-addresses.json)

echo "🔧 Initializing contracts..."

# Initialize CircleSimulator
echo "Initializing CircleSimulator..."
cast send $SIMULATOR_ADDRESS \
  "initialize()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Initialize RiskOracle
echo "Initializing RiskOracle..."
cast send $ORACLE_ADDRESS \
  "initialize(address)" $AGUAYO_SBT_ADDRESS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

echo "✅ Initialization complete!"
```

## ⚠️ Troubleshooting

### Error: "Failed to activate program"

```bash
# El contrato es muy grande o tiene problemas
# Verificar tamaño:
ls -lh target/wasm32-unknown-unknown/release/*.wasm

# Si es >128KB, optimizar:
cargo build --release --target wasm32-unknown-unknown
wasm-opt -Oz -o optimized.wasm target/wasm32-unknown-unknown/release/*.wasm
```

### Error: "Insufficient funds"

```bash
# Necesitas más ETH en Sepolia
# Obtener de faucet o bridge desde mainnet
```

### Error: "nonce too low"

```bash
# Resetea el nonce manualmente
cast nonce [TU_ADDRESS] --rpc-url $RPC_URL
```

## 💰 Costos Estimados

### Arbitrum Sepolia (Testnet)
- Deploy CircleSimulator: ~0.005 ETH
- Deploy RiskOracle: ~0.008 ETH
- Activation fees: ~0.003 ETH
- **Total: ~0.02 ETH** (gratis con faucets)

### Arbitrum One (Mainnet)
- Deploy CircleSimulator: ~$2-5
- Deploy RiskOracle: ~$3-8
- Activation fees: ~$1-3
- **Total: ~$10-20**

## 📝 Checklist Pre-Deployment

- [ ] `cargo-stylus` instalado
- [ ] ETH en Arbitrum Sepolia
- [ ] `.env` configurado con PRIVATE_KEY y RPC_URL
- [ ] Todos los contratos compilados a WASM
- [ ] `cargo stylus check` pasó para todos
- [ ] Addresses de contratos dependientes (AguayoSBT) conocidas
- [ ] Scripts de deployment creados
- [ ] Plan de inicialización documentado

## 🎯 Next Steps After Deployment

1. Verificar contratos en Arbiscan
2. Exportar ABIs para frontend
3. Actualizar addresses en frontend
4. Ejecutar tests de integración
5. Configurar monitoring (eventos, gas usage)
6. Documentar para el equipo

---

## 📞 Comandos Útiles

```bash
# Ver balance
cast balance [ADDRESS] --rpc-url $RPC_URL

# Ver bytecode deployado
cast code $SIMULATOR_ADDRESS --rpc-url $RPC_URL

# Llamar función view
cast call $ADDRESS "functionName()" --rpc-url $RPC_URL

# Enviar transacción
cast send $ADDRESS "functionName(args)" --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Ver logs de transacción
cast receipt [TX_HASH] --rpc-url $RPC_URL

# Exportar ABI
cargo stylus export-abi
```

## 🔗 Links Útiles

- Arbitrum Sepolia Explorer: https://sepolia.arbiscan.io
- Stylus Docs: https://docs.arbitrum.io/stylus
- Faucet: https://faucet.quicknode.com/arbitrum/sepolia
- RPC: https://sepolia-rollup.arbitrum.io/rpc

---

**¿Todo listo? Ejecuta:**

```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/stylus-contracts
source .env
./scripts/deploy-all.sh
```
