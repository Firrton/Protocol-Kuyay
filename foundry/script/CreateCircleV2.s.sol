// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/CircleFaithFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CreateCircleV2 is Script {
    
    address constant FACTORY_V2 = 0x61FC4578863DA32DC4e879F59e1cb673dA498618;
    address constant USDC = 0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2;
    address constant KUYAY = 0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c;
    
    // Sayuri Agent Address (as second member)
    address constant SAYURI = 0x3F2A12c8eFE7074F547f151ba5A5208e46F42c02;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("-----------------------------------------");
        console.log("TESTING CIRCLE CREATION ON FACTORY V2");
        console.log("Deployer:", deployer);
        console.log("-----------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Approve Tokens to Factory V2
        // CRITICAL: Sayuri probably missed this step for the NEW address
        console.log(unicode"🔐 Approving USDC to Factory V2...");
        IERC20(USDC).approve(FACTORY_V2, 10000e6); // Approve ample amount
        
        console.log(unicode"🔐 Approving KUYAY to Factory V2...");
        IERC20(KUYAY).approve(FACTORY_V2, 1000e18); // Approve ample amount

        // 2. Prepare Params
        address[] memory members = new address[](2);
        members[0] = deployer;
        members[1] = SAYURI;

        uint256 guarantee = 100e6;       // 100 USDC
        uint256 cuota = 50e6;            // 50 USDC
        uint256 minFaith = 10e18;        // 10 KUYAY

        // 3. Create Circle
        console.log(unicode"🎯 Calling createFaithCircle...");
        CircleFaithFactory factory = CircleFaithFactory(FACTORY_V2);
        
        try factory.createFaithCircle(members, guarantee, cuota, minFaith) returns (address circle) {
            console.log(unicode"✅ SUCCESS! Circle created at:", circle);
        } catch Error(string memory reason) {
            console.log(unicode"💀 REVERT: ", reason);
        } catch (bytes memory lowLevelData) {
            console.log(unicode"💀 LOW LEVEL REVERT");
            console.logBytes(lowLevelData);
        }

        vm.stopBroadcast();
    }
}
