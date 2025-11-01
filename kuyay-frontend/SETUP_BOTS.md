# 🤖 Guía de Setup: NPCs con Wallets Reales para Demo Blockchain

Esta guía te llevará paso a paso para configurar wallets de NPCs (bots) que puedan hacer transacciones reales en Arbitrum Sepolia testnet.

## 📋 Resumen

Los NPCs te permitirán jugar un demo completo del protocolo Kuyay donde:
- **TÚ** haces transacciones REALES (mintear Aguayo, crear círculo, pagar cuotas)
- **Los BOTS** completan automáticamente el círculo y hacen sus pagos/check-ins
- Todo funciona en blockchain real (Arbitrum Sepolia testnet)

---

## 🚀 Paso 1: Generar Wallets de Bots

Ejecuta el siguiente comando en tu terminal:

```bash
npm run generate-bots
```

Esto generará 5 wallets con sus **private keys**. Verás algo como:

```
Alice:
  Address: 0x1234...5678
  Private Key: 0xabcd...ef01

Bob:
  Address: 0x5678...9abc
  Private Key: 0x1234...5678

...
```

### ⚠️ **IMPORTANTE**
- Estas private keys son SOLO para TESTNET
- NUNCA las uses en mainnet
- NUNCA pongas fondos reales en estas wallets

---

## 💰 Paso 2: Conseguir ETH de Testnet (para gas)

Cada wallet necesita ETH para pagar el gas de las transacciones.

### Faucet de Arbitrum Sepolia

1. Ve a: **https://www.alchemy.com/faucets/arbitrum-sepolia**
2. Para cada una de las 5 direcciones generadas:
   - Pega la dirección en el faucet
   - Solicita **0.1 ETH**
   - Espera la confirmación

### Alternativas de Faucets

- https://faucet.quicknode.com/arbitrum/sepolia
- https://www.l2faucet.com/arbitrum

---

## 💵 Paso 3: Conseguir USDC de Testnet

Los bots necesitan USDC para hacer los pagos en los círculos.

### Circle USDC Faucet

1. Ve a: **https://faucet.circle.com/**
2. Selecciona **"Arbitrum Sepolia"** en el dropdown
3. Para cada una de las 5 direcciones:
   - Pega la dirección
   - Solicita **1000 USDC** (o el máximo permitido)
   - Espera la confirmación

### ¿Cuánto USDC necesito?

Para un círculo típico de demo:
- Cuota: 150 USDC
- Garantía: 300 USDC
- **Total por bot: ~500 USDC**

Solicita al menos **1000 USDC por wallet** para tener margen.

---

## 🔐 Paso 4: Configurar las Private Keys

1. Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

2. Abre `.env.local` y pega las **private keys** que generaste en el Paso 1:

```env
# Bot 1
NEXT_PUBLIC_BOT_1_NAME=Alice
BOT_1_PRIVATE_KEY=0x... (pega la private key de Alice aquí)

# Bot 2
NEXT_PUBLIC_BOT_2_NAME=Bob
BOT_2_PRIVATE_KEY=0x... (pega la private key de Bob aquí)

# Bot 3
NEXT_PUBLIC_BOT_3_NAME=Charlie
BOT_3_PRIVATE_KEY=0x... (pega la private key de Charlie aquí)

# Bot 4
NEXT_PUBLIC_BOT_4_NAME=Diana
BOT_4_PRIVATE_KEY=0x... (pega la private key de Diana aquí)

# Bot 5
NEXT_PUBLIC_BOT_5_NAME=Eve
BOT_5_PRIVATE_KEY=0x... (pega la private key de Eve aquí)
```

3. Guarda el archivo.

---

## ✅ Paso 5: Verificar los Balances

Verifica que todas las wallets tengan fondos:

```bash
npm run check-bot-balances
```

Deberías ver algo como:

```
Alice (0x1234...5678):
  ETH: 0.1 ETH
  USDC: 1000 USDC

Bob (0x5678...9abc):
  ETH: 0.1 ETH
  USDC: 1000 USDC

...
```

### ¿Qué verificar?

- ✅ Cada wallet tiene **al menos 0.05 ETH**
- ✅ Cada wallet tiene **al menos 500 USDC**

Si alguna wallet tiene menos, vuelve a los Pasos 2 y 3.

---

## 🎮 Paso 6: ¡Listo para Jugar!

Ahora puedes usar el **Demo Blockchain** con NPCs reales:

1. **Inicia el servidor**:
   ```bash
   npm run dev
   ```

2. **Ve al Dashboard**: http://localhost:3000/dashboard

3. **Haz clic en el botón "🔗 Demo Blockchain"** (abajo a la derecha)

4. **Inicia el demo**:
   - Si ya tienes Aguayo, saltará el paso de minteo
   - Si no, minteará uno automáticamente

5. **El flujo completo**:
   - 🧵 **Mintear Aguayo** (si no tienes uno)
   - 🏔️ **Crear Círculo** - TÚ creas el círculo, los bots se unen automáticamente
   - 💰 **Hacer Pago** - TÚ pagas, luego los bots pagan automáticamente
   - ✋ **Check-in** - TÚ haces check-in, los bots también
   - 🎲 **Sorteo** - Chainlink VRF selecciona un ganador
   - 🎉 **Distribución** - El pozo se distribuye al ganador

---

## 🔧 Troubleshooting

### Los bots no tienen fondos

```bash
# Verifica los balances
npm run check-bot-balances

# Si alguna wallet está vacía, vuelve a los Pasos 2 y 3
```

### Error: "Cannot read private key"

- Asegúrate de que el archivo `.env.local` exista
- Verifica que las private keys estén copiadas correctamente (deben empezar con `0x`)
- Reinicia el servidor de desarrollo

### Las transacciones fallan

- Verifica que las wallets tengan ETH suficiente para gas
- Asegúrate de estar en Arbitrum Sepolia testnet
- Revisa la consola del navegador para ver errores específicos

---

## 📊 Arquitectura del Sistema

```
Usuario Real (TÚ)
    ↓
[Wallet Personal] → Transacciones REALES en blockchain
    ↓
Círculo Kuyay
    ↓
[Bot Wallet 1] → Alice (Auto-paga)
[Bot Wallet 2] → Bob (Auto-paga)
[Bot Wallet 3] → Charlie (Auto-paga)
[Bot Wallet 4] → Diana (Auto-paga)
[Bot Wallet 5] → Eve (Auto-paga)
```

---

## 🎯 Próximos Pasos

Una vez que todo funcione:

1. **Prueba el flujo completo** varias veces
2. **Experimenta con diferentes configuraciones** (cuotas, garantías)
3. **Observa las transacciones** en Arbiscan Sepolia
4. **¡Muestra tu demo en el hackathon!** 🚀

---

## 🆘 Necesitas Ayuda?

Si tienes problemas:

1. Revisa los logs en la consola del navegador
2. Verifica los balances de las wallets
3. Asegúrate de estar conectado a Arbitrum Sepolia
4. Revisa que `.env.local` esté configurado correctamente

---

## ⚠️ Recordatorio de Seguridad

- ✅ Estas wallets son SOLO para testnet (Arbitrum Sepolia)
- ❌ NUNCA uses estas private keys en mainnet
- ❌ NUNCA pongas fondos reales en estas wallets
- ✅ `.env.local` está en `.gitignore` (no se subirá a GitHub)

---

¡Feliz testing! 🎉
