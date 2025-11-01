// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AguayoSBT.sol";
import "../src/KuyayVault.sol";
import "../src/RiskOracle.sol";
import "../src/CircleFactory.sol";

/**
 * @title DeployKuyay
 * @notice Deployment script for Kuyay Protocol on Arbitrum Sepolia
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url arbitrum_sepolia --broadcast --verify
 */
contract DeployKuyay is Script {

    // Direcciones en Arbitrum Sepolia
    address constant USDC_ARBITRUM_SEPOLIA = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address constant VRF_COORDINATOR = 0x50D47e4142598E17717b3e7EaE675191bDBF99ec;
    bytes32 constant VRF_KEY_HASH = 0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414;

    // VRF V2 Plus Subscription ID (uint256)
    uint256 constant VRF_SUBSCRIPTION_ID = 91781738671402494691607822759376040948288878753610310189815626169487952068291;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Kuyay Protocol to Arbitrum Sepolia...");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // ============================================
        // STEP 1: Deploy AguayoSBT (Identity System)
        // ============================================
        console.log("\n1. Deploying AguayoSBT...");
        AguayoSBT aguayoSBT = new AguayoSBT();
        console.log("   AguayoSBT deployed at:", address(aguayoSBT));

        // ============================================
        // STEP 2: Deploy KuyayVault (Treasury)
        // ============================================
        console.log("\n2. Deploying KuyayVault...");
        KuyayVault vault = new KuyayVault(
            USDC_ARBITRUM_SEPOLIA,  // asset (USDC)
            deployer                 // treasury (initially deployer)
        );
        console.log("   KuyayVault deployed at:", address(vault));

        // ============================================
        // STEP 3: Deploy RiskOracle
        // ============================================
        console.log("\n3. Deploying RiskOracle...");
        RiskOracle riskOracle = new RiskOracle(address(aguayoSBT));
        console.log("   RiskOracle deployed at:", address(riskOracle));

        // ============================================
        // STEP 4: Deploy CircleFactory
        // ============================================
        console.log("\n4. Deploying CircleFactory...");
        CircleFactory factory = new CircleFactory(
            address(aguayoSBT),
            address(vault),
            address(riskOracle),
            USDC_ARBITRUM_SEPOLIA,
            VRF_COORDINATOR,
            VRF_SUBSCRIPTION_ID,
            VRF_KEY_HASH
        );
        console.log("   CircleFactory deployed at:", address(factory));

        // ============================================
        // STEP 5: Authorization Setup
        // ============================================
        console.log("\n5. Setting up authorizations...");

        // Authorize Factory in AguayoSBT (so it can authorize new Circles)
        aguayoSBT.authorizeFactory(address(factory));
        console.log("   Factory authorized in AguayoSBT");

        // Authorize Factory in KuyayVault (so it can authorize new Circles)
        vault.authorizeFactory(address(factory));
        console.log("   Factory authorized in KuyayVault");

        vm.stopBroadcast();

        // ============================================
        // DEPLOYMENT SUMMARY
        // ============================================
        console.log("\n==============================================");
        console.log("KUYAY PROTOCOL DEPLOYMENT SUCCESSFUL!");
        console.log("==============================================");
        console.log("Network: Arbitrum Sepolia");
        console.log("Deployer:", deployer);
        console.log("\nCore Contracts:");
        console.log("  AguayoSBT:      ", address(aguayoSBT));
        console.log("  KuyayVault:     ", address(vault));
        console.log("  RiskOracle:     ", address(riskOracle));
        console.log("  CircleFactory:  ", address(factory));
        console.log("\nDependencies:");
        console.log("  USDC:           ", USDC_ARBITRUM_SEPOLIA);
        console.log("  VRF Coordinator:", VRF_COORDINATOR);
        console.log("  VRF Key Hash:   ", vm.toString(VRF_KEY_HASH));
        console.log("  VRF Sub ID:     ", VRF_SUBSCRIPTION_ID);
        console.log("\nNext Steps:");
        console.log("1. Add the CircleFactory to your Chainlink VRF subscription");
        console.log("2. Fund the KuyayVault with initial liquidity (if deploying for LPs)");
        console.log("3. Verify contracts on Arbiscan (if not auto-verified)");
        console.log("4. Update frontend with contract addresses");
        console.log("==============================================\n");

        // Save addresses to file
        string memory contractAddresses = string(abi.encodePacked(
            "AGUAYO_SBT=", vm.toString(address(aguayoSBT)), "\n",
            "KUYAY_VAULT=", vm.toString(address(vault)), "\n",
            "RISK_ORACLE=", vm.toString(address(riskOracle)), "\n",
            "CIRCLE_FACTORY=", vm.toString(address(factory)), "\n"
        ));

        // Addresses printed above - copy manually or check broadcast logs
        console.log("\n Copy the addresses above to update your frontend!");
    }
}