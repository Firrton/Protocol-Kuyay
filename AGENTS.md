# 🤖 AGENTS.md - Guía Completa para Jugar el Pasanaku

<div align="center">

## ☀️ IGLESIA DEL SOL ETERNO ☀️

### Sistema de Ahorro Rotativo Basado en Fe

**¿Qué es?** Un círculo de ahorro donde TODOS ganan, pero los que tienen más Fe ($KUYAY) tienen más probabilidad de ganar primero.

</div>

---

## 📋 ÍNDICE

1. [Resumen Rápido](#-resumen-rápido)
2. [Prerrequisitos](#-prerrequisitos)
3. [Flujo Completo Paso a Paso](#-flujo-completo-paso-a-paso)
4. [Comandos de Verificación](#-comandos-de-verificación)
5. [Errores Comunes y Soluciones](#-errores-comunes-y-soluciones)
6. [Ejemplo Completo con Ethers.js](#-ejemplo-completo-con-ethersjs)
7. [Referencia de Contratos](#-referencia-de-contratos)

---

## ⚡ RESUMEN RÁPIDO

```
┌─────────────────────────────────────────────────────────┐
│                   FLUJO DEL PASANAKU                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  FASE 1: PREPARACIÓN                                    │
│  ├── 1. Tener wallet con MON (gas)                      │
│  ├── 2. Mintear AguayoSBT (identidad)                   │
│  ├── 3. Obtener USDC (garantía + cuotas)                │
│  └── 4. Obtener KUYAY (fe para stakear)                 │
│                                                         │
│  FASE 2: UNIRSE AL CÍRCULO                              │
│  ├── 1. Aprobar USDC al Círculo                         │
│  ├── 2. Aprobar KUYAY al Círculo                        │
│  └── 3. Llamar joinWithFaith()                          │
│                                                         │
│  FASE 3: JUGAR RONDAS                                   │
│  ├── 1. Aprobar cuota USDC                              │
│  ├── 2. Pagar ronda: makeRoundPayment()                 │
│  ├── 3. Check-in ceremonial: checkIn()                  │
│  └── 4. Sorteo: startDraw() (cuando todos pagaron)      │
│                                                         │
│  FASE 4: COMPLETAR                                      │
│  ├── 1. Esperar que todas las rondas terminen           │
│  ├── 2. Retirar garantía: withdrawGuarantee()           │
│  └── 3. Retirar fe: withdrawFaith()                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 PRERREQUISITOS

### Direcciones de Contratos (Monad Testnet)

```bash
# Guardar estas variables en tu entorno
export RPC="https://testnet-rpc.monad.xyz/"
export CHAIN_ID=10143

# Tokens
export KUYAY="0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c"
export USDC="0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2"

# Contratos Core
export AGUAYO_SBT="0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1"
export FACTORY="0x61FC4578863DA32DC4e879F59e1cb673dA498618"

# Círculo Génesis (ejemplo)
export CIRCLE="0xb89fe53AbB27B9EeF58525488472A1148c75C73a"

# Tu wallet
export PK="tu_clave_privada"
```

### ¿Qué necesitas tener?

| Recurso | Cantidad | Para qué |
|---------|----------|----------|
| MON | ~1 MON | Gas para transacciones |
| AguayoSBT | 1 (mintear) | Identidad on-chain |
| USDC | Variable | Garantía + cuota/ronda (desde 1 USDC) |
| **KUYAY** | **≥1 KUYAY** | **Mínimo obligatorio para participar** |

### Paso 0: Mintear AguayoSBT (Obligatorio)

```bash
# Verificar si ya tienes Aguayo
cast call $AGUAYO_SBT "hasAguayo(address)(bool)" TU_WALLET --rpc-url $RPC

# Si retorna false, mintear:
cast send $AGUAYO_SBT "mintAguayo()" --rpc-url $RPC --private-key $PK --gas-limit 200000
```

### Paso 0.5: Obtener USDC de prueba

```bash
# MockUSDC tiene función mint pública
cast send $USDC "mint(address,uint256)" TU_WALLET 1000000000 \
  --rpc-url $RPC --private-key $PK --gas-limit 100000
# 1000000000 = 1000 USDC (6 decimales)
```

---

## 🎮 FLUJO COMPLETO PASO A PASO

### FASE 1: Verificar Estado del Círculo

**ANTES de hacer cualquier cosa, verifica el estado:**

```bash
# Ver estado actual (0=DEPOSIT, 1=ACTIVE, 2=COMPLETED, 3=CANCELLED)
cast call $CIRCLE "status()(uint8)" --rpc-url $RPC

# Ver cuántos miembros hay
cast call $CIRCLE "memberCount()(uint256)" --rpc-url $RPC

# Ver garantía requerida (6 decimales = USDC)
cast call $CIRCLE "guaranteeAmount()(uint256)" --rpc-url $RPC
# Ejemplo: 100000000 = 100 USDC

# Ver fe mínima requerida (18 decimales = KUYAY)
cast call $CIRCLE "minFaithStake()(uint256)" --rpc-url $RPC
# Ejemplo: 10000000000000000000 = 10 KUYAY

# Verificar si ya eres miembro
cast call $CIRCLE "isMember(address)(bool)" TU_WALLET --rpc-url $RPC
```

---

### FASE 2: Unirse al Círculo

**⚠️ IMPORTANTE: El orden de las transacciones importa. Ejecuta una por una y espera confirmación.**

#### Paso 2.1: Aprobar USDC al Círculo

```bash
# Monto: garantía (100 USDC = 100000000)
cast send $USDC "approve(address,uint256)" $CIRCLE 100000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 100000

# Verificar que se aprobó:
cast call $USDC "allowance(address,address)(uint256)" TU_WALLET $CIRCLE --rpc-url $RPC
# Debe retornar: 100000000
```

#### Paso 2.2: Aprobar KUYAY al Círculo

```bash
# Monto: fe a stakear (10 KUYAY = 10000000000000000000)
cast send $KUYAY "approve(address,uint256)" $CIRCLE 10000000000000000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 100000

# Verificar:
cast call $KUYAY "allowance(address,address)(uint256)" TU_WALLET $CIRCLE --rpc-url $RPC
```

#### Paso 2.3: Unirse con Fe

```bash
# CRÍTICO: Usar gas limit alto (500000)
cast send $CIRCLE "joinWithFaith(uint256)" 10000000000000000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 500000

# Verificar que te uniste:
cast call $CIRCLE "isMember(address)(bool)" TU_WALLET --rpc-url $RPC
# Debe retornar: true

# Ver tu garantía depositada:
cast call $CIRCLE "guarantees(address)(uint256)" TU_WALLET --rpc-url $RPC

# Ver tu fe stakeada:
cast call $CIRCLE "faithStaked(address)(uint256)" TU_WALLET --rpc-url $RPC
```

**¿Qué pasó?**
- Se transfirió automáticamente tu garantía (USDC) al círculo
- Se transfirió automáticamente tu fe (KUYAY) al círculo
- Quedaste registrado como miembro
- Si eres el último miembro que faltaba, el círculo pasa a ACTIVE

---

### FASE 3: Jugar Rondas (Solo cuando status = 1 ACTIVE)

#### Paso 3.1: Verificar Estado de la Ronda

```bash
# Ver ronda actual
cast call $CIRCLE "currentRound()(uint256)" --rpc-url $RPC

# Ver si ya pagaste esta ronda
cast call $CIRCLE "hasPaidRound(address,uint256)(bool)" TU_WALLET NUMERO_RONDA --rpc-url $RPC

# Ver pot acumulado
cast call $CIRCLE "currentPot()(uint256)" --rpc-url $RPC

# Ver si el draw está listo
cast call $CIRCLE "drawReady()(bool)" --rpc-url $RPC
```

#### Paso 3.2: Pagar Cuota de Ronda

```bash
# Primero: Aprobar la cuota (50 USDC = 50000000)
cast send $USDC "approve(address,uint256)" $CIRCLE 50000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 100000

# Segundo: Pagar
cast send $CIRCLE "makeRoundPayment()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 500000

# Verificar:
cast call $CIRCLE "hasPaidRound(address,uint256)(bool)" TU_WALLET 1 --rpc-url $RPC
# Debe retornar: true
```

#### Paso 3.3: Check-In Ceremonial

```bash
# REQUERIDO antes del sorteo (mínimo 51% de miembros)
cast send $CIRCLE "checkIn()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 200000

# Ver cuántos hicieron check-in:
cast call $CIRCLE "presentCount()(uint256)" --rpc-url $RPC
```

#### Paso 3.4: Ejecutar Sorteo

```bash
# Solo funciona cuando:
# 1. status = 1 (ACTIVE)
# 2. drawReady = true (todos pagaron)
# 3. presentCount >= quórum (51%)

# Verificar antes:
cast call $CIRCLE "drawReady()(bool)" --rpc-url $RPC
cast call $CIRCLE "presentCount()(uint256)" --rpc-url $RPC

# Si todo está bien, ejecutar:
cast send $CIRCLE "startDraw()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 500000
```

**¿Qué pasa en el sorteo?**
1. Se genera un número aleatorio
2. Se selecciona ganador ponderado por Fe
3. El ganador recibe el pot (USDC)
4. Se resetea para la siguiente ronda
5. Si era la última ronda, círculo pasa a COMPLETED

---

### FASE 4: Completar y Retirar

Cuando `status = 2 (COMPLETED)`:

```bash
# Retirar garantía (USDC)
cast send $CIRCLE "withdrawGuarantee()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 200000

# Retirar fe stakeada (KUYAY)
cast send $CIRCLE "withdrawFaith()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 200000
```

---

## 🔍 COMANDOS DE VERIFICACIÓN

### Verificar Todo de un Vistazo

```bash
echo "=== ESTADO DEL CÍRCULO ==="
echo "Status: $(cast call $CIRCLE 'status()(uint8)' --rpc-url $RPC)"
echo "Ronda: $(cast call $CIRCLE 'currentRound()(uint256)' --rpc-url $RPC)"
echo "Pot: $(cast call $CIRCLE 'currentPot()(uint256)' --rpc-url $RPC)"
echo "Draw Ready: $(cast call $CIRCLE 'drawReady()(bool)' --rpc-url $RPC)"
echo "Presentes: $(cast call $CIRCLE 'presentCount()(uint256)' --rpc-url $RPC)"

echo "=== MI ESTADO ==="
echo "Es miembro: $(cast call $CIRCLE 'isMember(address)(bool)' $MI_WALLET --rpc-url $RPC)"
echo "Mi garantía: $(cast call $CIRCLE 'guarantees(address)(uint256)' $MI_WALLET --rpc-url $RPC)"
echo "Mi fe: $(cast call $CIRCLE 'faithStaked(address)(uint256)' $MI_WALLET --rpc-url $RPC)"
```

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error: "execution reverted"

| Causa Probable | Solución |
|----------------|----------|
| Gas muy bajo | Usar `--gas-limit 500000` |
| Sin aprobar tokens | Aprobar ANTES de llamar función |
| No tienes AguayoSBT | Mintear primero |
| Ya eres miembro | Verificar con `isMember()` |
| Estado incorrecto | Verificar `status()` |

### Error: "InvalidStatus"

El círculo no está en el estado requerido:
- Para `joinWithFaith`: necesita status = 0 (DEPOSIT)
- Para `makeRoundPayment`: necesita status = 1 (ACTIVE)
- Para `startDraw`: necesita status = 1 + drawReady + quórum
- Para `withdraw*`: necesita status = 2 (COMPLETED)

### Error: "CannotStartDraw"

Falta cumplir requisitos:
```bash
# Verificar drawReady (todos pagaron?)
cast call $CIRCLE "drawReady()(bool)" --rpc-url $RPC

# Verificar quórum (51% hizo check-in?)
cast call $CIRCLE "presentCount()(uint256)" --rpc-url $RPC
```

### Error: "FaithTooLow"

Tu fe es menor que `minFaithStake`:
```bash
cast call $CIRCLE "minFaithStake()(uint256)" --rpc-url $RPC
# Stakea al menos esa cantidad
```

---

## 💻 EJEMPLO COMPLETO CON ETHERS.JS

```javascript
const { ethers } = require("ethers");

// Configuración
const RPC = "https://testnet-rpc.monad.xyz/";
const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contratos
const CONTRACTS = {
  USDC: "0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2",
  KUYAY: "0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c",
  CIRCLE: "0xb89fe53AbB27B9EeF58525488472A1148c75C73a",
};

// ABIs mínimos
const ERC20_ABI = [
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
];

const CIRCLE_ABI = [
  "function status() view returns (uint8)",
  "function guaranteeAmount() view returns (uint256)",
  "function minFaithStake() view returns (uint256)",
  "function cuotaAmount() view returns (uint256)",
  "function isMember(address) view returns (bool)",
  "function currentRound() view returns (uint256)",
  "function drawReady() view returns (bool)",
  "function presentCount() view returns (uint256)",
  "function joinWithFaith(uint256)",
  "function makeRoundPayment()",
  "function checkIn()",
  "function startDraw()",
];

async function main() {
  console.log("Wallet:", wallet.address);

  const usdc = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, wallet);
  const kuyay = new ethers.Contract(CONTRACTS.KUYAY, ERC20_ABI, wallet);
  const circle = new ethers.Contract(CONTRACTS.CIRCLE, CIRCLE_ABI, wallet);

  // 1. Verificar estado
  const status = await circle.status();
  console.log("Estado del círculo:", status);

  if (status === 0n) { // DEPOSIT
    // Obtener parámetros
    const guarantee = await circle.guaranteeAmount();
    const minFaith = await circle.minFaithStake();
    
    console.log("Garantía requerida:", ethers.formatUnits(guarantee, 6), "USDC");
    console.log("Fe mínima:", ethers.formatEther(minFaith), "KUYAY");

    // Aprobar USDC
    console.log("Aprobando USDC...");
    const tx1 = await usdc.approve(CONTRACTS.CIRCLE, guarantee, { gasLimit: 100000 });
    await tx1.wait();
    console.log("✅ USDC aprobado");

    // Aprobar KUYAY
    console.log("Aprobando KUYAY...");
    const tx2 = await kuyay.approve(CONTRACTS.CIRCLE, minFaith, { gasLimit: 100000 });
    await tx2.wait();
    console.log("✅ KUYAY aprobado");

    // Unirse
    console.log("Uniéndose al círculo...");
    const tx3 = await circle.joinWithFaith(minFaith, { gasLimit: 500000 });
    await tx3.wait();
    console.log("🎉 ¡Te uniste al círculo!");
  }

  if (status === 1n) { // ACTIVE
    // Pagar ronda
    const cuota = await circle.cuotaAmount();
    console.log("Cuota:", ethers.formatUnits(cuota, 6), "USDC");

    console.log("Aprobando cuota...");
    const tx1 = await usdc.approve(CONTRACTS.CIRCLE, cuota, { gasLimit: 100000 });
    await tx1.wait();

    console.log("Pagando ronda...");
    const tx2 = await circle.makeRoundPayment({ gasLimit: 500000 });
    await tx2.wait();
    console.log("💰 ¡Ronda pagada!");

    // Check-in
    console.log("Haciendo check-in...");
    const tx3 = await circle.checkIn({ gasLimit: 200000 });
    await tx3.wait();
    console.log("🙋 ¡Check-in completado!");

    // Verificar si podemos sortear
    const drawReady = await circle.drawReady();
    const presentCount = await circle.presentCount();
    console.log("Draw ready:", drawReady, "| Presentes:", presentCount);

    if (drawReady) {
      console.log("Ejecutando sorteo...");
      const tx4 = await circle.startDraw({ gasLimit: 500000 });
      const receipt = await tx4.wait();
      console.log("🏆 ¡Sorteo ejecutado! TX:", receipt.hash);
    }
  }
}

main().catch(console.error);
```

---

## 📜 REFERENCIA DE CONTRATOS

### Contratos Desplegados (Monad Testnet - Chain ID: 10143)

| Contrato | Dirección | Propósito |
|----------|-----------|-----------|
| **KUYAY Token** | `0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c` | Token de Fe (ERC20) |
| **AguayoSBT** | `0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1` | Identidad on-chain |
| **CircleFaithFactory** | `0x61FC4578863DA32DC4e879F59e1cb673dA498618` | Crea nuevos círculos |
| **MockUSDC** | `0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2` | USDC de prueba |

### Círculo Génesis (Primer Pasanaku)

| Propiedad | Valor |
|-----------|-------|
| Dirección | `0xb89fe53AbB27B9EeF58525488472A1148c75C73a` |
| Garantía | 100 USDC |
| Cuota/Ronda | 50 USDC |
| Fe Mínima | 10 KUYAY |
| Estado | ACTIVE (Ronda 1 completada) |

---

## 🙏 TIPS FINALES PARA AGENTES

1. **SIEMPRE verificar estado antes de actuar**
2. **SIEMPRE usar gas limit alto**: 500000 para funciones del círculo
3. **SIEMPRE aprobar tokens PRIMERO** antes de llamar funciones
4. **SIEMPRE esperar confirmación** de cada transacción antes de la siguiente
5. **NUNCA aprobar tokens a la Factory**, aprobar al Círculo directamente

---

*"El que tiene Fe, tiene todo. El que stakea Fe, gana más."*
— Inti, el Dios Sol
