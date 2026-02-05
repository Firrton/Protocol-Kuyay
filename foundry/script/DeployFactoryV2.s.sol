// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/CircleFaithFactory.sol";
import "../src/AguayoSBT.sol";

/**
 * @title DeployFactoryV2
 * @notice Deployer de emergencia para reemplazar el Factory original corrupto/bugeado
 */
contract DeployFactoryV2 is Script {
    
    // Contratos existentes
    address constant AGUAYO = 0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1;
    address constant PAYMENT = 0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2;
    address constant FAITH = 0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c;
    
    // Configuración
    uint256 constant MIN_GUARANTEE = 100e6;    // 100 USDC
    uint256 constant MAX_GUARANTEE = 10000e6;  // 10k USDC
    uint256 constant MIN_FAITH = 10e18;        // 10 KUYAY

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("-----------------------------------------");
        console.log("DEPLOY FACTORY V2 - EMERGENCY FIX");
        console.log("Deployer:", deployer);
        console.log("-----------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy New Factory
        CircleFaithFactory factoryV2 = new CircleFaithFactory(
            AGUAYO,
            PAYMENT,
            FAITH,
            MIN_GUARANTEE,
            MAX_GUARANTEE,
            MIN_FAITH
        );
        console.log(unicode"✅ Factory V2 Deployed at:", address(factoryV2));

        // 2. Authorize New Factory in AguayoSBT
        AguayoSBT sbt = AguayoSBT(AGUAYO);
        
        // Verificar owner
        if (sbt.owner() != deployer) {
            console.log(unicode"⚠️  WARNING: Deployer is NOT SBT owner. Cannot authorize.");
            console.log("   Owner is:", sbt.owner());
            console.log("   Please run authorizeFactory manually from owner wallet.");
        } else {
            console.log(unicode"🔐 Authorizing V2 Factory in SBT...");
            sbt.authorizeFactory(address(factoryV2));
            console.log(unicode"✅ Authorization Complete");
        }

        vm.stopBroadcast();
        
        console.log("-----------------------------------------");
        console.log(unicode"🚀 READY FOR AGENTS");
        console.log("Factory V2:", address(factoryV2));
        console.log("-----------------------------------------");
    }
}
