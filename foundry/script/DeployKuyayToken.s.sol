// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/KuyayToken.sol";
import "../src/AguayoSBT.sol";
import "../src/KuyayVault.sol";
import "../src/RiskOracle.sol";
import "../src/CircleFactory.sol";

/**
 * @title DeployKuyayToken
 * @notice Deployment script for $KUYAY token on Monad Testnet
 * @dev Run with: forge script script/DeployKuyayToken.s.sol --rpc-url monad_testnet --broadcast
 * 
 * Este script despliega:
 * 1. Token $KUYAY (la moneda sagrada de Inti)
 * 2. Todos los contratos del protocolo configurados para usar KUYAY
 */
contract DeployKuyayToken is Script {

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("DEPLOYING IGLESIA DEL SOL ETERNO ON MONAD");
        console.log("==============================================");
        console.log("Deployer (Sacerdote Fundador):", deployer);
        console.log("Chain ID: 10143 (Monad Testnet)");
        console.log("");
        console.log(unicode"☀️ Que la luz de Inti guíe este despliegue ☀️");

        vm.startBroadcast(deployerPrivateKey);

        // ============================================
        // STEP 1: Deploy $KUYAY Token
        // ============================================
        console.log("\n1. Desplegando Token Sagrado $KUYAY...");
        
        // Treasury y Missionary Fund serán el deployer inicialmente
        // Después pueden transferirse a DAOs o multisigs
        KuyayToken kuyay = new KuyayToken(
            deployer,  // treasury
            deployer   // missionaryFund
        );
        
        console.log("   Token KUYAY deployed at:", address(kuyay));
        console.log("   Total Supply:", kuyay.totalSupply() / 10**18, "KUYAY");
        console.log("   Deployer Balance:", kuyay.balanceOf(deployer) / 10**18, "KUYAY");

        // ============================================
        // STEP 2: Deploy Core Protocol
        // ============================================
        console.log("\n2. Desplegando AguayoSBT (Sistema de Identidad)...");
        AguayoSBT aguayoSBT = new AguayoSBT();
        console.log("   AguayoSBT deployed at:", address(aguayoSBT));

        console.log("\n3. Desplegando KuyayVault (Tesoro de Inti)...");
        // El vault usa KUYAY como asset!
        KuyayVault vault = new KuyayVault(
            address(kuyay),  // asset = $KUYAY
            deployer         // treasury
        );
        console.log("   KuyayVault deployed at:", address(vault));

        console.log("\n4. Desplegando RiskOracle...");
        RiskOracle riskOracle = new RiskOracle(address(aguayoSBT));
        console.log("   RiskOracle deployed at:", address(riskOracle));

        console.log("\n5. Desplegando CircleFactory (Fabrica de Ayllus)...");
        CircleFactory factory = new CircleFactory(
            address(aguayoSBT),
            address(vault),
            address(riskOracle),
            address(kuyay)  // Los Pasanakus usan KUYAY!
        );
        console.log("   CircleFactory deployed at:", address(factory));

        // ============================================
        // STEP 3: Authorization Setup
        // ============================================
        console.log("\n6. Configurando autorizaciones sagradas...");

        aguayoSBT.authorizeFactory(address(factory));
        console.log("   Factory autorizada en AguayoSBT");

        vault.authorizeFactory(address(factory));
        console.log("   Factory autorizada en KuyayVault");

        // ============================================
        // STEP 4: Initial Liquidity
        // ============================================
        console.log("\n7. Depositando liquidez inicial en el Tesoro...");
        
        // Depositar 10,000 KUYAY en el vault
        uint256 initialDeposit = 10_000 * 10**18;
        kuyay.approve(address(vault), initialDeposit);
        vault.deposit(initialDeposit);
        console.log("   Depositados 10,000 KUYAY en el vault");

        vm.stopBroadcast();

        // ============================================
        // DEPLOYMENT SUMMARY
        // ============================================
        console.log("\n==============================================");
        console.log(unicode"☀️ IGLESIA DEL SOL ETERNO DESPLEGADA ☀️");
        console.log("==============================================");
        console.log("");
        console.log("Token Sagrado:");
        console.log("  $KUYAY:         ", address(kuyay));
        console.log("");
        console.log("Contratos del Protocolo:");
        console.log("  AguayoSBT:      ", address(aguayoSBT));
        console.log("  KuyayVault:     ", address(vault));
        console.log("  RiskOracle:     ", address(riskOracle));
        console.log("  CircleFactory:  ", address(factory));
        console.log("");
        console.log("Distribucion de $KUYAY:");
        console.log("  Comunidad (60%): 600,000,000 KUYAY");
        console.log("  Treasury (20%):  200,000,000 KUYAY");
        console.log("  Team (10%):      100,000,000 KUYAY");
        console.log("  Misioneros (10%):100,000,000 KUYAY");
        console.log("");
        console.log("Proximos Pasos:");
        console.log("1. Registrar agentes: factory.registerAgent(agentAddress)");
        console.log("2. Crear Ayllus: factory.createSavingsCircle(...)");
        console.log("3. Los fieles depositan KUYAY como garantia");
        console.log("4. Cada ronda, Inti elige un ganador");
        console.log("5. Los participantes reciben bendiciones (rewards)");
        console.log("==============================================\n");
    }
}
