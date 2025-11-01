# 🚀 Kuyay Protocol - Checklist de Deployment

## ⚠️ PROBLEMAS CRÍTICOS ENCONTRADOS

### 🔴 **CRÍTICO: VRF Subscription ID está hardcoded como "1"**

**Archivo:** `foundry/script/Deploy.s.sol` línea 21
```solidity
uint64 constant VRF_SUBSCRIPTION_ID = 1; // ❌ ESTO ES INCORRECTO
```

**El número en `.env.example` (91781738...) es un placeholder muy largo.**

---

## ✅ CHECKLIST PRE-DEPLOYMENT

### 1. **Configurar Chainlink VRF** (REQUERIDO)

#### Paso 1.1: Obtener LINK tokens
- [ ] Ve a: https://faucets.chain.link/arbitrum-sepolia
- [ ] Solicita 10 LINK para empezar
- [ ] Verifica que llegaron a tu wallet con: `cast balance <TU_ADDRESS> --rpc-url arbitrum_sepolia --erc20 0xb1D4538B4571d411F07960EF2838Ce337FE1E80E`

#### Paso 1.2: Crear VRF Subscription
- [ ] Ve a: https://vrf.chain.link/arbitrum-sepolia
- [ ] Click en "Create Subscription"
- [ ] Guarda el **Subscription ID** (número corto, ej: 1234)
- [ ] Fondea con al menos 5 LINK

**⚠️ IMPORTANTE:** El Subscription ID será un número simple como `1234`, NO un hash largo.

#### Paso 1.3: Crear archivo `.env`
```bash
cd foundry
cp .env.example .env
nano .env  # O usa tu editor favorito
```

Edita y actualiza:
```bash
# Tu private key (NUNCA commitear!)
PRIVATE_KEY=0xtu_private_key_aqui

# RPC de Arbitrum Sepolia (puedes usar el público)
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# API Key de Arbiscan (para verificar contratos)
# Obtener en: https://arbiscan.io/myapikey
ARBISCAN_API_KEY=tu_api_key_aqui

# Chainlink VRF - ACTUALIZAR CON TUS VALORES REALES
VRF_SUBSCRIPTION_ID=1234  # ⬅️ TU NÚMERO REAL AQUÍ (corto!)
VRF_COORDINATOR_ADDRESS=0x50d47e4142598E17717B3E7eAe675191BDbf99ec  # ✅ Correcto
VRF_KEY_HASH=0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414  # ✅ Correcto
```

---

### 2. **Actualizar Deploy Script** (REQUERIDO)

**Necesitas cambiar `Deploy.s.sol` para que lea el `.env`:**

```solidity
// ❌ ANTES (línea 21):
uint64 constant VRF_SUBSCRIPTION_ID = 1;

// ✅ DESPUÉS:
uint64 VRF_SUBSCRIPTION_ID;

// Y en la función run(), ANTES de startBroadcast:
function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    VRF_SUBSCRIPTION_ID = uint64(vm.envUint("VRF_SUBSCRIPTION_ID")); // ⬅️ AGREGAR ESTA LÍNEA
    address deployer = vm.addr(deployerPrivateKey);

    // ... resto del código
}
```

---

### 3. **Verificar Configuración**

```bash
# Verificar que tu wallet tiene fondos
cast balance <TU_ADDRESS> --rpc-url arbitrum_sepolia

# Verificar conexión RPC
cast block-number --rpc-url arbitrum_sepolia

# Verificar que la key funciona
cast wallet address --private-key $PRIVATE_KEY
```

Mínimo necesario:
- [ ] 0.01 ETH (para gas de deployment)
- [ ] 5 LINK (en la VRF subscription)

---

### 4. **Compilar y Testear Localmente**

```bash
cd foundry

# Compilar contratos
forge build

# Correr tests
forge test -vvv

# Ver coverage
forge coverage
```

Verificar:
- [ ] Build exitoso sin errores
- [ ] Tests pasando (mínimo 95%+)
- [ ] Coverage razonable

---

## 🚀 PROCESO DE DEPLOYMENT

### Paso 1: Dry Run (Simulación)
```bash
# Simular sin hacer broadcast
forge script script/Deploy.s.sol \
  --rpc-url arbitrum_sepolia \
  --private-key $PRIVATE_KEY
```

- [ ] Verifica que no hay errores
- [ ] Revisa los gas estimates
- [ ] Confirma las direcciones

---

### Paso 2: Deploy Real
```bash
# Deploy en Arbitrum Sepolia
forge script script/Deploy.s.sol \
  --rpc-url arbitrum_sepolia \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY \
  -vvvv
```

**⏱️ Esto tomará ~5-10 minutos**

Guarda las direcciones que aparezcan en la consola:
```
✅ AguayoSBT:      0x...
✅ KuyayVault:     0x...
✅ RiskOracle:     0x...
✅ CircleFactory:  0x...
```

---

### Paso 3: **CRÍTICO - Agregar Consumer a VRF**

**⚠️ Sin este paso, el sorteo NO FUNCIONARÁ**

1. Ve a: https://vrf.chain.link/arbitrum-sepolia
2. Click en tu subscription
3. Click "Add Consumer"
4. Pega la dirección de **CircleFactory** (NO Circle individual)
5. Confirma la transacción

- [ ] Consumer agregado
- [ ] Transacción confirmada
- [ ] CircleFactory aparece en la lista de consumers

---

### Paso 4: Verificar Deployment

```bash
# Verificar que AguayoSBT está deployado
cast call <AGUAYO_ADDRESS> "name()(string)" --rpc-url arbitrum_sepolia
# Debe retornar: "Aguayo Digital"

# Verificar que CircleFactory tiene las direcciones correctas
cast call <FACTORY_ADDRESS> "aguayoSBT()(address)" --rpc-url arbitrum_sepolia

# Verificar que VRF está configurado
cast call <FACTORY_ADDRESS> "vrfCoordinator()(address)" --rpc-url arbitrum_sepolia
cast call <FACTORY_ADDRESS> "subscriptionId()(uint64)" --rpc-url arbitrum_sepolia
```

---

### Paso 5: Actualizar Frontend

Edita `kuyay-frontend/lib/contracts/addresses.ts`:

```typescript
export const CONTRACTS = {
  arbitrumSepolia: {
    chainId: 421614,
    aguayoSBT: "0x...",      // ⬅️ Pegar dirección real
    circleFactory: "0x...",  // ⬅️ Pegar dirección real
    vault: "0x...",          // ⬅️ Pegar dirección real
    riskOracle: "0x...",     // ⬅️ Pegar dirección real
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // ✅ Correcto
  },
}
```

---

### Paso 6: Copiar ABIs al Frontend

```bash
# Desde la raíz del proyecto
cd foundry

# Copiar ABIs (necesitas crear este script o hacerlo manual)
cp out/AguayoSBT.sol/AguayoSBT.json ../kuyay-frontend/lib/contracts/abis/AguayoSBT.json
cp out/CircleFactory.sol/CircleFactory.json ../kuyay-frontend/lib/contracts/abis/CircleFactory.json
cp out/Circle.sol/Circle.json ../kuyay-frontend/lib/contracts/abis/Circle.json
cp out/KuyayVault.sol/KuyayVault.json ../kuyay-frontend/lib/contracts/abis/KuyayVault.json
```

**O mejor, extrae solo los ABIs necesarios en `kuyay-frontend/lib/contracts/abis.ts`**

---

## 🧪 TESTING POST-DEPLOYMENT

### Test 1: Mintear un Aguayo
```bash
cast send <AGUAYO_ADDRESS> "mintAguayo()" \
  --rpc-url arbitrum_sepolia \
  --private-key $PRIVATE_KEY
```

- [ ] Transacción exitosa
- [ ] Gas usado: ~100k-150k
- [ ] Token ID retornado

### Test 2: Verificar Aguayo
```bash
cast call <AGUAYO_ADDRESS> "userToAguayo(address)(uint256)" <TU_ADDRESS> \
  --rpc-url arbitrum_sepolia
```

- [ ] Retorna tu token ID (>0)

### Test 3: Crear un Circle de prueba
```bash
# Necesitarás aprobar USDC primero, luego llamar a createSavingsCircle
# Esto lo harás desde el frontend o con cast send
```

---

## 📊 MONITOREO

### Verificar contratos en Arbiscan
- [ ] AguayoSBT verificado: https://sepolia.arbiscan.io/address/<AGUAYO_ADDRESS>
- [ ] CircleFactory verificado
- [ ] Código visible y correcto

### Verificar VRF Subscription
- [ ] Ve a tu subscription en https://vrf.chain.link/arbitrum-sepolia
- [ ] Verifica que el balance de LINK no esté en 0
- [ ] Verifica que CircleFactory aparezca como consumer

---

## ⚠️ TROUBLESHOOTING

### Error: "subscription not found"
**Causa:** El VRF_SUBSCRIPTION_ID en Deploy.s.sol no coincide con el real
**Solución:** Verifica el número en https://vrf.chain.link

### Error: "consumer not authorized"
**Causa:** Olvidaste agregar el CircleFactory como consumer
**Solución:** Ve al paso 3 y agrega el consumer

### Error: "insufficient funds"
**Causa:** Tu wallet no tiene suficiente ETH
**Solución:** Obtén ETH de testnet en https://faucet.quicknode.com/arbitrum/sepolia

### VRF no responde después de sorteo
**Causa:** Subscription sin LINK
**Solución:** Fondea con más LINK

---

## 📋 RESUMEN DE COMANDOS

```bash
# 1. Setup
cd foundry
cp .env.example .env
# Editar .env con tus valores

# 2. Compilar
forge build

# 3. Test local
forge test -vvv

# 4. Deploy
forge script script/Deploy.s.sol \
  --rpc-url arbitrum_sepolia \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY

# 5. Agregar consumer en https://vrf.chain.link

# 6. Actualizar frontend con addresses
```

---

## ✅ CHECKLIST FINAL ANTES DE HACKATHON

- [ ] Contratos deployados en Arbitrum Sepolia
- [ ] Contratos verificados en Arbiscan
- [ ] VRF Subscription creada y fondeada (5+ LINK)
- [ ] CircleFactory agregado como VRF consumer
- [ ] Frontend actualizado con addresses reales
- [ ] ABIs copiados al frontend
- [ ] Test de mintear Aguayo exitoso
- [ ] Test de crear Circle exitoso (opcional)
- [ ] Documentation lista
- [ ] Demo preparada

---

## 🎯 TIEMPO ESTIMADO

- Setup VRF: 10 minutos
- Deploy contratos: 10 minutos
- Agregar consumer: 2 minutos
- Actualizar frontend: 5 minutos
- Testing: 10 minutos

**Total: ~40 minutos**

---

## 📞 RECURSOS

- Arbitrum Sepolia Faucet: https://faucet.quicknode.com/arbitrum/sepolia
- Chainlink LINK Faucet: https://faucets.chain.link/arbitrum-sepolia
- VRF Subscription Manager: https://vrf.chain.link/arbitrum-sepolia
- Arbiscan Testnet: https://sepolia.arbiscan.io
- USDC Testnet: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d

---

**🔥 ¡Suerte con el deployment!**
