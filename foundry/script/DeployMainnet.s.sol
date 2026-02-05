// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AguayoSBT.sol";
import "../src/CircleFaithFactory.sol";

/**
 * @title DeployMainnet
 * @notice Script maestro para deployar Kuyay Protocol en Monad Mainnet
 * @dev Incluye AguayoSBT (Identidad) y CircleFaithFactory (Logica Principal)
 */
contract DeployMainnet is Script {
    
    // ============================================
    // CONFIGURACION MAINNET
    // ============================================
    
    // Contratos existentes
    address public constant KUYAY_TOKEN = 0xF10Fba346c07110A2A8543Df8659F0b600fD7777;
    address public constant REAL_USDC = 0x754704Bc059F8C67012fEd69BC8A327a5aafb603;

    // Parametros del Protocolo
    uint256 public constant MIN_GUARANTEE = 1 * 10**6;     // 1 USDC (para pruebas accesibles)
    uint256 public constant MAX_GUARANTEE = 100000 * 10**6; // 100k USDC
    uint256 public constant MIN_FAITH = 1 * 10**18;        // 1 KUYAY

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("DEPLOYING KUYAY PROTOCOL TO MONAD MAINNET");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID: 143 (Monad Mainnet)");
        console.log("Tokens:");
        console.log(" - KUYAY:", KUYAY_TOKEN);
        console.log(" - USDC:", REAL_USDC);
        console.log("----------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy AguayoSBT (Identidad)
        console.log("");
        console.log("1. Deploying AguayoSBT...");
        AguayoSBT aguayoSBT = new AguayoSBT();
        console.log("AguayoSBT deployed at:", address(aguayoSBT));

        // 2. Deploy CircleFaithFactory (Logica de Circulos)
        console.log("");
        console.log("2. Deploying CircleFaithFactory...");
        CircleFaithFactory factory = new CircleFaithFactory(
            address(aguayoSBT),
            REAL_USDC,
            KUYAY_TOKEN,
            MIN_GUARANTEE,
            MAX_GUARANTEE,
            MIN_FAITH
        );
        console.log("CircleFaithFactory deployed at:", address(factory));

        // 3. Setup Authorizations
        console.log("");
        console.log("3. Authorizing Factory in AguayoSBT...");
        aguayoSBT.authorizeFactory(address(factory));
        console.log("Factory authorized successfully");

        vm.stopBroadcast();
        
        console.log("");
        console.log("==============================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("==============================================");
        console.log("AguayoSBT (Identity):   ", address(aguayoSBT));
        console.log("CircleFaithFactory:     ", address(factory));
        console.log("KUYAY Token:            ", KUYAY_TOKEN);
        console.log("USDC:                   ", REAL_USDC);
        console.log("==============================================");
    }
}

