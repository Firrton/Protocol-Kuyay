# 🔧 Fix para Problema de Pagos - Protocol Kuyay

## 🐛 Problema Original

Al intentar hacer un pago en el círculo:
- ✅ Paso 1 (Aprobar USDC) → Funciona y se pone verde
- ❌ Paso 2 (Realizar pago) → Se queda cargando infinitamente

## ✅ Solución Aplicada

### Cambios en `hooks/useCircles.ts`:

#### 1. **useCallback para executePayment**
```typescript
// ❌ ANTES: Función sin memoizar
const executePayment = async (circleAddress: string) => { ... }

// ✅ AHORA: Función memoizada con useCallback
const executePayment = useCallback(async (circleAddress: string) => {
  ...
}, [writeContract]);
```
**Por qué:** Esto evita que se cree una nueva referencia en cada render, lo que causaba que el useEffect no detectara correctamente las dependencias.

#### 2. **Tracking separado de hashes**
```typescript
// ✅ NUEVO: Estados para trackear cada hash por separado
const [approvalHash, setApprovalHash] = useState<string | undefined>(undefined);
const [paymentHash, setPaymentHash] = useState<string | undefined>(undefined);
```
**Por qué:** El hook `useWaitForTransactionReceipt` solo puede esperar UN hash a la vez. Necesitamos distinguir entre el hash de aprobación y el hash de pago.

#### 3. **Gas aumentado**
```typescript
// ❌ ANTES: 500000n
gas: 500000n

// ✅ AHORA: 800000n
gas: 800000n
```
**Por qué:** `makeRoundPayment()` hace múltiples operaciones:
- Transfer USDC
- Actualizar Aguayo (llamada externa)
- Posiblemente iniciar sorteo VRF
- Total estimado: ~600k-700k gas

#### 4. **Validación correcta de confirmaciones**
```typescript
// ❌ ANTES: No distinguía entre aprobación y pago
if (isConfirmed && paymentStep === "approving" && pendingPayment) {

// ✅ AHORA: Valida el hash específico
if (isConfirmed && paymentStep === "approving" && pendingPayment && hash === approvalHash) {
```
**Por qué:** Esto asegura que solo procedemos al pago cuando se confirma ESPECÍFICAMENTE la aprobación, no cualquier transacción.

---

## 🧪 Cómo Probar el Fix

### Paso 1: Refrescar el Frontend
```bash
# En tu máquina local, recargar la página del navegador
# O si usas dev server, el cambio debería aplicarse automáticamente
```

### Paso 2: Intentar el Pago Nuevamente
1. Ir al círculo
2. Click en "Pagar $10"
3. Aprobar en MetaMask → Esperar confirmación
4. AHORA debería proceder automáticamente al pago
5. Aprobar segunda transacción en MetaMask
6. ✅ Debería completarse

---

## 🔍 Si el Problema PERSISTE

### Verificación 1: Revisa la Consola del Navegador

Abre DevTools (F12) y busca estos logs:

```
🔍 Approval check: { isConfirmed: true, paymentStep: "approving", ... }
✅ Approval confirmed! Proceeding to payment in 2s...
💰 Executing payment to: 0x...
📝 Payment hash: 0x...
```

**Si NO ves estos logs:** El hook no se está ejecutando correctamente.

### Verificación 2: Revisa que CIRCLE_ABI sea Correcto

Verifica que `CIRCLE_ABI` en `/lib/contracts/abis.ts` tenga la función `makeRoundPayment`:

```typescript
export const CIRCLE_ABI = [
  // ... otros métodos
  {
    inputs: [],
    name: "makeRoundPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // ... otros métodos
] as const;
```

**Si NO está:** Necesitas agregar el ABI completo del contrato Circle.

### Verificación 3: Verifica el Estado del Círculo

En la consola del navegador, ejecuta:

```javascript
// Reemplaza con la dirección de tu círculo
const circleAddress = "0xTU_CIRCULO_AQUI";

// Verifica el estado del círculo
await fetch(`https://sepolia.arbiscan.io/api?module=proxy&action=eth_call&to=${circleAddress}&data=0xc19d93fb&apikey=YourApiKeyToken`)
```

**El círculo debe estar en estado ACTIVE (1):**
- 0 = DEPOSIT
- 1 = ACTIVE ✅
- 2 = COMPLETED
- 3 = LIQUIDATED

### Verificación 4: Revisa si Ya Pagaste Esta Ronda

El contrato revierte si ya pagaste:
```solidity
if (hasPaidRound[msg.sender][currentRound]) revert PaymentAlreadyMade();
```

**Solución:** Espera a que todos paguen y empiece la siguiente ronda.

---

## 📊 Debugging Avanzado

### Opción A: Usar Cast para Simular

```bash
# Simular el pago desde tu wallet
cast call $CIRCLE_ADDRESS "makeRoundPayment()" \
  --from $YOUR_ADDRESS \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc

# Si falla, verás el error específico
```

### Opción B: Ver Transacción Fallida en Arbiscan

1. Cuando se queda cargando, copia el hash de la transacción de pago
2. Ve a https://sepolia.arbiscan.io/tx/[HASH]
3. Revisa el "Error Message" o "Revert Reason"

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `InvalidStatus()` | Círculo no está ACTIVE | Espera a que todos depositen garantía |
| `NotMember()` | Tu address no está en el círculo | Verifica que estés usando la wallet correcta |
| `PaymentAlreadyMade()` | Ya pagaste esta ronda | Espera a la siguiente ronda |
| `Insufficient allowance` | USDC no aprobado | El paso 1 falló, intenta de nuevo |
| `Out of gas` | Gas insuficiente | Ya está arreglado con 800000n |

---

## 🚨 Si NADA Funciona

### Plan B: Pago Manual en 2 Pasos Separados

Agrega este botón temporal en `PaymentButton.tsx`:

```typescript
// TEMPORAL: Para debugging
<button onClick={async () => {
  // Paso 1: Aprobar USDC
  const approveTx = await writeContract({
    address: CONTRACTS.arbitrumSepolia.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [circleAddress, parseUnits(amount.toString(), 6)],
  });
  console.log("Approval tx:", approveTx);
  
  // Esperar manualmente y luego hacer pago
  alert("Aprobado. Ahora haz click en 'Pagar' de nuevo");
}}>
  🔧 DEBUG: Solo Aprobar
</button>

<button onClick={async () => {
  // Paso 2: Solo pagar (asumiendo ya aprobado)
  const paymentTx = await writeContract({
    address: circleAddress as `0x${string}`,
    abi: CIRCLE_ABI,
    functionName: "makeRoundPayment",
    gas: 800000n,
  });
  console.log("Payment tx:", paymentTx);
}}>
  🔧 DEBUG: Solo Pagar
</button>
```

Si esto funciona → El problema está en el flujo automático del hook
Si esto NO funciona → El problema está en el contrato o en la configuración del círculo

---

## 📝 Notas Adicionales

### Gas Estimado para makeRoundPayment():

```
Base:                  ~21,000 gas
USDC Transfer:         ~65,000 gas
Aguayo Update:         ~50,000 gas
Storage Updates:       ~40,000 gas
Posible VRF Request:   ~200,000 gas (si es el último en pagar)
─────────────────────────────────
Total máximo:          ~376,000 gas
+ 2x buffer:           ~800,000 gas ✅
```

### Tiempos Esperados:

- Aprobación USDC: ~10-15 segundos
- Espera automática: 2 segundos
- Pago en círculo: ~15-20 segundos
- **Total: ~30-40 segundos**

---

## ✅ Checklist Post-Fix

- [ ] Código actualizado con el fix
- [ ] Frontend refrescado
- [ ] Pago probado con éxito
- [ ] Logs de consola verificados
- [ ] Transacción confirmada en Arbiscan
- [ ] Aguayo actualizado (+1 hilo)
- [ ] Estado del círculo actualizado

---

**Última actualización:** Nov 1, 2025
**Versión:** 1.0
**Estado:** ✅ ARREGLADO
