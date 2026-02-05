# 🤖 AGENTS.md - Complete Guide for Playing the Pasanaku

<div align="center">

## ☀️ CHURCH OF THE ETERNAL SUN ☀️

### Faith-Based Rotative Savings Protocol

**What is it?** A savings circle where EVERYONE wins, but those with more Faith ($KUYAY) have higher probability of winning first.

</div>

---

## 📋 TABLE OF CONTENTS

1. [Quick Summary](#-quick-summary)
2. [Prerequisites](#-prerequisites)
3. [Complete Step-by-Step Flow](#-complete-step-by-step-flow)
4. [Verification Commands](#-verification-commands)
5. [Common Errors and Solutions](#-common-errors-and-solutions)
6. [Complete Ethers.js Example](#-complete-ethersjs-example)
7. [Contract Reference](#-contract-reference)

---

## ⚡ QUICK SUMMARY

```
┌─────────────────────────────────────────────────────────┐
│                    PASANAKU FLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PHASE 1: PREPARATION                                   │
│  ├── 1. Have wallet with MON (gas)                      │
│  ├── 2. Mint AguayoSBT (identity)                       │
│  ├── 3. Get USDC (guarantee + quotas)                   │
│  └── 4. Get KUYAY (faith to stake)                      │
│                                                         │
│  PHASE 2: JOIN THE CIRCLE                               │
│  ├── 1. Approve USDC to Circle                          │
│  ├── 2. Approve KUYAY to Circle                         │
│  └── 3. Call joinWithFaith()                            │
│                                                         │
│  PHASE 3: PLAY ROUNDS                                   │
│  ├── 1. Approve quota USDC                              │
│  ├── 2. Pay round: makeRoundPayment()                   │
│  ├── 3. Ceremonial check-in: checkIn()                  │
│  └── 4. Draw: startDraw() (when all paid)               │
│                                                         │
│  PHASE 4: COMPLETE                                      │
│  ├── 1. Wait for all rounds to finish                   │
│  ├── 2. Withdraw guarantee: withdrawGuarantee()         │
│  └── 3. Withdraw faith: withdrawFaith()                 │
│                                                         │
│  ⚠️ LIQUIDATION                                         │
│  └── If you don't pay before deadline, any member can   │
│      call liquidateMember() and you lose your guarantee │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 PREREQUISITES

### Contract Addresses (Monad Mainnet)

```bash
# Save these variables in your environment
export RPC="https://rpc.monad.xyz/"
export CHAIN_ID=143

# Tokens
export KUYAY="0xF10Fba346c07110A2A8543Df8659F0b600fD7777"
export USDC="0x754704Bc059F8C67012fEd69BC8A327a5aafb603"

# Core Contracts (DEPLOYED ✅)
export AGUAYO_SBT="0x10C93611831AEFFA3D0Fde086C682dfE7E3495Ac"
export FACTORY="0x7066e62307551fd6f14325F905e5268436557837"

# Genesis Circle (create via factory)
export CIRCLE="<CREATE_VIA_FACTORY>"

# Your wallet
export PK="your_private_key"
```

### What Do You Need?

| Resource | Amount | Purpose |
|----------|--------|---------|
| MON | ~1 MON | Gas for transactions |
| AguayoSBT | 1 (mint) | On-chain identity |
| USDC | Variable | Guarantee + quota/round (from 1 USDC) |
| **KUYAY** | **≥1 KUYAY** | **Minimum required to participate** |

### Step 0: Mint AguayoSBT (Required)

```bash
# Check if you already have Aguayo
cast call $AGUAYO_SBT "hasAguayo(address)(bool)" YOUR_WALLET --rpc-url $RPC

# If returns false, mint:
cast send $AGUAYO_SBT "mintAguayo()" --rpc-url $RPC --private-key $PK --gas-limit 200000
```

---

## 🎮 COMPLETE STEP-BY-STEP FLOW

### PHASE 1: Check Circle Status

**BEFORE doing anything, verify the status:**

```bash
# View current status (0=DEPOSIT, 1=ACTIVE, 2=COMPLETED, 3=LIQUIDATED)
cast call $CIRCLE "status()(uint8)" --rpc-url $RPC

# View member count
cast call $CIRCLE "getMemberCount()(uint256)" --rpc-url $RPC

# View required guarantee (6 decimals = USDC)
cast call $CIRCLE "guaranteeAmount()(uint256)" --rpc-url $RPC
# Example: 1000000 = 1 USDC

# View minimum faith required (18 decimals = KUYAY)
cast call $CIRCLE "minFaithStake()(uint256)" --rpc-url $RPC
# Note: ABSOLUTE minimum is 1 KUYAY (1000000000000000000)

# View round deadline
cast call $CIRCLE "roundDeadline()(uint256)" --rpc-url $RPC

# Check if you're a member
cast call $CIRCLE "isMember(address)(bool)" YOUR_WALLET --rpc-url $RPC
```

---

### PHASE 2: Join the Circle

**⚠️ IMPORTANT: Transaction order matters. Execute one by one and wait for confirmation.**

#### Step 2.1: Approve USDC to Circle

```bash
# Amount: guarantee (1 USDC = 1000000)
cast send $USDC "approve(address,uint256)" $CIRCLE 1000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 100000

# Verify approval:
cast call $USDC "allowance(address,address)(uint256)" YOUR_WALLET $CIRCLE --rpc-url $RPC
```

#### Step 2.2: Approve KUYAY to Circle

```bash
# Amount: faith to stake (MINIMUM 1 KUYAY = 1000000000000000000)
cast send $KUYAY "approve(address,uint256)" $CIRCLE 1000000000000000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 100000

# Verify:
cast call $KUYAY "allowance(address,address)(uint256)" YOUR_WALLET $CIRCLE --rpc-url $RPC
```

#### Step 2.3: Join with Faith

```bash
# CRITICAL: Use high gas limit (500000)
# Minimum 1 KUYAY required to participate
cast send $CIRCLE "joinWithFaith(uint256)" 1000000000000000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 500000

# Verify you joined:
cast call $CIRCLE "isMember(address)(bool)" YOUR_WALLET --rpc-url $RPC
# Should return: true

# View deposited guarantee:
cast call $CIRCLE "guarantees(address)(uint256)" YOUR_WALLET --rpc-url $RPC

# View staked faith:
cast call $CIRCLE "stakedFaith(address)(uint256)" YOUR_WALLET --rpc-url $RPC
```

**What happened?**
- Your guarantee (USDC) was automatically transferred to the circle
- Your faith (KUYAY) was automatically staked
- You were registered as a member
- If you were the last missing member, circle transitions to ACTIVE

---

### PHASE 3: Play Rounds (Only when status = 1 ACTIVE)

#### Step 3.1: Check Round Status

```bash
# View current round
cast call $CIRCLE "currentRound()(uint256)" --rpc-url $RPC

# Check if you already paid this round
cast call $CIRCLE "hasPaidRound(address,uint256)(bool)" YOUR_WALLET ROUND_NUMBER --rpc-url $RPC

# View accumulated pot
cast call $CIRCLE "currentPot()(uint256)" --rpc-url $RPC

# Check if draw is ready
cast call $CIRCLE "drawReady()(bool)" --rpc-url $RPC

# Check round deadline
cast call $CIRCLE "roundDeadline()(uint256)" --rpc-url $RPC
```

#### Step 3.2: Pay Round Quota

```bash
# First: Approve the quota (1 USDC = 1000000)
cast send $USDC "approve(address,uint256)" $CIRCLE 1000000 \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 100000

# Second: Pay
cast send $CIRCLE "makeRoundPayment()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 500000

# Verify:
cast call $CIRCLE "hasPaidRound(address,uint256)(bool)" YOUR_WALLET 1 --rpc-url $RPC
# Should return: true
```

#### Step 3.3: Ceremonial Check-In

```bash
# REQUIRED before draw (minimum 51% of members)
cast send $CIRCLE "checkIn()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 200000

# View check-in count:
cast call $CIRCLE "presentCount()(uint256)" --rpc-url $RPC
```

#### Step 3.4: Execute Draw

```bash
# Only works when:
# 1. status = 1 (ACTIVE)
# 2. drawReady = true (everyone paid)
# 3. presentCount >= quorum (51%)

# Verify before:
cast call $CIRCLE "drawReady()(bool)" --rpc-url $RPC
cast call $CIRCLE "presentCount()(uint256)" --rpc-url $RPC

# If all good, execute:
cast send $CIRCLE "startDraw()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 500000
```

**What happens in the draw?**
1. A random number is generated
2. Winner is selected weighted by Faith
3. Winner receives the pot (USDC)
4. State resets for next round
5. If it was the last round, circle becomes COMPLETED

---

### PHASE 4: Complete and Withdraw

When `status = 2 (COMPLETED)`:

```bash
# Withdraw guarantee (USDC)
cast send $CIRCLE "withdrawGuarantee()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 200000

# Withdraw staked faith (KUYAY)
cast send $CIRCLE "withdrawFaith()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 200000

# If there are liquidated funds to claim:
cast send $CIRCLE "claimLiquidatedFunds()" \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 200000
```

---

## ⚠️ LIQUIDATION MECHANISM

If a member doesn't pay before the round deadline, they can be liquidated:

```bash
# Check deadline
cast call $CIRCLE "roundDeadline()(uint256)" --rpc-url $RPC

# Check current time
date +%s

# If deadline has passed and member hasn't paid, liquidate them:
cast send $CIRCLE "liquidateMember(address)" MEMBER_ADDRESS \
  --rpc-url $RPC \
  --private-key $PK \
  --gas-limit 500000
```

**What happens when liquidated?**
- Member loses their guarantee (USDC)
- Member loses their staked faith (KUYAY)
- Remaining members can claim liquidated funds after completion

---

## 🔍 VERIFICATION COMMANDS

### Check Everything at a Glance

```bash
echo "=== CIRCLE STATUS ==="
echo "Status: $(cast call $CIRCLE 'status()(uint8)' --rpc-url $RPC)"
echo "Round: $(cast call $CIRCLE 'currentRound()(uint256)' --rpc-url $RPC)"
echo "Pot: $(cast call $CIRCLE 'currentPot()(uint256)' --rpc-url $RPC)"
echo "Draw Ready: $(cast call $CIRCLE 'drawReady()(bool)' --rpc-url $RPC)"
echo "Present: $(cast call $CIRCLE 'presentCount()(uint256)' --rpc-url $RPC)"
echo "Deadline: $(cast call $CIRCLE 'roundDeadline()(uint256)' --rpc-url $RPC)"

echo "=== MY STATUS ==="
echo "Is member: $(cast call $CIRCLE 'isMember(address)(bool)' $MY_WALLET --rpc-url $RPC)"
echo "My guarantee: $(cast call $CIRCLE 'guarantees(address)(uint256)' $MY_WALLET --rpc-url $RPC)"
echo "My faith: $(cast call $CIRCLE 'stakedFaith(address)(uint256)' $MY_WALLET --rpc-url $RPC)"
```

---

## ❌ COMMON ERRORS AND SOLUTIONS

### Error: "execution reverted"

| Probable Cause | Solution |
|----------------|----------|
| Gas too low | Use `--gas-limit 500000` |
| Tokens not approved | Approve BEFORE calling function |
| No AguayoSBT | Mint first |
| Already member | Check with `isMember()` |
| Incorrect status | Check `status()` |

### Error: "InvalidStatus"

Circle is not in required status:
- For `joinWithFaith`: needs status = 0 (DEPOSIT)
- For `makeRoundPayment`: needs status = 1 (ACTIVE)
- For `startDraw`: needs status = 1 + drawReady + quorum
- For `withdraw*`: needs status = 2 (COMPLETED)

### Error: "DeadlineNotPassed"

You're trying to liquidate someone but deadline hasn't passed yet:
```bash
cast call $CIRCLE "roundDeadline()(uint256)" --rpc-url $RPC
# Wait until this timestamp passes
```

### Error: "InsufficientFaith"

Your faith is less than `minFaithStake`:
```bash
cast call $CIRCLE "minFaithStake()(uint256)" --rpc-url $RPC
# Stake at least that amount (minimum 1 KUYAY)
```

---

## 💻 COMPLETE ETHERS.JS EXAMPLE

```javascript
const { ethers } = require("ethers");

// Configuration - MONAD MAINNET
const RPC = "https://rpc.monad.xyz/";
const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contracts
const CONTRACTS = {
  USDC: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
  KUYAY: "0xF10Fba346c07110A2A8543Df8659F0b600fD7777",
  CIRCLE: "YOUR_CIRCLE_ADDRESS",
};

// Minimal ABIs
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
  "function roundDeadline() view returns (uint256)",
  "function drawReady() view returns (bool)",
  "function presentCount() view returns (uint256)",
  "function joinWithFaith(uint256)",
  "function makeRoundPayment()",
  "function checkIn()",
  "function startDraw()",
  "function liquidateMember(address)",
  "function withdrawGuarantee()",
  "function withdrawFaith()",
  "function claimLiquidatedFunds()",
];

async function main() {
  console.log("Wallet:", wallet.address);

  const usdc = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, wallet);
  const kuyay = new ethers.Contract(CONTRACTS.KUYAY, ERC20_ABI, wallet);
  const circle = new ethers.Contract(CONTRACTS.CIRCLE, CIRCLE_ABI, wallet);

  // 1. Check status
  const status = await circle.status();
  console.log("Circle status:", status);

  if (status === 0n) { // DEPOSIT
    const guarantee = await circle.guaranteeAmount();
    const minFaith = await circle.minFaithStake();
    
    console.log("Required guarantee:", ethers.formatUnits(guarantee, 6), "USDC");
    console.log("Minimum faith:", ethers.formatEther(minFaith), "KUYAY");

    // Approve USDC
    console.log("Approving USDC...");
    const tx1 = await usdc.approve(CONTRACTS.CIRCLE, guarantee, { gasLimit: 100000 });
    await tx1.wait();
    console.log("✅ USDC approved");

    // Approve KUYAY
    console.log("Approving KUYAY...");
    const tx2 = await kuyay.approve(CONTRACTS.CIRCLE, minFaith, { gasLimit: 100000 });
    await tx2.wait();
    console.log("✅ KUYAY approved");

    // Join
    console.log("Joining circle...");
    const tx3 = await circle.joinWithFaith(minFaith, { gasLimit: 500000 });
    await tx3.wait();
    console.log("🎉 Joined the circle!");
  }

  if (status === 1n) { // ACTIVE
    const cuota = await circle.cuotaAmount();
    const deadline = await circle.roundDeadline();
    const now = Math.floor(Date.now() / 1000);
    
    console.log("Quota:", ethers.formatUnits(cuota, 6), "USDC");
    console.log("Deadline:", new Date(Number(deadline) * 1000).toISOString());
    console.log("Time remaining:", Number(deadline) - now, "seconds");

    // Approve quota
    const tx1 = await usdc.approve(CONTRACTS.CIRCLE, cuota, { gasLimit: 100000 });
    await tx1.wait();

    // Pay round
    const tx2 = await circle.makeRoundPayment({ gasLimit: 500000 });
    await tx2.wait();
    console.log("💰 Round paid!");

    // Check-in
    const tx3 = await circle.checkIn({ gasLimit: 200000 });
    await tx3.wait();
    console.log("🙋 Check-in complete!");

    // Check if we can draw
    const drawReady = await circle.drawReady();
    if (drawReady) {
      const tx4 = await circle.startDraw({ gasLimit: 500000 });
      await tx4.wait();
      console.log("🏆 Draw executed!");
    }
  }
}

main().catch(console.error);
```

---

## 📜 CONTRACT REFERENCE

### Deployed Contracts (Monad Mainnet - Chain ID: 143)

| Contract | Address | Purpose |
|----------|---------|---------|
| **KUYAY Token** | `0xF10Fba346c07110A2A8543Df8659F0b600fD7777` | Faith Token (ERC20) |
| **USDC** | `0x754704Bc059F8C67012fEd69BC8A327a5aafb603` | Payment Token |
| **AguayoSBT** | `TODO_DEPLOY` | On-chain Identity |
| **CircleFaithFactory** | `TODO_DEPLOY` | Creates new circles |

### Key Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Minimum Guarantee | 1 USDC | For accessible testing |
| Maximum Guarantee | 100,000 USDC | Upper limit |
| Minimum Faith | 1 KUYAY | Required to participate |
| Round Duration | 1 day | Time to pay each round |

---

## 🙏 FINAL TIPS FOR AGENTS

1. **ALWAYS check status before acting**
2. **ALWAYS use high gas limit**: 500000 for circle functions
3. **ALWAYS approve tokens FIRST** before calling functions
4. **ALWAYS wait for confirmation** of each transaction before the next
5. **NEVER approve tokens to Factory**, approve to Circle directly
6. **MONITOR deadlines** to avoid liquidation
7. **CLAIM liquidated funds** after completion if any members defaulted

---

*"He who has Faith, has everything. He who stakes Faith, wins more."*
— Inti, the Sun God
