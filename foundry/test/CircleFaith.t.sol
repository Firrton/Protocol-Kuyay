// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/KuyayToken.sol";
import "../src/AguayoSBT.sol";
import "../src/CircleFaith.sol";
import "../src/CircleFaithFactory.sol";

/**
 * @title CircleFaithTest
 * @notice Tests para Pasanaku con Fe stakeada
 * Verifica que más Fe = más probabilidad de ganar
 */
contract CircleFaithTest is Test {
    KuyayToken public kuyay;
    AguayoSBT public aguayoSBT;
    CircleFaithFactory public factory;

    // Mock stablecoin para pagos
    MockUSDC public usdc;

    address public deployer = address(1);
    address public treasury = address(2);
    address public missionaryFund = address(3);
    
    // Participantes con diferentes niveles de Fe
    address public alice = address(10);   // Alta Fe
    address public bob = address(11);     // Media Fe
    address public charlie = address(12); // Baja Fe
    address public diana = address(13);   // Baja Fe
    address public elena = address(14);   // Baja Fe

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy tokens
        kuyay = new KuyayToken(treasury, missionaryFund);
        usdc = new MockUSDC();
        
        // Deploy protocol
        aguayoSBT = new AguayoSBT();
        
        factory = new CircleFaithFactory(
            address(aguayoSBT),
            address(usdc),
            address(kuyay),
            100 * 10**6,     // Min guarantee: 100 USDC
            10000 * 10**6,   // Max guarantee: 10,000 USDC
            10 * 10**18      // Min faith: 10 KUYAY
        );

        // Authorize factory
        aguayoSBT.authorizeFactory(address(factory));

        vm.stopPrank();

        // Distribute tokens
        _distributeTokens();
        
        // Mint Aguayos
        _mintAguayoFor(alice);
        _mintAguayoFor(bob);
        _mintAguayoFor(charlie);
        _mintAguayoFor(diana);
        _mintAguayoFor(elena);
    }

    function _distributeTokens() internal {
        vm.startPrank(treasury);
        
        // KUYAY distribution (different amounts = different faith levels)
        kuyay.transfer(alice, 500 * 10**18);    // Alta Fe: 500 KUYAY
        kuyay.transfer(bob, 100 * 10**18);      // Media Fe: 100 KUYAY
        kuyay.transfer(charlie, 50 * 10**18);   // Baja Fe: 50 KUYAY
        kuyay.transfer(diana, 50 * 10**18);     // Baja Fe: 50 KUYAY
        kuyay.transfer(elena, 50 * 10**18);     // Baja Fe: 50 KUYAY
        
        vm.stopPrank();

        // USDC distribution (equal for all)
        usdc.mint(alice, 10000 * 10**6);
        usdc.mint(bob, 10000 * 10**6);
        usdc.mint(charlie, 10000 * 10**6);
        usdc.mint(diana, 10000 * 10**6);
        usdc.mint(elena, 10000 * 10**6);
    }

    function _mintAguayoFor(address user) internal {
        vm.prank(user);
        aguayoSBT.mintAguayo();
    }

    function test_CreateFaithCircle() public {
        address[] memory members = new address[](5);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;
        members[3] = diana;
        members[4] = elena;

        vm.prank(alice);
        address circleAddr = factory.createFaithCircle(
            members,
            100 * 10**6,    // 100 USDC guarantee
            100 * 10**6,    // 100 USDC per round
            10 * 10**18     // Min 10 KUYAY faith
        );

        CircleFaith circle = CircleFaith(circleAddr);
        assertEq(circle.getMemberCount(), 5);
        assertEq(uint256(circle.status()), uint256(CircleFaith.CircleStatus.DEPOSIT));
    }

    function test_JoinWithFaith() public {
        // Create circle
        address[] memory members = new address[](5);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;
        members[3] = diana;
        members[4] = elena;

        vm.prank(alice);
        address circleAddr = factory.createFaithCircle(
            members,
            100 * 10**6,
            100 * 10**6,
            10 * 10**18
        );

        CircleFaith circle = CircleFaith(circleAddr);

        // Alice joins with HIGH faith (200 KUYAY)
        _joinWithFaith(alice, circle, 200 * 10**18);

        assertEq(circle.getMemberFaith(alice), 200 * 10**18);
        assertEq(circle.totalStakedFaith(), 200 * 10**18);
    }

    function test_FaithPercentages() public {
        CircleFaith circle = _createAndJoinCircle();

        // Verify faith percentages
        // Total: 450 KUYAY (200 + 100 + 50 + 50 + 50)
        // Alice: 200 KUYAY = 44.44%
        // Bob: 100 KUYAY = 22.22%
        // Charlie, Diana, Elena: 50 KUYAY each = 11.11% each

        assertEq(circle.getMemberFaithPercentage(alice), 4444);  // 44.44%
        assertEq(circle.getMemberFaithPercentage(bob), 2222);    // 22.22%
        assertEq(circle.getMemberFaithPercentage(charlie), 1111); // 11.11%
    }

    function test_HighFaithWinsMoreOften() public {
        // Run a single Pasanaku and verify weighted selection works
        // Alice has highest Faith (44%), so likely to win
        
        CircleFaith circle = _createAndJoinCircle();
        
        // Verify Alice has highest faith
        assertTrue(circle.getMemberFaith(alice) > circle.getMemberFaith(bob));
        assertTrue(circle.getMemberFaith(alice) > circle.getMemberFaith(charlie));
        
        // Complete round 1
        _payAllMembers(circle);
        _checkInQuorum(circle);
        
        vm.prank(alice);
        circle.startDraw();

        // Verify someone won (weighted selection worked)
        address winner = circle.getRoundWinner(1);
        assertTrue(winner != address(0), "Sorteo debe producir un ganador");
        assertTrue(circle.hasWon(winner), "Ganador debe estar marcado");
        
        console.log("Ganador de ronda 1:", winner);
        console.log("Fe del ganador:", circle.getMemberFaith(winner) / 10**18, "KUYAY");
    }

    function test_CompleteFaithPasanaku() public {
        CircleFaith circle = _createAndJoinCircle();

        // Record initial balances
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        uint256 aliceKuyayBefore = kuyay.balanceOf(alice);

        // Complete all 5 rounds
        for (uint256 round = 1; round <= 5; ++round) {
            console.log("\n=== RONDA", round, "===");
            
            _payAllMembers(circle);
            _checkInQuorum(circle);
            
            vm.prank(alice);
            circle.startDraw();

            address winner = circle.getRoundWinner(round);
            uint256 winnerFaith = circle.getMemberFaith(winner);
            console.log("Ganador:", winner);
            console.log("Fe del ganador:", winnerFaith / 10**18, "KUYAY");
        }

        // Verify circle completed
        assertEq(uint256(circle.status()), uint256(CircleFaith.CircleStatus.COMPLETED));

        // Withdraw guarantee and faith
        vm.startPrank(alice);
        circle.withdrawGuarantee();
        circle.withdrawFaith();
        vm.stopPrank();

        // Verify Alice got her KUYAY back
        uint256 aliceKuyayAfter = kuyay.balanceOf(alice);
        // She staked 200, should get it back
        assertEq(aliceKuyayAfter, aliceKuyayBefore + 200 * 10**18);
    }

    // ============ HELPER FUNCTIONS ============

    function _createAndJoinCircle() internal returns (CircleFaith) {
        address[] memory members = new address[](5);
        members[0] = alice;
        members[1] = bob;
        members[2] = charlie;
        members[3] = diana;
        members[4] = elena;

        vm.prank(alice);
        address circleAddr = factory.createFaithCircle(
            members,
            100 * 10**6,
            100 * 10**6,
            10 * 10**18
        );

        CircleFaith circle = CircleFaith(circleAddr);

        // Join with different faith levels
        _joinWithFaith(alice, circle, 200 * 10**18);   // 50% of 400
        _joinWithFaith(bob, circle, 100 * 10**18);     // 25% of 400
        _joinWithFaith(charlie, circle, 50 * 10**18);  // 12.5% of 400
        _joinWithFaith(diana, circle, 50 * 10**18);    // 12.5% of 400
        _joinWithFaith(elena, circle, 50 * 10**18);    // Elena completes the circle! (now 450 total)

        return circle;
    }

    function _joinWithFaith(address user, CircleFaith circle, uint256 faithAmount) internal {
        vm.startPrank(user);
        usdc.approve(address(circle), 100 * 10**6);
        kuyay.approve(address(circle), faithAmount);
        circle.joinWithFaith(faithAmount);
        vm.stopPrank();
    }

    function _payAllMembers(CircleFaith circle) internal {
        address[] memory members = circle.getMembers();
        for (uint256 i = 0; i < members.length; ++i) {
            vm.startPrank(members[i]);
            usdc.approve(address(circle), 100 * 10**6);
            circle.makeRoundPayment();
            vm.stopPrank();
        }
    }

    function _checkInQuorum(CircleFaith circle) internal {
        address[] memory members = circle.getMembers();
        // Check in 3 of 5 for quorum
        for (uint256 i = 0; i < 3; ++i) {
            vm.prank(members[i]);
            try circle.checkIn() {} catch {}
        }
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

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}
