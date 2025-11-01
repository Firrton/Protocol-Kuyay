# Kuyay Protocol

Protocolo de identidad financiera y liquidez social basado en Pasanakus (círculos de ahorro andinos) en blockchain.

## ¿Qué es Kuyay?

Kuyay transforma los Pasanakus tradicionales en un sistema DeFi que permite a usuarios sin historial crediticio construir reputación on-chain y acceder a crédito apalancado.

**Concepto clave:** Tu identidad financiera es un "Aguayo Digital" (SBT) que evoluciona visualmente conforme participas en círculos de ahorro.

## Arquitectura del Protocolo

```
┌─────────────────┐
│  AguayoSBT.sol  │ ← Identidad (SBT dinámico)
└─────────────────┘
         ↑
         │ actualiza
         │
┌─────────────────┐      ┌──────────────────┐
│   Circle.sol    │ ←────│ CircleFactory.sol│
│ (Pasanaku Game) │      │   (Fábrica)      │
└─────────────────┘      └──────────────────┘
    ↓          ↓                    ↑
 préstamo   consulta               autoriza
    ↓          ↓                    │
┌──────────┐  ┌──────────────┐     │
│  Vault   │  │ RiskOracle   │─────┘
└──────────┘  └──────────────┘
```

## Contratos Core

### 1. AguayoSBT.sol - Sistema de Identidad

SBT (Soul-Bound Token) no transferible que representa la reputación financiera del usuario.

#### Estados del Aguayo

- **Nivel 0 "Telar Vacío"**: Usuario nuevo, solo puede unirse a Círculos de Ahorro
- **Nivel 1+ "Tejedor"**: Completó al menos 1 círculo, puede acceder a Círculos de Crédito
- **"Q'ipi" (Manchado)**: Defaulteó, pierde acceso a crédito

#### Funciones Principales

**Minteo**
```solidity
function mintAguayo() external returns (uint256)
```
Mintea un Aguayo Nivel 0 para el usuario (1 por dirección).

```solidity
function mintAguayoFor(address user) external returns (uint256)
```
Minteo por parte del factory. Requiere autorización.

**Evolución del Aguayo**
```solidity
function addWeave(uint256 tokenId) external
```
Añade un "hilo" (pago exitoso). Solo llamado por Circles autorizados.

```solidity
function addBorder(uint256 tokenId) external
```
Añade un "borde" (círculo completado) y sube de nivel. Solo llamado por Circles.

```solidity
function addStain(uint256 tokenId) external
```
Añade una "mancha" permanente (default). Solo llamado por Circles.

**Consultas**
```solidity
function getAguayoByUser(address user) external view returns (uint256)
```
Obtiene el tokenId del Aguayo de un usuario.

```solidity
function getAguayoMetadata(uint256 tokenId) external view returns (AguayoMetadata memory)
```
Obtiene toda la metadata: nivel, hilos, círculos completados, manchas.

```solidity
function isEligibleForCredit(uint256 tokenId) external view returns (bool)
```
Verifica si el Aguayo califica para Círculos de Crédito (Nivel 1+ sin manchas).

**Gestión de Autorizaciones**
```solidity
function authorizeCircle(address circleAddress) external
```
Autoriza un Circle para actualizar Aguayos. Llamado por Factory.

```solidity
function authorizeFactory(address factoryAddress) external
```
Autoriza un Factory. Solo owner.

---

### 2. KuyayVault.sol - Tesorería del Protocolo

Banco central del protocolo. Gestiona depósitos de LPs y préstamos a Circles.

#### Funciones LP (Proveedores de Liquidez)

```solidity
function deposit(uint256 amount) external
```
LPs depositan USDC para ganar yield.

```solidity
function withdraw(uint256 amount) external
```
LPs retiran su capital + intereses ganados.

```solidity
function balanceOf(address lp) external view returns (uint256)
```
Consulta balance actual del LP (depósito + yield proporcional).

```solidity
function availableLiquidity() external view returns (uint256)
```
Consulta liquidez disponible para préstamos.

#### Funciones Circle (Préstamos)

```solidity
function requestLoan(
    uint256 amount,
    uint256 durationInDays,
    uint256 interestRateBps
) external
```
Circle solicita préstamo. Solo Circles autorizados. Cobra fee de originación.

```solidity
function repayLoan(uint256 amount) external
```
Circle paga su deuda. Llamado automáticamente cuando miembros pagan cuotas.

```solidity
function liquidateCircle(address circleAddress, uint256 collateralRecovered) external
```
Liquida un Circle en default. Recupera colateral y cubre pérdida con insurance pool.

```solidity
function calculateTotalDebt(address circleAddress) public view returns (uint256)
```
Calcula deuda total de un Circle (principal + interés acumulado).

#### Funciones Admin

```solidity
function setOriginationFee(uint256 newFeeBps) external
```
Actualiza fee de originación (default: 3%).

```solidity
function fundInsurancePool(uint256 amount) external
```
Añade fondos al pool de seguros para cubrir defaults.

---

### 3. RiskOracle.sol - Motor de Riesgo

Evalúa la solvencia de grupos de usuarios analizando sus Aguayos.

#### Funciones de Evaluación

```solidity
function areAllMembersEligible(address[] calldata members) external view returns (bool)
```
Verifica si todos los miembros califican para Modo Crédito.

```solidity
function getLeverageLevel(address[] calldata members)
    external view
    returns (uint256 multiplier, uint256 interestRateBps)
```
Calcula apalancamiento permitido e interés basado en niveles promedio del grupo.

Ejemplo: Grupo con nivel promedio 3 → 3x leverage, 10% APR

```solidity
function getWeightedProbabilities(address[] calldata members)
    external view
    returns (uint256[] memory weights)
```
Calcula probabilidades ponderadas para el sorteo VRF.
Aguayos de mayor nivel tienen ligeramente más probabilidad de ganar primero.

```solidity
function isMemberEligible(address member, bool isCreditMode)
    external view
    returns (bool)
```
Verifica si un miembro individual califica para un modo específico.

#### Configuración de Tiers

El Oracle maneja tiers de leverage:

| Nivel Promedio | Leverage | APR  |
|----------------|----------|------|
| 1-2            | 1.5x     | 12%  |
| 3-4            | 3x       | 10%  |
| 5+             | 5x       | 8%   |

```solidity
function addLeverageTier(
    uint8 minAverageLevel,
    uint256 multiplier,
    uint256 interestRateBps
) external
```
Añade nuevo tier de leverage. Solo owner.

```solidity
function setMaxLeverageMultiplier(uint256 newMaxMultiplier) external
```
Configura leverage máximo permitido globalmente.

---

### 4. Circle.sol - Lógica del Pasanaku

Contrato del juego. Cada instancia = 1 Pasanaku activo.

#### Modos de Juego

**SAVINGS (Ahorro)**: Sin préstamo del protocolo
- Miembros aportan cuota
- Ganador se lleva el pozo completo
- Garantía individual protege al grupo

**CREDIT (Crédito)**: Con préstamo del protocolo
- Pozo = Cuotas + Préstamo del Vault
- Ganador recibe pozo - pago a protocolo
- Garantía grupal respalda el préstamo

#### Flujo del Juego

**Fase 1: Depósito de Garantías**
```solidity
function depositGuarantee() external
```
Cada miembro deposita su garantía. Cuando todos depositan, el círculo se activa.

**Fase 2: Rondas Activas**
```solidity
function makeRoundPayment() external
```
Miembros pagan su cuota de la ronda. Cuando todos pagan, se inicia sorteo VRF.

```solidity
function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal
```
Callback de Chainlink VRF. Selecciona ganador aleatorio y distribuye pozo.

**Fase 3: Completado o Liquidación**

Si todos completan todas las rondas:
- Garantías se devuelven
- Aguayos suben de nivel (+1 borde)

Si hay default:
```solidity
function liquidate() external
```
Liquida el círculo:
- En Modo Ahorro: Garantía del deudor cubre su cuota faltante
- En Modo Crédito: Colateral grupal va al Vault, todos pierden garantía y manchan Aguayo

#### Consultas

```solidity
function getMembers() external view returns (address[] memory)
```
Lista de miembros del círculo.

```solidity
function getRoundWinner(uint256 round) external view returns (address)
```
Ganador de una ronda específica.

```solidity
function getCircleState() external view
    returns (CircleMode mode, CircleStatus status, uint256 round, uint256 pot)
```
Estado actual completo del círculo.

---

### 5. CircleFactory.sol - Fábrica de Circles

Despliega y valida nuevos Circles.

#### Creación de Circles

```solidity
function createSavingsCircle(
    address[] calldata members,
    uint256 guaranteeAmount,
    uint256 cuotaAmount
) external returns (address)
```
Crea un Círculo de Ahorro. Valida que todos tengan Aguayo.

```solidity
function createCreditCircle(
    address[] calldata members,
    uint256 guaranteeAmount,
    uint256 cuotaAmount
) external returns (address)
```
Crea un Círculo de Crédito. Valida que todos tengan Nivel 1+ sin manchas.

#### Consultas

```solidity
function getAllCircles() external view returns (address[] memory)
```
Todos los circles creados por el protocolo.

```solidity
function getUserCircles(address user) external view returns (address[] memory)
```
Circles donde participa un usuario.

```solidity
function previewCircleCreation(address[] calldata members, bool isCreditMode)
    external view
    returns (bool eligible, uint256 leverageMultiplier, uint256 interestRate)
```
Simula creación de circle (dry-run). Útil para UI.

#### Configuración

```solidity
function setMinMembers(uint256 newMin) external
```
Configura mínimo de miembros (default: 3).

```solidity
function setMaxMembers(uint256 newMax) external
```
Configura máximo de miembros (default: 50).

```solidity
function setGuaranteeRange(uint256 newMin, uint256 newMax) external
```
Configura rango de garantías permitidas.

---

## Deployment en Arbitrum Sepolia

### Requisitos

1. Foundry instalado
2. Wallet con ETH en Arbitrum Sepolia
3. Chainlink VRF Subscription ID

### Pasos

1. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tu PRIVATE_KEY y VRF_SUBSCRIPTION_ID
```

2. **Compilar contratos**
```bash
forge build
```

3. **Desplegar**
```bash
forge script script/Deploy.s.sol \
  --rpc-url arbitrum_sepolia \
  --broadcast \
  --verify
```

4. **Post-deployment**
- Añadir el CircleFactory como consumer en tu Chainlink VRF subscription
- Fondear el Vault con liquidez inicial (si aplica)

### Direcciones en Arbitrum Sepolia

Después del deployment, las direcciones se guardan en:
```
./deployments/arbitrum-sepolia.txt
```

---

## Flujo de Usuario Típico

### Nuevo Usuario (Sin Historial)

1. **Mintear Aguayo**
   ```javascript
   aguayoSBT.mintAguayo()
   ```

2. **Unirse a Círculo de Ahorro**
   ```javascript
   factory.createSavingsCircle([user1, user2, user3, ...], 100e6, 100e6)
   // 100 USDC garantía, 100 USDC cuota
   ```

3. **Depositar garantía**
   ```javascript
   usdc.approve(circleAddress, 100e6)
   circle.depositGuarantee()
   ```

4. **Pagar cuotas cada ronda**
   ```javascript
   usdc.approve(circleAddress, 100e6)
   circle.makeRoundPayment()
   ```

5. **Completar círculo → Aguayo sube a Nivel 1**

### Usuario Experimentado (Nivel 1+)

1. **Crear Círculo de Crédito**
   ```javascript
   factory.createCreditCircle([user1, user2, ...], 500e6, 200e6)
   // 500 USDC garantía grupal, 200 USDC cuota
   ```

2. **El círculo obtiene préstamo automático**
   - Colateral grupal: 500 USDC × 10 = 5,000 USDC
   - Préstamo del protocolo: 10,000 USDC (2x leverage)
   - Pozo total: 15,000 USDC

3. **Ganar el sorteo**
   - Recibes 13,500 USDC (pozo - repago a protocolo)
   - Sigues pagando cuotas hasta terminar

4. **Completar círculo → Aguayo sube a Nivel 2**

---

## Testing

```bash
# Ejecutar tests
forge test

# Con verbosidad
forge test -vvv

# Test específico
forge test --match-test testMintAguayo
```

---

## Seguridad

- **Auditoría**: Pendiente
- **Bug Bounty**: Próximamente
- **Testnet**: Arbitrum Sepolia (current)
- **Mainnet**: TBD

### Consideraciones

- Los Circles son inmutables una vez creados
- Las manchas en Aguayos son permanentes
- El protocolo NO custodia fondos de usuarios fuera de Circles activos
- Usa Chainlink VRF v2 para aleatoriedad verificable

---

## Licencia

MIT
