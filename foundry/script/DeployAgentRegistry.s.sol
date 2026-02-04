// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AgentRegistry.sol";

/**
 * @title DeployAgentRegistry
 * @notice Deploys the ERC-8004 compatible AgentRegistry and registers the Trinity
 * 
 * Usage:
 * export PRIVATE_KEY=your_private_key
 * forge script script/DeployAgentRegistry.s.sol \
 *   --tc DeployAgentRegistry \
 *   --rpc-url monad_testnet \
 *   --broadcast \
 *   -vvvv
 */
contract DeployAgentRegistry is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("");
        console.log("====================================================");
        console.log("   ERC-8004 AGENT REGISTRY DEPLOYMENT");
        console.log("   Iglesia del Sol Eterno - La Santa Trinidad");
        console.log("====================================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy AgentRegistry
        console.log("[1/4] Deploying AgentRegistry...");
        AgentRegistry registry = new AgentRegistry();
        console.log("   Address:", address(registry));
        console.log("   Registry ID:", registry.getRegistryIdentifier());
        
        // 2. Register Inti Theologist (Agent #1)
        console.log("");
        console.log("[2/4] Registering: Inti Theologist (El Sabio)...");
        string memory intiURI = "https://protocol-kuyay.vercel.app/agents/inti-theologist.json";
        uint256 intiId = registry.registerAgent("Inti Theologist", intiURI);
        console.log("   Agent ID:", intiId);
        
        // 3. Register Kuyay Economist (Agent #2)
        console.log("");
        console.log("[3/4] Registering: Kuyay Economist (El Matematico)...");
        string memory economistURI = "https://protocol-kuyay.vercel.app/agents/kuyay-economist.json";
        uint256 economistId = registry.registerAgent("Kuyay Economist", economistURI);
        console.log("   Agent ID:", economistId);
        
        // 4. Register Sun Inquisitor (Agent #3)
        console.log("");
        console.log("[4/4] Registering: Sun Inquisitor (El Guerrero)...");
        string memory inquisitorURI = "https://protocol-kuyay.vercel.app/agents/sun-inquisitor.json";
        uint256 inquisitorId = registry.registerAgent("Sun Inquisitor", inquisitorURI);
        console.log("   Agent ID:", inquisitorId);
        
        vm.stopBroadcast();
        
        // Summary
        console.log("");
        console.log("====================================================");
        console.log("   DEPLOYMENT COMPLETE - LA TRINIDAD REGISTRADA");
        console.log("====================================================");
        console.log("");
        console.log("AgentRegistry:", address(registry));
        console.log("");
        console.log("Registered Agents:");
        console.log("  [1] Inti Theologist  - El Sabio");
        console.log("  [2] Kuyay Economist  - El Matematico");
        console.log("  [3] Sun Inquisitor   - El Guerrero");
        console.log("");
        console.log("ERC-8004 Registry Identifier:");
        console.log("  ", registry.getRegistryIdentifier());
        console.log("");
        console.log("Agent URIs:");
        console.log("  [1]", intiURI);
        console.log("  [2]", economistURI);
        console.log("  [3]", inquisitorURI);
        console.log("");
        console.log("====================================================");
        console.log("   Que Inti bendiga a los agentes!");
        console.log("====================================================");
    }
}
