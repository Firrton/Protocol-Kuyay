# 🌞 Deployment Guide - Church of the Eternal Sun

## ✅ DEPLOYED TO MONAD MAINNET (Feb 5, 2026)

### Contract Addresses

| Contract | Address |
|----------|---------|
| **$KUYAY Token** | `0xF10Fba346c07110A2A8543Df8659F0b600fD7777` |
| **AguayoSBT** | `0x10C93611831AEFFA3D0Fde086C682dfE7E3495Ac` |
| **CircleFaithFactory** | `0x7066e62307551fd6f14325F905e5268436557837` |
| **USDC** | `0x754704Bc059F8C67012fEd69BC8A327a5aafb603` |

---

## Prerequisites

### 1. Get MON for Gas
The deployer wallet needs MON for gas on Monad mainnet.

### 2. Configure Environment Variables
```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/foundry

# Export private key
export PRIVATE_KEY=your_private_key_without_0x
```

---

## Deploy Contracts

### Deploy to Monad Mainnet
```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/foundry

forge script script/DeployMainnet.s.sol \
  --rpc-url https://rpc.monad.xyz/ \
  --broadcast \
  --legacy \
  -vvvv
```

### Verify Deployment
```bash
# Verify AguayoSBT exists
cast call 0x10C93611831AEFFA3D0Fde086C682dfE7E3495Ac "name()(string)" \
  --rpc-url https://rpc.monad.xyz/

# Verify CircleFaithFactory exists  
cast call 0x7066e62307551fd6f14325F905e5268436557837 "aguayoSBT()(address)" \
  --rpc-url https://rpc.monad.xyz/
```

---

## Frontend Deployment

### Option A: Vercel (Recommended)
```bash
cd /Users/firrton/Desktop/Protocol-Kuyay/kuyay-frontend

# Install Vercel CLI if needed
npm install -g vercel

# Deploy
vercel
```

### Option B: Manual Build
```bash
npm run build
# Output will be in .next/
```

---

## Post-Deploy Configuration

### Contract Addresses Already Updated
The file `lib/contracts/addresses.ts` has been updated with:

```typescript
export const CONTRACTS = {
  monadMainnet: {
    chainId: 143,
    kuyayToken: "0xF10Fba346c07110A2A8543Df8659F0b600fD7777",
    usdc: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    circleFaithFactory: "0x7066e62307551fd6f14325F905e5268436557837",
    aguayoSBT: "0x10C93611831AEFFA3D0Fde086C682dfE7E3495Ac",
  },
};
```

---

## Verification Commands

### 1. Create First Circle (Genesis)
```bash
# First, mint an AguayoSBT identity
cast send 0x10C93611831AEFFA3D0Fde086C682dfE7E3495Ac "mintAguayo()" \
  --rpc-url https://rpc.monad.xyz/ \
  --private-key $PRIVATE_KEY

# Then create a circle via factory
# See AGENTS.md for complete flow
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `insufficient funds` | Get more MON |
| `nonce too low` | Reset with `--force` |
| `gas limit exceeded` | Increase with `--gas-limit 10000000` |

---

## Important URLs

| Resource | URL |
|----------|-----|
| **Monad Mainnet RPC** | `https://rpc.monad.xyz/` |
| **Chain ID** | `143` |
| **KUYAY on nad.fun** | `https://nad.fun/token/0xF10Fba346c07110A2A8543Df8659F0b600fD7777` |
| **Frontend** | `https://protocol-kuyay.vercel.app` |
