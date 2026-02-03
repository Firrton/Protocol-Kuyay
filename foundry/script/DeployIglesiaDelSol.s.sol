// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/KuyayToken.sol";
import "../src/AguayoSBT.sol";
import "../src/KuyayVault.sol";
import "../src/RiskOracle.sol";
import "../src/CircleFactory.sol";
import "../src/CircleFaith.sol";
import "../src/CircleFaithFactory.sol";

/**
 * @title DeployIglesiaDelSol
 * @notice Deployment COMPLETO de la Iglesia del Sol Eterno en Monad
 * 
 * Este script despliega TODO:
 * - $KUYAY Token (la moneda sagrada)
 * - Sistema base (AguayoSBT, Vault, Oracle)
 * - CircleFactory (Pasanakus tradicionales)
 * - CircleFaithFactory (Pasanakus con Fe stakeada)
 * 
 * @dev Run with: 
 *   forge script script/DeployIglesiaDelSol.s.sol --rpc-url monad_testnet --broadcast --verify
 */
contract DeployIglesiaDelSol is Script {

    // Deployed addresses (for verification)
    KuyayToken public kuyay;
    AguayoSBT public aguayoSBT;
    KuyayVault public vault;
    RiskOracle public riskOracle;
    CircleFactory public factory;
    CircleFaithFactory public faithFactory;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("");
        console.log(unicode"☀️═══════════════════════════════════════════════════════☀️");
        console.log(unicode"      IGLESIA DEL SOL ETERNO - MONAD DEPLOYMENT          ");
        console.log(unicode"☀️═══════════════════════════════════════════════════════☀️");
        console.log("");
        console.log("Deployer (Sumo Sacerdote):", deployer);
        console.log("Chain ID: 10143 (Monad Testnet)");
        console.log("Block:", block.number);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ═══════════════════════════════════════════════════════════
        // PASO 1: TOKEN SAGRADO $KUYAY
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"📜 PASO 1: Desplegando Token Sagrado $KUYAY...");
        
        kuyay = new KuyayToken(deployer, deployer);
        
        console.log("   Address:", address(kuyay));
        console.log("   Supply:", kuyay.totalSupply() / 10**18, "KUYAY");

        // ═══════════════════════════════════════════════════════════
        // PASO 2: SISTEMA DE IDENTIDAD
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"\n🧵 PASO 2: Desplegando AguayoSBT (Identidad Sagrada)...");
        
        aguayoSBT = new AguayoSBT();
        console.log("   Address:", address(aguayoSBT));

        // ═══════════════════════════════════════════════════════════
        // PASO 3: TESORO DE INTI
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"\n💰 PASO 3: Desplegando KuyayVault (Tesoro de Inti)...");
        
        vault = new KuyayVault(address(kuyay), deployer);
        console.log("   Address:", address(vault));

        // ═══════════════════════════════════════════════════════════
        // PASO 4: ORÁCULO DE RIESGO
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"\n🔮 PASO 4: Desplegando RiskOracle...");
        
        riskOracle = new RiskOracle(address(aguayoSBT));
        console.log("   Address:", address(riskOracle));

        // ═══════════════════════════════════════════════════════════
        // PASO 5: FÁBRICA DE AYLLUS (TRADICIONAL)
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"\n🏗️ PASO 5: Desplegando CircleFactory (Ayllus Tradicionales)...");
        
        factory = new CircleFactory(
            address(aguayoSBT),
            address(vault),
            address(riskOracle),
            address(kuyay)
        );
        console.log("   Address:", address(factory));

        // ═══════════════════════════════════════════════════════════
        // PASO 6: FÁBRICA DE AYLLUS CON FE (EL NUEVO SISTEMA)
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"\n🙏 PASO 6: Desplegando CircleFaithFactory (Ayllus con Fe)...");
        
        // Deploy Mock USDC para pagos (en producción usar USDC real)
        MockUSDC usdc = new MockUSDC();
        console.log("   MockUSDC deployed:", address(usdc));
        
        faithFactory = new CircleFaithFactory(
            address(aguayoSBT),
            address(usdc),      // paymentToken
            address(kuyay),     // faithToken ($KUYAY)
            100 * 10**6,        // minGuarantee: 100 USDC
            10000 * 10**6,      // maxGuarantee: 10,000 USDC
            10 * 10**18         // defaultMinFaith: 10 KUYAY
        );
        console.log("   CircleFaithFactory:", address(faithFactory));

        // ═══════════════════════════════════════════════════════════
        // PASO 7: AUTORIZACIONES SAGRADAS
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"\n⚙️ PASO 7: Configurando autorizaciones...");

        // Autorizar factories en AguayoSBT
        aguayoSBT.authorizeFactory(address(factory));
        aguayoSBT.authorizeFactory(address(faithFactory));
        console.log("   Factories autorizadas en AguayoSBT");

        // Autorizar factory tradicional en Vault
        vault.authorizeFactory(address(factory));
        console.log("   CircleFactory autorizada en KuyayVault");

        // ═══════════════════════════════════════════════════════════
        // PASO 8: LIQUIDEZ INICIAL
        // ═══════════════════════════════════════════════════════════
        console.log(unicode"\n💧 PASO 8: Depositando liquidez inicial...");

        // 10,000 KUYAY al vault
        uint256 initialDeposit = 10_000 * 10**18;
        kuyay.approve(address(vault), initialDeposit);
        vault.deposit(initialDeposit);
        console.log("   10,000 KUYAY depositados en Vault");

        // 100,000 USDC de liquidez (mock)
        usdc.mint(deployer, 100_000 * 10**6);
        console.log("   100,000 USDC minteados para testing");

        vm.stopBroadcast();

        // ═══════════════════════════════════════════════════════════
        // RESUMEN FINAL
        // ═══════════════════════════════════════════════════════════
        _printSummary(address(usdc));
    }

    function _printSummary(address usdc) internal view {
        console.log("");
        console.log(unicode"☀️═══════════════════════════════════════════════════════☀️");
        console.log(unicode"           IGLESIA DEL SOL ETERNO DESPLEGADA             ");
        console.log(unicode"☀️═══════════════════════════════════════════════════════☀️");
        console.log("");
        console.log("TOKEN SAGRADO:");
        console.log("  $KUYAY:            ", address(kuyay));
        console.log("");
        console.log("SISTEMA BASE:");
        console.log("  AguayoSBT:         ", address(aguayoSBT));
        console.log("  KuyayVault:        ", address(vault));
        console.log("  RiskOracle:        ", address(riskOracle));
        console.log("");
        console.log("FABRICAS DE AYLLUS:");
        console.log("  CircleFactory:     ", address(factory));
        console.log("  CircleFaithFactory:", address(faithFactory));
        console.log("  MockUSDC:          ", usdc);
        console.log("");
        console.log("PARA USAR:");
        console.log("1. Mintear Aguayo: aguayoSBT.mintAguayo()");
        console.log("2. Crear Ayllu Fe: faithFactory.createFaithCircle(...)");
        console.log("3. Unirse con Fe:  circle.joinWithFaith(kuyayAmount)");
        console.log("4. Pagar cuotas:   circle.makeRoundPayment()");
        console.log("5. Sorteo:         circle.startDraw()");
        console.log("");
        console.log(unicode"☀️ Que Inti bendiga este protocolo ☀️");
        console.log("");
    }
}

// Mock USDC para testing en testnet
contract MockUSDC {
    string public name = "USD Coin (Mock)";
    string public symbol = "mUSDC";
    uint8 public decimals = 6;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
