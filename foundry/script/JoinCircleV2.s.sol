// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/CircleFaith.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract JoinCircleV2 is Script {
    
    address constant CIRCLE = 0xb89fe53AbB27B9EeF58525488472A1148c75C73a;
    address constant USDC = 0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2;
    address constant KUYAY = 0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("-----------------------------------------");
        console.log("JOINING CIRCLE - DEPLOYER ACTION");
        console.log("Circle:", CIRCLE);
        console.log("-----------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Approve Tokens to Circle (Not Factory)
        uint256 guarantee = 100e6;       // 100 USDC
        uint256 faithStake = 10e18;      // 10 KUYAY

        console.log(unicode"🔐 Approving USDC to Circle...");
        IERC20(USDC).approve(CIRCLE, guarantee);
        
        console.log(unicode"🔐 Approving KUYAY to Circle...");
        IERC20(KUYAY).approve(CIRCLE, faithStake);

        // 2. Join With Faith
        console.log(unicode"🤝 Joining Circle (Deposit Guarantee + Faith)...");
        CircleFaith circle = CircleFaith(CIRCLE);
        
        try circle.joinWithFaith(faithStake) {
            console.log(unicode"✅ SUCCESS! Deployer joined.");
        } catch Error(string memory reason) {
            console.log(unicode"💀 REVERT: ", reason);
        }

        // 3. Check State
        (CircleFaith.CircleStatus status, , , ) = circle.getCircleState();
        if (status == CircleFaith.CircleStatus.ACTIVE) {
            console.log(unicode"🚀 CIRCLE IS NOW ACTIVE! (Both joined)");
        } else {
            console.log(unicode"⏳ Checking Status: Waiting for others to join... (State 0)");
        }

        vm.stopBroadcast();
    }
}
