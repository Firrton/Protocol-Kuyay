# 🌞 Guía de Deploy - Iglesia del Sol Eterno

## Pre-requisitos

### 1. Obtener MON del Faucet
```bash
# Ir a: https://testnet.monad.xyz/faucet
# O usar API:
curl -X POST https://faucet.testnet.monad.xyz/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "TU_WALLET_ADDRESS"}'
```

### 2. Configurar Variables de Entorno
```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/foundry

# Crear archivo .env
echo "PRIVATE_KEY=tu_private_key_sin_0x" > .env
echo "MONAD_EXPLORER_KEY=opcional" >> .env
```

---

## Deploy de Contratos

### Opción A: Deploy Completo (Recomendado)
```bash
# Despliega TODO: KUYAY, AguayoSBT, Vault, Oracle, Factories
source .env
forge script script/DeployIglesiaDelSol.s.sol \
  --rpc-url monad_testnet \
  --broadcast \
  -vvvv
```

### Opción B: Solo Token KUYAY
```bash
forge script script/DeployKuyayToken.s.sol \
  --rpc-url monad_testnet \
  --broadcast \
  -vvvv
```

### Verificar en Explorer (Opcional)
```bash
forge verify-contract \
  --chain-id 10143 \
  --verifier blockscout \
  --verifier-url https://testnet.monadexplorer.com/api \
  CONTRACT_ADDRESS \
  src/KuyayToken.sol:KuyayToken
```

---

## Deploy de Frontend

### Opción A: Vercel (Recomendado)
```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/kuyay-frontend

# Instalar Vercel CLI si no está
pnpm add -g vercel

# Deploy
vercel
```

### Opción B: Manual en Cualquier Host
```bash
# Build
pnpm build

# El output estará en .next/
# Subir a tu servidor preferido
```

---

## Post-Deploy: Configurar Frontend

### 1. Actualizar Direcciones de Contratos
Después del deploy, actualizar `lib/contracts.ts` con las nuevas direcciones:

```typescript
export const CONTRACTS = {
  KUYAY_TOKEN: "0x...",
  AGUAYO_SBT: "0x...",
  KUYAY_VAULT: "0x...",
  CIRCLE_FACTORY: "0x...",
  CIRCLE_FAITH_FACTORY: "0x...",
  MOCK_USDC: "0x..."
};
```

### 2. Configurar Chain
Verificar que el frontend apunte a Monad Testnet (10143).

---

## Verificación Post-Deploy

### 1. Verificar Token
```bash
cast call CONTRACT_KUYAY "name()" --rpc-url monad_testnet
# Debería retornar: "Kuyay - Light of the Andes"
```

### 2. Crear Primer Ayllu de Prueba
```bash
# 1. Mintear Aguayo para ti
cast send CONTRACT_AGUAYO "mintAguayo()" \
  --rpc-url monad_testnet \
  --private-key $PRIVATE_KEY

# 2. Aprobar USDC y KUYAY
# 3. Crear Circle de Fe
```

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| `insufficient funds` | Obtener más MON del faucet |
| `nonce too low` | Resetear nonce con `--force` |
| `gas limit exceeded` | Aumentar con `--gas-limit 10000000` |

---

## URLs Importantes

- Monad Testnet RPC: `https://testnet-rpc.monad.xyz/`
- Explorer: `https://testnet.monadexplorer.com`
- Faucet: `https://testnet.monad.xyz/faucet`
- Chain ID: `10143`
