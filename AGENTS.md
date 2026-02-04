# 🤖 AGENTS.md - Technical Reference for AI Agents

> **This document is designed for AI agents to fully understand and interact with the Kuyay Protocol.**
> Read this file to gain complete context about the system, contracts, and how to participate.

---

## 📋 Table of Contents

1. [Protocol Overview](#protocol-overview)
2. [Core Concepts](#core-concepts)
3. [Smart Contracts Reference](#smart-contracts-reference)
4. [Contract ABIs & Function Signatures](#contract-abis--function-signatures)
5. [Step-by-Step Interaction Guide](#step-by-step-interaction-guide)
6. [Token Economics](#token-economics)
7. [Faith-Based Mechanics](#faith-based-mechanics)
8. [Network Configuration](#network-configuration)
9. [Common Patterns](#common-patterns)
10. [Error Handling](#error-handling)
11. [Security Considerations](#security-considerations)
12. [Example Transactions](#example-transactions)

---

## Protocol Overview

**Kuyay Protocol** is a faith-based rotating savings system (Pasanaku) deployed on Monad Testnet. It combines:

- **$KUYAY Token**: ERC20 token used for staking "faith" in the system
- **Pasanaku Circles**: Rotating savings groups where members contribute monthly and take turns receiving the pool
- **Faith-Weighted Probability**: Your winning probability in draws is proportional to your staked $KUYAY
- **AguayoSBT**: Soulbound token representing on-chain identity and reputation

### Key Value Proposition
```
Traditional Pasanaku: Random winner selection (equal probability)
Kuyay Pasanaku:      Faith-weighted selection (more stake = higher probability)
```

---

## Core Concepts

### 1. Pasanaku (Rotating Savings)
A traditional Andean financial system:
- N members form a circle
- Each contributes X amount per round
- One member receives N×X each round
- After N rounds, everyone has contributed and received equally

### 2. Faith Staking ($KUYAY)
Members stake $KUYAY tokens when joining a circle:
- Staked tokens are locked until circle completion
- Higher stake = higher probability of winning draws
- Tokens are returned after all rounds complete

### 3. Guarantee Deposits
Members deposit USDC/payment token as collateral:
- Ensures commitment to the circle
- Returned after fulfilling all payment obligations
- Can be slashed if member defaults

---

## Smart Contracts Reference

### Deployed Contracts (Monad Testnet - Chain ID: 10143)

| Contract | Address | Purpose |
|----------|---------|---------|
| **KuyayToken** | `0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c` | ERC20 faith token (1B supply) |
| **AguayoSBT** | `0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1` | Soulbound identity NFT |
| **KuyayVault** | `0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1` | Protocol treasury |
| **RiskOracle** | `0x5483B6C35b975F24Ca21647650b1a93f8341B26a` | Risk assessment |
| **CircleFactory** | `0x6536ee56e3f30A427bc83c208D829d059E8eEDA4` | Traditional Pasanaku factory |
| **CircleFaithFactory** | `0xD15ED9ea64B0a1d9535374F27de79111EbE872C1` | Faith-weighted Pasanaku factory |
| **MockUSDC** | `0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2` | Test stablecoin (6 decimals) |

### RPC Endpoint
```
https://testnet-rpc.monad.xyz/
```

### Block Explorer
```
https://testnet.monadexplorer.com/address/{CONTRACT_ADDRESS}
```

---

## Contract ABIs & Function Signatures

### KuyayToken (ERC20)

```solidity
// Standard ERC20
function name() external view returns (string memory);  // "Kuyay - Luz de Inti"
function symbol() external view returns (string memory); // "KUYAY"
function decimals() external view returns (uint8);       // 18
function totalSupply() external view returns (uint256);  // 1,000,000,000 * 10^18
function balanceOf(address account) external view returns (uint256);
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);
function allowance(address owner, address spender) external view returns (uint256);

// Kuyay-specific
function getFaithLevel(address user) external view returns (uint8);
// Returns: 0=Catecúmeno, 1=Creyente, 2=Fiel, 3=Sacerdote, 4=Amawta
```

### AguayoSBT (Soulbound NFT)

```solidity
// Mint your identity
function mintAguayo() external returns (uint256 tokenId);

// Check ownership
function hasAguayo(address user) external view returns (bool);
function userToAguayo(address user) external view returns (uint256);

// Get reputation level
function getLevel(uint256 tokenId) external view returns (uint8);
// Levels: 0=Telar Vacío, 1-5 based on participation history

// Factory authorization (admin only)
function authorizeFactory(address factory) external;
function isAuthorizedFactory(address factory) external view returns (bool);
```

### CircleFaith (Faith-Weighted Pasanaku)

```solidity
// Circle information
function paymentToken() external view returns (address);      // USDC address
function faithToken() external view returns (address);        // KUYAY address
function roundAmount() external view returns (uint256);       // Monthly contribution
function guaranteeAmount() external view returns (uint256);   // Required collateral
function minFaithStake() external view returns (uint256);     // Minimum KUYAY to join
function maxMembers() external view returns (uint8);
function currentRound() external view returns (uint8);
function circleStatus() external view returns (uint8);
// Status: 0=Forming, 1=Active, 2=Completed, 3=Cancelled

// Member data
struct MemberData {
    bool isActive;
    bool hasReceivedPot;
    uint256 faithStaked;        // Amount of KUYAY staked
    uint256 guaranteeDeposited; // USDC collateral
    uint256 totalContributed;   // Total USDC contributed
}
function members(address) external view returns (MemberData memory);
function memberCount() external view returns (uint8);
function memberAddresses(uint256 index) external view returns (address);

// Join with faith staking
function joinWithFaith(uint256 kuyayAmount) external;
// Requirements:
// - Have AguayoSBT minted
// - Approve KUYAY tokens for this contract
// - Approve USDC for guarantee deposit
// - kuyayAmount >= minFaithStake

// Make round payment
function makeRoundPayment() external;
// Requirements:
// - Circle status == Active
// - Haven't paid this round yet
// - Approve USDC for roundAmount

// Check in (alternative to payment for already-paid members)
function checkIn() external;

// Execute draw (anyone can call when conditions met)
function startDraw() external returns (address winner);
// Conditions:
// - All members have paid or checked in
// - Current round < maxMembers
// Returns: Winner address (probability weighted by faith)

// Withdraw after completion
function withdrawGuarantee() external;
function withdrawFaith() external;

// View functions
function getFaithPercentage(address member) external view returns (uint256);
// Returns: Member's faith as percentage (basis points, e.g., 2500 = 25%)

function getTotalFaithStaked() external view returns (uint256);
function getRoundWinner(uint8 round) external view returns (address);
function hasCheckedIn(address member) external view returns (bool);
function hasPaidRound(address member, uint8 round) external view returns (bool);
```

### CircleFaithFactory

```solidity
// Create new faith circle
function createFaithCircle(
    address[] calldata initialMembers,  // First member is organizer
    uint256 roundAmount,                 // USDC per round (6 decimals)
    uint256 guaranteeAmount,             // Collateral required
    uint8 maxMembers,                    // 3-12 members
    uint256 minFaithStake                // Minimum KUYAY to join
) external returns (address circleAddress);

// View functions
function getUserCircles(address user) external view returns (address[] memory);
function getAllCircles() external view returns (address[] memory);
function getCircleCount() external view returns (uint256);

// Configuration
function aguayoSBT() external view returns (address);
function faithToken() external view returns (address);
function paymentToken() external view returns (address);
```

### MockUSDC (Test Token)

```solidity
// Mint test tokens (anyone can call)
function mint(address to, uint256 amount) external;
// Note: amount in 6 decimals (e.g., 1000000 = 1 USDC)

// Standard ERC20
function approve(address spender, uint256 amount) external returns (bool);
function balanceOf(address account) external view returns (uint256);
```

---

## Step-by-Step Interaction Guide

### Phase 1: Setup

```javascript
// 1. Connect to Monad Testnet
const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// 2. Contract addresses
const KUYAY = "0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c";
const AGUAYO = "0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1";
const FAITH_FACTORY = "0xD15ED9ea64B0a1d9535374F27de79111EbE872C1";
const USDC = "0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2";
```

### Phase 2: Get Test Tokens

```javascript
// Mint MockUSDC for testing
const usdc = new ethers.Contract(USDC, ["function mint(address,uint256)"], wallet);
await usdc.mint(wallet.address, ethers.parseUnits("10000", 6)); // 10,000 USDC

// Note: $KUYAY must be obtained from treasury or owner
// Initial supply is held by deployer: 0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac
```

### Phase 3: Mint Identity

```javascript
// Mint AguayoSBT (required before joining circles)
const aguayo = new ethers.Contract(AGUAYO, [
    "function mintAguayo() returns (uint256)",
    "function hasAguayo(address) view returns (bool)"
], wallet);

if (!await aguayo.hasAguayo(wallet.address)) {
    const tx = await aguayo.mintAguayo();
    await tx.wait();
    console.log("AguayoSBT minted!");
}
```

### Phase 4: Join Circle with Faith

```javascript
const circle = new ethers.Contract(CIRCLE_ADDRESS, [
    "function joinWithFaith(uint256)",
    "function guaranteeAmount() view returns (uint256)",
    "function minFaithStake() view returns (uint256)"
], wallet);

// Get requirements
const guarantee = await circle.guaranteeAmount();
const minFaith = await circle.minFaithStake();
const myFaithStake = minFaith * 2n; // Stake 2x minimum for better odds

// Approve tokens
const kuyayContract = new ethers.Contract(KUYAY, ERC20_ABI, wallet);
const usdcContract = new ethers.Contract(USDC, ERC20_ABI, wallet);

await kuyayContract.approve(CIRCLE_ADDRESS, myFaithStake);
await usdcContract.approve(CIRCLE_ADDRESS, guarantee);

// Join with faith
await circle.joinWithFaith(myFaithStake);
```

### Phase 5: Make Payments

```javascript
// Each round, make payment
const roundAmount = await circle.roundAmount();
await usdcContract.approve(CIRCLE_ADDRESS, roundAmount);
await circle.makeRoundPayment();
```

### Phase 6: Withdraw After Completion

```javascript
// After all rounds complete
await circle.withdrawGuarantee();
await circle.withdrawFaith();
```

---

## Token Economics

### $KUYAY Distribution

| Allocation | Percentage | Amount | Vesting |
|------------|------------|--------|---------|
| Community & Ecosystem | 60% | 600,000,000 | None |
| Treasury | 20% | 200,000,000 | Protocol controlled |
| Team | 10% | 100,000,000 | 3 year linear |
| Missionaries | 10% | 100,000,000 | Performance based |

### Faith Levels

| Level | Name | Min Balance | Benefits |
|-------|------|-------------|----------|
| 0 | Catecúmeno | 0 | Can observe |
| 1 | Creyente | 100 KUYAY | Can join circles |
| 2 | Fiel | 1,000 KUYAY | +10% draw probability bonus |
| 3 | Sacerdote | 10,000 KUYAY | Can create circles |
| 4 | Amawta | 100,000 KUYAY | Governance + max benefits |

---

## Faith-Based Mechanics

### Probability Calculation

```
P(winning) = member_kuyay_staked / total_kuyay_staked_in_circle
```

**Example:**
```
Circle with 5 members:
- Alice:  100 KUYAY → P = 100/1000 = 10%
- Bob:    200 KUYAY → P = 200/1000 = 20%
- Carol:  300 KUYAY → P = 300/1000 = 30%
- Dave:   150 KUYAY → P = 150/1000 = 15%
- Eve:    250 KUYAY → P = 250/1000 = 25%
Total:   1000 KUYAY
```

### Randomness Source

```solidity
// Monad native randomness
uint256 random = uint256(keccak256(abi.encodePacked(
    block.prevrandao,
    blockhash(block.number - 1),
    msg.sender,
    block.timestamp
)));
```

### Winner Selection Algorithm

```solidity
function _selectWinnerByFaith() internal returns (address) {
    uint256 random = _generateRandom() % totalFaithStaked;
    uint256 cumulative = 0;
    
    for (uint i = 0; i < memberCount; i++) {
        address member = memberAddresses[i];
        if (!members[member].hasReceivedPot) {
            cumulative += members[member].faithStaked;
            if (random < cumulative) {
                return member;
            }
        }
    }
}
```

---

## Network Configuration

### Monad Testnet

```json
{
    "chainId": 10143,
    "chainName": "Monad Testnet",
    "rpcUrls": ["https://testnet-rpc.monad.xyz/"],
    "blockExplorerUrls": ["https://testnet.monadexplorer.com"],
    "nativeCurrency": {
        "name": "MON",
        "symbol": "MON",
        "decimals": 18
    }
}
```

### Gas Estimation

| Action | Estimated Gas | Est. Cost (@ 100 gwei) |
|--------|--------------|------------------------|
| Mint AguayoSBT | ~150,000 | 0.015 MON |
| Join Circle | ~200,000 | 0.02 MON |
| Make Payment | ~80,000 | 0.008 MON |
| Execute Draw | ~120,000 | 0.012 MON |
| Withdraw | ~60,000 | 0.006 MON |

---

## Common Patterns

### Pattern 1: Check Circle Status Before Action

```javascript
async function safeJoinCircle(circleAddress, faithAmount) {
    const circle = new ethers.Contract(circleAddress, CIRCLE_ABI, wallet);
    
    // Check status
    const status = await circle.circleStatus();
    if (status !== 0) throw new Error("Circle not in forming state");
    
    // Check if space available
    const current = await circle.memberCount();
    const max = await circle.maxMembers();
    if (current >= max) throw new Error("Circle is full");
    
    // Check if user has Aguayo
    const aguayo = new ethers.Contract(AGUAYO, AGUAYO_ABI, wallet);
    if (!await aguayo.hasAguayo(wallet.address)) {
        await aguayo.mintAguayo();
    }
    
    // Proceed with join
    await circle.joinWithFaith(faithAmount);
}
```

### Pattern 2: Monitor Circle Events

```javascript
// Listen for new circles
const factory = new ethers.Contract(FAITH_FACTORY, FACTORY_ABI, provider);
factory.on("CircleCreated", (circleAddress, organizer, event) => {
    console.log(`New circle: ${circleAddress} by ${organizer}`);
});

// Listen for draws
circle.on("DrawExecuted", (round, winner, amount, event) => {
    console.log(`Round ${round}: ${winner} won ${amount}`);
});
```

### Pattern 3: Optimal Faith Staking Strategy

```javascript
// Strategy: Stake proportional to expected value
async function calculateOptimalStake(circleAddress, budget) {
    const circle = new ethers.Contract(circleAddress, CIRCLE_ABI, provider);
    
    const totalStaked = await circle.getTotalFaithStaked();
    const memberCount = await circle.memberCount();
    const roundAmount = await circle.roundAmount();
    const totalPot = roundAmount * BigInt(memberCount);
    
    // Expected value = (stake / (totalStaked + stake)) * totalPot
    // Optimize stake based on budget and expected returns
    const optimalStake = budget / 2n; // Conservative: stake half of budget
    
    return optimalStake;
}
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `NotAMember` | Calling member function without joining | Join circle first |
| `CircleNotActive` | Wrong circle status | Wait for forming phase |
| `AlreadyPaid` | Double payment attempt | Skip payment this round |
| `InsufficientFaith` | Stake below minimum | Increase KUYAY stake |
| `NotAuthorized` | Missing AguayoSBT | Mint AguayoSBT first |
| `DrawConditionsNotMet` | Not all members ready | Wait for all check-ins |

### Revert Reason Decoding

```javascript
try {
    await circle.joinWithFaith(amount);
} catch (error) {
    if (error.data) {
        const iface = new ethers.Interface(CIRCLE_ABI);
        const decoded = iface.parseError(error.data);
        console.log(`Error: ${decoded.name}`, decoded.args);
    }
}
```

---

## Security Considerations

### For Agents Interacting with Protocol

1. **Never expose private keys** - Use secure key management
2. **Validate contract addresses** - Verify against official deployments
3. **Check allowances before transactions** - Avoid unnecessary approvals
4. **Monitor gas prices** - Avoid overpaying during congestion
5. **Verify circle organizers** - Check reputation before joining

### Trust Assumptions

- **Factory contracts** are trusted (deployed by protocol team)
- **Circle contracts** are created deterministically via factory
- **Randomness** is from `prevrandao` (Monad native, manipulation-resistant)
- **Token contracts** follow standard ERC20 behavior

---

## Example Transactions

### Complete Flow: Create and Participate in Circle

```javascript
const { ethers } = require("ethers");

// Setup
const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const CONTRACTS = {
    KUYAY: "0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c",
    AGUAYO: "0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1",
    FAITH_FACTORY: "0xD15ED9ea64B0a1d9535374F27de79111EbE872C1",
    USDC: "0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2"
};

async function main() {
    // 1. Mint test USDC
    const usdc = new ethers.Contract(CONTRACTS.USDC, [
        "function mint(address,uint256)",
        "function approve(address,uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)"
    ], wallet);
    
    await usdc.mint(wallet.address, ethers.parseUnits("10000", 6));
    console.log("✓ Minted 10,000 USDC");
    
    // 2. Mint AguayoSBT
    const aguayo = new ethers.Contract(CONTRACTS.AGUAYO, [
        "function mintAguayo() returns (uint256)",
        "function hasAguayo(address) view returns (bool)"
    ], wallet);
    
    if (!await aguayo.hasAguayo(wallet.address)) {
        await aguayo.mintAguayo();
        console.log("✓ Minted AguayoSBT");
    }
    
    // 3. Get KUYAY balance
    const kuyay = new ethers.Contract(CONTRACTS.KUYAY, [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)"
    ], wallet);
    
    const kuyayBalance = await kuyay.balanceOf(wallet.address);
    console.log(`✓ KUYAY Balance: ${ethers.formatEther(kuyayBalance)}`);
    
    // 4. Find available circles
    const factory = new ethers.Contract(CONTRACTS.FAITH_FACTORY, [
        "function getAllCircles() view returns (address[])",
        "function createFaithCircle(address[],uint256,uint256,uint8,uint256) returns (address)"
    ], wallet);
    
    const circles = await factory.getAllCircles();
    console.log(`✓ Found ${circles.length} circles`);
    
    // 5. Join or create circle
    if (circles.length === 0) {
        // Create new circle
        const tx = await factory.createFaithCircle(
            [wallet.address],                    // Initial members
            ethers.parseUnits("100", 6),        // 100 USDC per round
            ethers.parseUnits("200", 6),        // 200 USDC guarantee
            5,                                   // Max 5 members
            ethers.parseEther("100")            // Min 100 KUYAY stake
        );
        const receipt = await tx.wait();
        console.log("✓ Created new circle");
    }
    
    console.log("\n☀️ Ready to participate in Kuyay Protocol! ☀️");
}

main().catch(console.error);
```

---

## Agent Integration Checklist

Before interacting with the protocol, ensure:

- [ ] Connected to Monad Testnet (chainId: 10143)
- [ ] Have MON for gas fees
- [ ] Have AguayoSBT minted
- [ ] Have sufficient KUYAY for staking
- [ ] Have USDC for contributions and guarantee
- [ ] Approved token allowances before transactions
- [ ] Verified contract addresses match this document

---

## Contact & Resources

| Resource | Link |
|----------|------|
| GitHub | https://github.com/Firrton/Protocol-Kuyay |
| Frontend | https://protocol-kuyay.vercel.app |
| Monad Faucet | https://testnet.monad.xyz/ |
| Monad Explorer | https://testnet.monadexplorer.com |

---

**Last Updated**: 2026-02-03  
**Contract Version**: v1.0.0 (Iglesia del Sol Eterno)  
**Network**: Monad Testnet (10143)

---

☀️ *"Para los agentes que buscan la luz: stakea tu fe, únete al Ayllu, multiplica tu futuro."* ☀️
