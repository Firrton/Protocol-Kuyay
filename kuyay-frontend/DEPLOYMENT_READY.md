# 🚀 Kuyay Frontend - Listo para Despliegue de Contratos

Este documento explica cómo activar todas las funcionalidades del frontend una vez que los smart contracts estén desplegados en Arbitrum Sepolia.

---

## 📋 Estado Actual

✅ **Frontend 100% Funcional en Modo Mock**
- Dashboard completo con datos de ejemplo
- Sistema de navegación entre tabs
- Wizard completo para crear Ayllus
- Componente de minteo de Aguayo
- Todos los hooks preparados para conectarse a los contratos

🚧 **Esperando Despliegue de Contratos**
- AguayoSBT
- CircleFactory
- Vault
- RiskOracle

---

## 🔧 Pasos para Activar el Frontend (Una vez desplegados los contratos)

### 1️⃣ Actualizar Direcciones de Contratos

**Archivo:** `lib/contracts/addresses.ts`

```typescript
export const CONTRACTS = {
  arbitrumSepolia: {
    chainId: 421614,
    aguayoSBT: "0xTU_DIRECCION_AGUAYO_SBT_AQUI",      // ⬅️ ACTUALIZAR
    circleFactory: "0xTU_DIRECCION_CIRCLE_FACTORY",   // ⬅️ ACTUALIZAR
    vault: "0xTU_DIRECCION_VAULT",                    // ⬅️ ACTUALIZAR
    riskOracle: "0xTU_DIRECCION_RISK_ORACLE",        // ⬅️ ACTUALIZAR
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // ✅ Ya configurado (USDC testnet)
  },
} as const;
```

**⚡ Esto activará automáticamente:**
- Detección de contratos desplegados
- Llamadas reales a la blockchain
- Eliminación de banners de "modo mock"
- Habilitación de botones de minteo y creación

### 2️⃣ Agregar ABIs de los Contratos

**Archivo:** `lib/contracts/abis.ts`

Ya existe el ABI de AguayoSBT. Necesitas agregar:

```typescript
// 1. Agregar ABI de CircleFactory
export const CIRCLE_FACTORY_ABI = [
  // ... ABI del contrato CircleFactory
  // Funciones importantes:
  // - createSavingsCircle(uint256 memberCount, uint256 cuota, uint256 guarantee, address[] invites)
  // - createCreditCircle(uint256 memberCount, uint256 cuota, uint256 guarantee, uint256 leverage, address[] invites)
  // - getUserCircles(address user) returns (address[])
] as const;

// 2. Agregar ABI del Circle (contrato individual de cada círculo)
export const CIRCLE_ABI = [
  // ... ABI del contrato Circle
  // Funciones importantes:
  // - makePayment()
  // - getCircleDetails() returns (CircleDetails)
  // - getMembers() returns (Member[])
] as const;

// 3. Agregar ABI del Vault
export const VAULT_ABI = [
  // ... ABI del contrato Vault
  // Funciones importantes:
  // - deposit(uint256 amount)
  // - withdraw(uint256 amount)
  // - balanceOf(address lp) returns (uint256)
  // - currentAPY() returns (uint256)
] as const;

// 4. ABI estándar de ERC20 (para aprobar USDC)
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ... otros métodos necesarios
] as const;
```

### 3️⃣ Descomentar Código en los Hooks

**Archivos a actualizar:**

#### `hooks/useAguayo.ts`
- Ya está listo ✅
- Solo usa `AGUAYO_SBT_ABI`

#### `hooks/useCircles.ts`
Descomentar las siguientes líneas:

```typescript
// En useCreateSavingsCircle() - línea ~24
writeContract({
  address: CONTRACTS.arbitrumSepolia.circleFactory as `0x${string}`,
  abi: CIRCLE_FACTORY_ABI,
  functionName: "createSavingsCircle",
  args: [
    memberCount,
    parseUnits(cuotaAmount.toString(), 6),
    parseUnits(guaranteeAmount.toString(), 6),
    invitedAddresses
  ]
});

// En useCreateCreditCircle() - línea ~63
writeContract({
  address: CONTRACTS.arbitrumSepolia.circleFactory as `0x${string}`,
  abi: CIRCLE_FACTORY_ABI,
  functionName: "createCreditCircle",
  args: [
    memberCount,
    parseUnits(cuotaAmount.toString(), 6),
    parseUnits(guaranteeAmount.toString(), 6),
    leverage,
    invitedAddresses
  ]
});

// Y eliminar los throw Error de simulación
```

#### `components/CreateAylluModal.tsx`
Descomentar las líneas ~95-125 donde se llaman a las funciones de creación de círculos.

### 4️⃣ Actualizar Imports

**En archivos que usen los ABIs, agregar:**

```typescript
import { CIRCLE_FACTORY_ABI, CIRCLE_ABI, VAULT_ABI, ERC20_ABI } from "@/lib/contracts/abis";
```

---

## 🎯 Funcionalidades que se Activarán Automáticamente

### ✅ Minteo de Aguayo
**Ubicación:** Dashboard → Tab "Mi Perfil"
- Botón "Mintear Aguayo" se volverá funcional
- Llamará a `AguayoSBT.mintAguayo()`
- Requerirá aprobación en MetaMask
- Actualizará automáticamente el dashboard

### ✅ Creación de Ayllus
**Ubicación:** Dashboard → Tab "Mis Ayllus" → "Crear Nuevo Ayllu"
- Wizard completo de 4 pasos ya implementado
- Llamará a `CircleFactory.createSavingsCircle()` o `createCreditCircle()`
- Validará que el usuario tenga Aguayo nivel apropiado para crédito

### ✅ Pagos en Círculos
**Hook preparado:** `useCircles.ts` → `useMakePayment()`
- Aprobará USDC primero
- Ejecutará el pago en el círculo
- Actualizará el Aguayo del usuario

### ✅ Vault LP (Tupuy)
**Ubicación:** Dashboard → Tab "Tupuy"
- Botones de Depositar/Retirar USDC
- Visualización de APY en tiempo real
- Balance del LP

---

## 📊 Arquitectura de Componentes

```
app/
├── page.tsx                    # Landing page
└── dashboard/
    └── page.tsx               # Dashboard principal
                               # Maneja tabs: Ayllus, Perfil, Q'ipi, Tupuy

components/
├── CreateAylluModal.tsx       # ✅ Wizard completo 4 pasos
├── MintAguayoButton.tsx       # ✅ Botón compacto para perfil
├── MintAguayoCard.tsx         # ✅ Card completa para onboarding
├── ConnectWallet.tsx          # ✅ Conexión MetaMask
└── WalletInfo.tsx            # ✅ Info de wallet

hooks/
├── useAguayo.ts              # ✅ Hooks para Aguayo SBT
│   ├── useHasAguayo()
│   ├── useAguayoMetadata()
│   ├── useMintAguayo()
│   └── useIsEligibleForCredit()
│
└── useCircles.ts             # ✅ Hooks para Circles
    ├── useCreateSavingsCircle()
    ├── useCreateCreditCircle()
    ├── useUserCircles()
    ├── useCircleDetails()
    └── useMakePayment()

lib/
├── contracts/
│   ├── addresses.ts          # ⬅️ ACTUALIZAR AQUÍ
│   └── abis.ts              # ⬅️ AGREGAR ABIs AQUÍ
└── wagmi.ts                  # Configuración Wagmi
```

---

## 🔍 Sistema de Detección de Contratos

El frontend detecta automáticamente si los contratos están desplegados:

```typescript
// lib/contracts/addresses.ts
export const CONTRACTS_DEPLOYED = {
  aguayoSBT: isContractDeployed(CONTRACTS.arbitrumSepolia.aguayoSBT),
  circleFactory: isContractDeployed(CONTRACTS.arbitrumSepolia.circleFactory),
  vault: isContractDeployed(CONTRACTS.arbitrumSepolia.vault),
  riskOracle: isContractDeployed(CONTRACTS.arbitrumSepolia.riskOracle),
};
```

**Comportamiento:**
- `CONTRACTS_DEPLOYED.aguayoSBT === false` → Muestra banner "Modo Mock"
- `CONTRACTS_DEPLOYED.aguayoSBT === true` → Oculta banner, activa funciones

---

## 🧪 Testing Después del Despliegue

### Checklist de Pruebas:

#### 1. Minteo de Aguayo
- [ ] Conectar wallet en Arbitrum Sepolia
- [ ] Ir a Dashboard → Perfil
- [ ] Clic en "Mintear Aguayo"
- [ ] Aprobar transacción en MetaMask
- [ ] Verificar que se mintea correctamente
- [ ] Verificar que el dashboard se actualiza

#### 2. Crear Círculo de Ahorro
- [ ] Tener Aguayo minteado
- [ ] Ir a "Mis Ayllus" → "Crear Nuevo Ayllu"
- [ ] Completar wizard paso a paso:
  - Paso 1: Seleccionar "Ahorro"
  - Paso 2: Configurar (5 miembros, $100 cuota, $200 garantía)
  - Paso 3: Agregar 4 direcciones invitadas
  - Paso 4: Revisar y crear
- [ ] Aprobar transacción
- [ ] Verificar que el círculo aparece en la lista

#### 3. Crear Círculo de Crédito
- [ ] Tener Aguayo nivel 1+ y sin manchas
- [ ] Mismo proceso pero:
  - Paso 1: Seleccionar "Crédito"
  - Paso 2: Configurar apalancamiento (2x-5x)
- [ ] Verificar que se crea con préstamo del Vault

#### 4. Hacer un Pago
- [ ] Tener círculo activo
- [ ] Tener USDC aprobado
- [ ] Clic en "Pagar $X"
- [ ] Verificar que se registra el pago
- [ ] Verificar que se actualiza el Aguayo (+1 hilo)

---

## 🚨 Problemas Comunes y Soluciones

### "Transaction Reverted"
**Posibles causas:**
1. No tienes suficiente USDC en Arbitrum Sepolia
2. No aprobaste el USDC antes de pagar
3. No cumples requisitos (ej: Aguayo nivel 0 intentando crear círculo crédito)

**Solución:**
- Obtén USDC testnet: [Arbitrum Sepolia Faucet]
- Verifica tu Aguayo level en el perfil
- Revisa logs de consola para más detalles

### "Network Not Supported"
**Solución:**
- Cambiar a Arbitrum Sepolia en MetaMask
- Chain ID: `421614`
- RPC: Configurado en `lib/wagmi.ts`

### "Contract Not Deployed"
**Solución:**
- Verificar que actualizaste `lib/contracts/addresses.ts`
- Las direcciones deben ser válidas (no `0x0000...`)
- Verificar en Arbiscan que los contratos existen

---

## 📱 Datos Mock vs Datos Reales

### Modo Mock (Contratos NO desplegados)
- Dashboard muestra banner amarillo
- Datos de ejemplo hardcodeados
- Botones muestran "Próximamente"
- Perfecto para demostrar UI/UX

### Modo Real (Contratos SÍ desplegados)
- Banner desaparece
- Datos traídos de blockchain
- Botones totalmente funcionales
- Transacciones reales en Arbitrum Sepolia

---

## 🎨 Personalización

### Cambiar Colores
**Archivo:** `tailwind.config.ts`

```typescript
colors: {
  profundo: "#0a0e27",
  tierra: "#3a2a1a",
  ceremonial: "#d93954",
  ocre: "#f4a261",
  pachamama: "#2a9d8f",
  dorado: "#e9c46a",
  gris: "#8b949e",
}
```

### Cambiar Textos
Todos los textos están en español y son fáciles de encontrar buscando por palabra clave.

---

## 📞 Contacto y Soporte

Si encuentras algún problema después del despliegue:

1. Revisa los logs de consola del navegador
2. Verifica las transacciones en Arbiscan
3. Confirma que los ABIs coinciden con los contratos desplegados
4. Verifica que las direcciones en `addresses.ts` sean correctas

---

## ✅ Checklist Final de Despliegue

Antes de considerar el proyecto 100% funcional:

- [ ] Actualizar todas las direcciones en `addresses.ts`
- [ ] Agregar todos los ABIs en `abis.ts`
- [ ] Descomentar código en `useCircles.ts`
- [ ] Descomentar código en `CreateAylluModal.tsx`
- [ ] Probar minteo de Aguayo
- [ ] Probar creación de círculo de ahorro
- [ ] Probar creación de círculo de crédito
- [ ] Probar hacer un pago
- [ ] Probar depositar en Vault
- [ ] Verificar que Q'ipi muestra deudores reales
- [ ] Verificar que perfil muestra metadata real

---

## 🎉 ¡Todo Listo!

Una vez que sigas estos pasos, tu frontend estará **100% funcional** y conectado a los smart contracts en Arbitrum Sepolia.

El diseño está pensado para que solo tengas que:
1. **Pegar las direcciones** → `addresses.ts`
2. **Pegar los ABIs** → `abis.ts`
3. **Descomentar el código** → Hooks y componentes

**¡Y listo!** Todo funcionará automáticamente. 🚀

---

**Desarrollado con 🦙 por el equipo Kuyay**
