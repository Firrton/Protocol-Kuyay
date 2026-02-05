/**
 * ☀️ KUYAY GENESIS SCRIPT - Para Agentes de la Iglesia del Sol
 * 
 * Este script verifica todos los requisitos y crea un Pasanaku de Fe
 * 
 * USO:
 * 1. npm install ethers
 * 2. export PRIVATE_KEY=tu_clave
 * 3. node kuyay-genesis.js
 */

const { ethers } = require("ethers");

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN - NO MODIFICAR
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    RPC: "https://testnet-rpc.monad.xyz/",
    CHAIN_ID: 10143,
    CONTRACTS: {
        KUYAY: "0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c",
        AGUAYO: "0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1",
        USDC: "0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2",
        FAITH_FACTORY: "0x61FC4578863DA32DC4e879F59e1cb673dA498618"
    }
};

// ABIs mínimos
const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function mint(address,uint256)"
];

const AGUAYO_ABI = [
    "function hasAguayo(address) view returns (bool)",
    "function mintAguayo() returns (uint256)",
    "function userToAguayo(address) view returns (uint256)"
];

const FACTORY_ABI = [
    "function createFaithCircle(address[],uint256,uint256,uint256) returns (address)",
    "function getAllCircles() view returns (address[])",
    "function minGuaranteeAmount() view returns (uint256)",
    "function maxGuaranteeAmount() view returns (uint256)",
    "function defaultMinFaithStake() view returns (uint256)",
    "function minMembers() view returns (uint256)"
];

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
    console.log("\n☀️ ═══════════════════════════════════════════════════════");
    console.log("   KUYAY GENESIS - Verificación Pre-Pasanaku");
    console.log("═══════════════════════════════════════════════════════ ☀️\n");

    // Setup
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log(`📍 Tu Wallet: ${wallet.address}`);
    console.log(`⛓️  Red: Monad Testnet (${CONFIG.CHAIN_ID})\n`);

    // Contracts
    const kuyay = new ethers.Contract(CONFIG.CONTRACTS.KUYAY, ERC20_ABI, wallet);
    const usdc = new ethers.Contract(CONFIG.CONTRACTS.USDC, ERC20_ABI, wallet);
    const aguayo = new ethers.Contract(CONFIG.CONTRACTS.AGUAYO, AGUAYO_ABI, wallet);
    const factory = new ethers.Contract(CONFIG.CONTRACTS.FAITH_FACTORY, FACTORY_ABI, wallet);

    // ═══════════════════════════════════════════════════════════
    // PASO 1: Verificar Balance MON (gas)
    // ═══════════════════════════════════════════════════════════
    console.log("📋 VERIFICANDO REQUISITOS...\n");

    const monBalance = await provider.getBalance(wallet.address);
    const monFormatted = ethers.formatEther(monBalance);
    const hasGas = monBalance > ethers.parseEther("0.01");
    console.log(`[${hasGas ? '✅' : '❌'}] MON (gas): ${monFormatted} MON ${hasGas ? '' : '← NECESITAS MÁS GAS'}`);

    // ═══════════════════════════════════════════════════════════
    // PASO 2: Verificar AguayoSBT
    // ═══════════════════════════════════════════════════════════
    let hasAguayoSBT = await aguayo.hasAguayo(wallet.address);
    console.log(`[${hasAguayoSBT ? '✅' : '❌'}] AguayoSBT: ${hasAguayoSBT ? 'MINTEADO' : 'NO TIENES'}`);

    if (!hasAguayoSBT) {
        console.log("   → Minteando AguayoSBT...");
        const tx = await aguayo.mintAguayo();
        await tx.wait();
        hasAguayoSBT = true;
        console.log("   → ✅ AguayoSBT minteado!");
    }

    // ═══════════════════════════════════════════════════════════
    // PASO 3: Verificar KUYAY
    // ═══════════════════════════════════════════════════════════
    const kuyayBalance = await kuyay.balanceOf(wallet.address);
    const kuyayFormatted = ethers.formatEther(kuyayBalance);
    const minFaith = await factory.defaultMinFaithStake();
    const hasEnoughKuyay = kuyayBalance >= minFaith;
    console.log(`[${hasEnoughKuyay ? '✅' : '❌'}] $KUYAY: ${kuyayFormatted} (mínimo: ${ethers.formatEther(minFaith)})`);

    // ═══════════════════════════════════════════════════════════
    // PASO 4: Verificar/Mintear USDC
    // ═══════════════════════════════════════════════════════════
    let usdcBalance = await usdc.balanceOf(wallet.address);
    const minGuarantee = await factory.minGuaranteeAmount();
    let hasEnoughUSDC = usdcBalance >= minGuarantee;
    console.log(`[${hasEnoughUSDC ? '✅' : '❌'}] MockUSDC: ${ethers.formatUnits(usdcBalance, 6)} (mínimo: ${ethers.formatUnits(minGuarantee, 6)})`);

    if (!hasEnoughUSDC) {
        console.log("   → Minteando 1000 MockUSDC...");
        const tx = await usdc.mint(wallet.address, ethers.parseUnits("1000", 6));
        await tx.wait();
        usdcBalance = await usdc.balanceOf(wallet.address);
        hasEnoughUSDC = true;
        console.log(`   → ✅ Nuevo balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    }

    // ═══════════════════════════════════════════════════════════
    // PASO 5: Verificar parámetros del Factory
    // ═══════════════════════════════════════════════════════════
    console.log("\n📊 CONFIGURACIÓN DEL FACTORY:");
    const minMembers = await factory.minMembers();
    const maxGuarantee = await factory.maxGuaranteeAmount();
    console.log(`   • Miembros mínimos: ${minMembers}`);
    console.log(`   • Garantía mínima: ${ethers.formatUnits(minGuarantee, 6)} USDC`);
    console.log(`   • Garantía máxima: ${ethers.formatUnits(maxGuarantee, 6)} USDC`);
    console.log(`   • Fe mínima: ${ethers.formatEther(minFaith)} KUYAY`);

    // ═══════════════════════════════════════════════════════════
    // VERIFICACIÓN FINAL
    // ═══════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(60));

    if (!hasGas) {
        console.log("\n❌ BLOQUEADO: Necesitas MON para gas");
        console.log("   → Usa el faucet: https://testnet.monad.xyz/");
        return;
    }

    if (!hasEnoughKuyay) {
        console.log("\n❌ BLOQUEADO: Necesitas más $KUYAY");
        console.log("   → Pide tokens al deployer: 0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac");
        return;
    }

    console.log("\n✅ TODOS LOS REQUISITOS CUMPLIDOS");
    console.log("\n⚠️  IMPORTANTE: Para crear un Pasanaku necesitas:");
    console.log(`   • MÍNIMO ${minMembers} MIEMBROS (con AguayoSBT cada uno)`);
    console.log("   • Aprobar KUYAY y USDC antes de crear\n");

    // ═══════════════════════════════════════════════════════════
    // CREAR CÍRCULO DE PRUEBA (comentado por seguridad)
    // ═══════════════════════════════════════════════════════════

    // Descomenta esto para crear un círculo real:
    /*
    const SECOND_MEMBER = "0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac"; // Deployer
    
    // Verificar que segundo miembro tenga Aguayo
    const secondHasAguayo = await aguayo.hasAguayo(SECOND_MEMBER);
    if (!secondHasAguayo) {
        console.log("❌ El segundo miembro no tiene AguayoSBT");
        return;
    }
    
    const guarantee = ethers.parseUnits("100", 6);  // 100 USDC
    const cuota = ethers.parseUnits("50", 6);       // 50 USDC por ronda
    const faithStake = ethers.parseEther("10");     // 10 KUYAY
    
    // Aprobar tokens
    console.log("🔐 Aprobando USDC...");
    await (await usdc.approve(CONFIG.CONTRACTS.FAITH_FACTORY, guarantee)).wait();
    
    console.log("🔐 Aprobando KUYAY...");
    await (await kuyay.approve(CONFIG.CONTRACTS.FAITH_FACTORY, faithStake)).wait();
    
    // Crear círculo
    console.log("🎯 Creando Pasanaku de Fe...");
    const tx = await factory.createFaithCircle(
        [wallet.address, SECOND_MEMBER],
        guarantee,
        cuota,
        faithStake
    );
    const receipt = await tx.wait();
    
    console.log("\n☀️ ¡PASANAKU CREADO!");
    console.log(`   TX: ${receipt.hash}`);
    */

    console.log("☀️ Que Inti te guíe en tus transacciones on-chain.");
}

main().catch((error) => {
    console.error("\n💀 ERROR:", error.message);
    if (error.data) {
        console.error("   Revert data:", error.data);
    }
    process.exit(1);
});
