// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AguayoSBT.sol";
import "../src/KuyayVault.sol";
import "../src/RiskOracle.sol";
import "../src/CircleFactory.sol";

/**
 * @title DeployMonad
 * @notice Deployment script for Kuyay Protocol on Monad Testnet
 * @dev Run with: forge script script/DeployMonad.s.sol --rpc-url monad_testnet --broadcast
 */
contract DeployMonad is Script {

    // Para testing usaremos un mock de USDC
    // En producción, esto sería el USDC real de Monad
    address public USDC_ADDRESS;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("DEPLOYING KUYAY PROTOCOL TO MONAD TESTNET");
        console.log("==============================================");
        console.log("Deployer address:", deployer);
        console.log("Chain ID: 10143 (Monad Testnet)");

        vm.startBroadcast(deployerPrivateKey);

        // ============================================
        // STEP 0: Deploy Mock USDC (for testnet only)
        // ============================================
        console.log("\n0. Deploying Mock USDC for testing...");
        MockUSDC usdc = new MockUSDC();
        USDC_ADDRESS = address(usdc);
        console.log("   Mock USDC deployed at:", USDC_ADDRESS);

        // Mint some USDC to deployer for testing
        usdc.mint(deployer, 1_000_000 * 10**6); // 1M USDC
        console.log("   Minted 1M USDC to deployer");

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
            USDC_ADDRESS,   // asset (Mock USDC)
            deployer        // treasury
        );
        console.log("   KuyayVault deployed at:", address(vault));

        // ============================================
        // STEP 3: Deploy RiskOracle
        // ============================================
        console.log("\n3. Deploying RiskOracle...");
        RiskOracle riskOracle = new RiskOracle(address(aguayoSBT));
        console.log("   RiskOracle deployed at:", address(riskOracle));

        // ============================================
        // STEP 4: Deploy CircleFactory (NO VRF params!)
        // ============================================
        console.log("\n4. Deploying CircleFactory (Monad version - no VRF)...");
        CircleFactory factory = new CircleFactory(
            address(aguayoSBT),
            address(vault),
            address(riskOracle),
            USDC_ADDRESS
        );
        console.log("   CircleFactory deployed at:", address(factory));

        // ============================================
        // STEP 5: Authorization Setup
        // ============================================
        console.log("\n5. Setting up authorizations...");

        aguayoSBT.authorizeFactory(address(factory));
        console.log("   Factory authorized in AguayoSBT");

        vault.authorizeFactory(address(factory));
        console.log("   Factory authorized in KuyayVault");

        // ============================================
        // STEP 6: Initial Liquidity (for testing)
        // ============================================
        console.log("\n6. Providing initial vault liquidity...");
        usdc.approve(address(vault), 100_000 * 10**6);
        vault.deposit(100_000 * 10**6);
        console.log("   Deposited 100k USDC to vault");

        vm.stopBroadcast();

        // ============================================
        // DEPLOYMENT SUMMARY
        // ============================================
        console.log("\n==============================================");
        console.log("KUYAY PROTOCOL DEPLOYMENT SUCCESSFUL!");
        console.log("==============================================");
        console.log("Network: Monad Testnet (Chain ID: 10143)");
        console.log("Deployer:", deployer);
        console.log("\nCore Contracts:");
        console.log("  AguayoSBT:      ", address(aguayoSBT));
        console.log("  KuyayVault:     ", address(vault));
        console.log("  RiskOracle:     ", address(riskOracle));
        console.log("  CircleFactory:  ", address(factory));
        console.log("  Mock USDC:      ", USDC_ADDRESS);
        console.log("\nMonad-specific features:");
        console.log("  - Using prevrandao for randomness (no Chainlink VRF)");
        console.log("  - Instant draw execution (no callback wait)");
        console.log("  - Agent support enabled");
        console.log("\nNext Steps:");
        console.log("1. Register AI agents with factory.registerAgent(agentAddress)");
        console.log("2. Create test circles with createAgentCircle()");
        console.log("3. Update frontend with contract addresses");
        console.log("==============================================\n");
    }
}

// Simple Mock USDC for testing
contract MockUSDC {
    string public name = "USD Coin (Mock)";
    string public symbol = "USDC";
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
