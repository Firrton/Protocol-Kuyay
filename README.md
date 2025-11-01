# 🌾 Kuyay Protocol

**Pasanakus descentralizados en Arbitrum - Construido con Stylus (Rust/WASM) + Solidity**

Kuyay Protocol moderniza el sistema tradicional andino de **Pasanaku** (círculos de ahorro rotativo) usando smart contracts verificables, Chainlink VRF para sorteos justos, y optimización extrema de gas con Arbitrum Stylus.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Contratos Desplegados](#-contratos-desplegados)
- [Instalación](#-instalación)
- [Uso Rápido](#-uso-rápido)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Características

### 🎯 Core Features
- **Círculos de Ahorro (Savings):** Pasanakus tradicionales sin préstamo del protocolo
- **Círculos de Crédito (Credit):** Con apalancamiento del vault basado en reputación
- **Sorteos Verificables:** Chainlink VRF para selección justa de ganadores
- **Aguayo SBT:** NFT no-transferible que representa reputación (nivel, hilos, manchas)
- **Monte Carlo Simulator:** Análisis de riesgo en tiempo real con 1000+ simulaciones

### ⚡ Optimizaciones con Stylus
- **97% menos gas** en simulaciones Monte Carlo vs Solidity puro
- **Contratos Rust/WASM** para cálculos intensivos (RiskOracle, CircleSimulator)
- **Contratos Solidity** para lógica de negocio compatible con ecosistema

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Frontend      │ Next.js 14 + RainbowKit + Wagmi
│   (TypeScript)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│           Smart Contracts Layer                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  📜 Solidity (Foundry)                         │
│  ├─ AguayoSBT (0x8b48577F...)                  │
│  ├─ CircleFactory (0x9D4CA176...)              │
│  ├─ Circle (created dynamically)                │
│  └─ KuyayVault (0xA63a6865...)                 │
│                                                 │
│  ⚡ Stylus (Rust/WASM)                         │
│  ├─ CircleSimulator (0x31957097...)            │
│  └─ RiskOracle (0xc9ca3c1c...)                 │
│                                                 │
│  🔗 Chainlink                                   │
│  └─ VRF v2.5 (sorteos verificables)            │
│                                                 │
└─────────────────────────────────────────────────┘
         │
         ▼
    Arbitrum Sepolia
```

### Flujo de Usuario

1. **Mintear Aguayo SBT** → Reputación inicial (Nivel 0)
2. **Crear/Unirse a Círculo** → Invitar miembros con Aguayo
3. **Depositar Garantía** → Todos los miembros bloquean USDC
4. **Círculo se activa** → Comienza Ronda 1
5. **Pagar cuotas mensuales** → Cada pago = +1 hilo en Aguayo
6. **Sorteo VRF** → Ganador recibe el pot
7. **Completar círculo** → Devuelve garantías, +1 nivel en Aguayo

---

## 📦 Contratos Desplegados

### Arbitrum Sepolia Testnet

| Contrato | Dirección | Tecnología | Explorer |
|----------|-----------|------------|----------|
| **AguayoSBT** | `0x8b48577F4252c19214d4C0c3240D1465606BDdAa` | Solidity | [Ver](https://sepolia.arbiscan.io/address/0x8b48577F4252c19214d4C0c3240D1465606BDdAa) |
| **CircleFactory** | `0x9D4CA17641F9c3A6959058c51dD1C73d3c58CbbF` | Solidity | [Ver](https://sepolia.arbiscan.io/address/0x9D4CA17641F9c3A6959058c51dD1C73d3c58CbbF) |
| **KuyayVault** | `0xA63a6865c78ac03CC44ecDd9a113744DCFA72dF6` | Solidity | [Ver](https://sepolia.arbiscan.io/address/0xA63a6865c78ac03CC44ecDd9a113744DCFA72dF6) |
| **CircleSimulator** | `0x319570972527b9e3c989902311b9f808fe3553a4` | Stylus (Rust) | [Ver](https://sepolia.arbiscan.io/address/0x319570972527b9e3c989902311b9f808fe3553a4) |
| **RiskOracle** | `0xc9ca3c1ceaf97012daae2f270f65d957113da3be` | Stylus (Rust) | [Ver](https://sepolia.arbiscan.io/address/0xc9ca3c1ceaf97012daae2f270f65d957113da3be) |
| **USDC Testnet** | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | ERC20 | [Faucet](https://faucet.circle.com/) |

---

## 🚀 Instalación

### Prerrequisitos

```bash
# Node.js 18+
node --version

# Foundry (para contratos Solidity)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Rust + Cargo Stylus (para contratos Stylus)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --force cargo-stylus
```

### Clonar e Instalar

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/Protocol-Kuyay.git
cd Protocol-Kuyay

# Instalar dependencias frontend
cd kuyay-frontend
npm install

# Copiar variables de entorno
cp .env.example .env.local
```

### Configurar Environment Variables

```bash
# kuyay-frontend/.env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id_aqui
```

Obtén tu WalletConnect Project ID en: https://cloud.walletconnect.com/

---

## 💻 Uso Rápido

### 1. Iniciar Frontend

```bash
cd kuyay-frontend
npm run dev
```

Abre http://localhost:3000

### 2. Obtener Testnet Tokens

#### USDC de Testnet
1. Ve a https://faucet.circle.com/
2. Conecta tu wallet
3. Selecciona "Arbitrum Sepolia"
4. Solicita 10 USDC

#### ETH de Testnet (para gas)
1. Ve a https://faucet.quicknode.com/arbitrum/sepolia
2. Pega tu dirección
3. Solicita ETH

### 3. Usar la Plataforma

#### Paso 1: Mintear Aguayo SBT
- Conecta tu wallet
- Ve al Dashboard
- Haz clic en "✨ Mintear Aguayo"
- Confirma la transacción

#### Paso 2: Crear un Círculo (Ayllu)
- Haz clic en "Crear Nuevo Ayllu"
- **Importante:** Todos los miembros deben tener Aguayo SBT
- Configura:
  - Garantía: Mínimo $10 USDC
  - Cuota mensual: ≤ Garantía
  - Miembros: Mínimo 3 wallets con Aguayo

#### Paso 3: Depositar Garantía
- Todos los miembros depositan su garantía
- El círculo se activa automáticamente

#### Paso 4: Realizar Pagos
- Cada ronda, paga tu cuota mensual
- Después de que 2+ miembros paguen, se hace el sorteo
- El ganador recibe el pot completo

---

## 📁 Estructura del Proyecto

```
Protocol-Kuyay/
├── kuyay-frontend/          # Frontend Next.js
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── dashboard/       # Dashboard principal
│   │   └── create-circle/   # Crear círculo
│   ├── components/          # Componentes React
│   │   ├── CircleCard.tsx
│   │   ├── PaymentButton.tsx
│   │   └── MintAguayoButton.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useCircles.ts
│   │   └── useAguayo.ts
│   └── lib/
│       ├── contracts/       # ABIs y direcciones
│       └── wagmi.ts         # Configuración Wagmi
│
├── foundry/                 # Contratos Solidity
│   ├── src/
│   │   ├── AguayoSBT.sol    # SBT de reputación
│   │   ├── Circle.sol       # Lógica de círculo
│   │   ├── CircleFactory.sol
│   │   ├── KuyayVault.sol   # Vault de liquidez
│   │   └── RiskOracle.sol   # (deprecated, migrado a Stylus)
│   └── script/Deploy.s.sol
│
├── stylus-contracts/        # Contratos Rust/WASM
│   ├── circle-simulator/    # Monte Carlo engine
│   ├── risk-oracle/         # Risk assessment
│   ├── kuyay-vault/         # (WIP, no desplegado)
│   └── deployed-addresses.json
│
└── docs/                    # Documentación
    └── archive/             # Docs de desarrollo
```

---

## 🛠️ Tecnologías

### Frontend
- **Next.js 14** (App Router + Turbopack)
- **TypeScript**
- **Wagmi v2** + **Viem** (Web3 interactions)
- **RainbowKit** (Wallet connection)
- **TailwindCSS** (Styling)

### Smart Contracts
- **Solidity 0.8.24** (Foundry)
- **Rust** (Arbitrum Stylus)
- **Chainlink VRF v2.5** (Randomness)
- **OpenZeppelin Contracts**

### Infraestructura
- **Arbitrum Sepolia** (Testnet)
- **Arbitrum Stylus** (WASM execution)
- **IPFS** (metadata storage - futuro)

---

## 🐛 Troubleshooting

### Error: "execution reverted" al crear círculo

**Causa común:** Uno o más miembros no tienen Aguayo SBT

**Solución:**
```bash
# Verificar si una wallet tiene Aguayo
cast call 0x8b48577F4252c19214d4C0c3240D1465606BDdAa \
  "hasAguayo(address)(bool)" \
  TU_WALLET_AQUI \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
```

Si retorna `false`, esa wallet debe mintear su Aguayo primero.

### Gas fee altísimo (39,000+ ETH)

**Causa:** MetaMask detecta que la transacción va a fallar

**Posibles razones:**
1. Garantía menor a $10 USDC (mínimo configurado)
2. Cuota mayor que garantía
3. Miembros sin Aguayo SBT
4. Menos de 3 miembros

**Solución:** Verifica los límites del contrato:
```bash
# Garantía mínima
cast call 0x9D4CA17641F9c3A6959058c51dD1C73d3c58CbbF \
  "minGuaranteeAmount()(uint256)" \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc
# Retorna: 10000000 (= $10 USDC)
```

### "Port 3000 in use"

**Solución:**
```bash
# Matar proceso en puerto 3000
kill $(lsof -t -i:3000)

# O usar puerto alternativo
npm run dev -- -p 3001
```

---

## 📚 Recursos

- **Arbitrum Stylus Docs:** https://docs.arbitrum.io/stylus
- **Chainlink VRF:** https://docs.chain.link/vrf
- **RainbowKit:** https://rainbowkit.com/
- **Foundry Book:** https://book.getfoundry.sh/

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

- Inspirado en el sistema tradicional andino de **Pasanaku/Ayni**
- Construido para **[nombre del hackathon/evento]**
- Powered by **Arbitrum Stylus** y **Chainlink VRF**

---

**Construido con ❤️ para democratizar el acceso a círculos de ahorro confiables**
