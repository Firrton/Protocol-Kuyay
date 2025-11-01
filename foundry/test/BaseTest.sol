// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AguayoSBT.sol";
import "../src/Circle.sol";
import "../src/CircleFactory.sol";
import "../src/KuyayVault.sol";
import "../src/RiskOracle.sol";
import "./mocks/MockVRFCoordinator.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title BaseTest
 * @notice Setup común para todos los tests del protocolo Kuyay
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 10**6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract BaseTest is Test {
    // Contratos del protocolo
    AguayoSBT public aguayoSBT;
    CircleFactory public factory;
    KuyayVault public vault;
    RiskOracle public riskOracle;
    MockVRFCoordinator public vrfCoordinator;
    MockUSDC public usdc;

    // Direcciones de prueba
    address public owner;
    address public treasury;
    address public alice;
    address public bob;
    address public charlie;
    address public david;
    address public eve;

    // Configuración VRF
    uint64 public constant VRF_SUBSCRIPTION_ID = 1;
    bytes32 public constant VRF_KEY_HASH = keccak256("test");

    // Cantidades comunes
    uint256 public constant INITIAL_BALANCE = 100_000 * 10**6; // 100k USDC
    uint256 public constant DEFAULT_GUARANTEE = 1000 * 10**6;  // 1000 USDC
    uint256 public constant DEFAULT_CUOTA = 100 * 10**6;       // 100 USDC

    function setUp() public virtual {
        // Setup direcciones
        owner = address(this);
        treasury = makeAddr("treasury");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        david = makeAddr("david");
        eve = makeAddr("eve");

        // Deploy USDC mock
        usdc = new MockUSDC();

        // Deploy VRF mock
        vrfCoordinator = new MockVRFCoordinator();

        // Deploy protocolo
        aguayoSBT = new AguayoSBT();
        vault = new KuyayVault(address(usdc), treasury);
        riskOracle = new RiskOracle(address(aguayoSBT));

        factory = new CircleFactory(
            address(aguayoSBT),
            address(vault),
            address(riskOracle),
            address(usdc),
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID,
            VRF_KEY_HASH
        );

        // Autorizar factory
        aguayoSBT.authorizeFactory(address(factory));
        vault.authorizeFactory(address(factory));

        // Distribuir USDC a usuarios de prueba
        address[] memory users = _getTestUsers();
        for (uint256 i = 0; i < users.length; i++) {
            usdc.mint(users[i], INITIAL_BALANCE);
        }

        // Fondear vault con liquidez
        usdc.mint(address(this), 1_000_000 * 10**6);
        usdc.approve(address(vault), 1_000_000 * 10**6);
        vault.deposit(500_000 * 10**6);
    }

    function _getTestUsers() internal view returns (address[] memory) {
        address[] memory users = new address[](5);
        users[0] = alice;
        users[1] = bob;
        users[2] = charlie;
        users[3] = david;
        users[4] = eve;
        return users;
    }

    // Helper: Mintea Aguayos para usuarios
    function _mintAguayosForUsers(address[] memory users) internal {
        for (uint256 i = 0; i < users.length; i++) {
            vm.prank(users[i]);
            aguayoSBT.mintAguayo();
        }
    }

    // Helper: Sube nivel de Aguayos para que califiquen para crédito
    function _upgradeAguayosToLevel1(address[] memory users) internal {
        for (uint256 i = 0; i < users.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(users[i]);

            // Autoriza temporalmente este contrato
            aguayoSBT.authorizeCircle(address(this));

            // Añade un borde para subir a nivel 1
            aguayoSBT.addBorder(tokenId);

            // Revoca autorización
            aguayoSBT.revokeCircle(address(this));
        }
    }

    // Helper: Crea un círculo de ahorro básico
    function _createSavingsCircle(address[] memory members)
        internal
        returns (Circle)
    {
        vm.prank(members[0]);
        address circleAddr = factory.createSavingsCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        );
        return Circle(circleAddr);
    }

    // Helper: Crea un círculo de crédito básico
    function _createCreditCircle(address[] memory members)
        internal
        returns (Circle)
    {
        vm.prank(members[0]);
        address circleAddr = factory.createCreditCircle(
            members,
            DEFAULT_GUARANTEE,
            DEFAULT_CUOTA
        );
        return Circle(circleAddr);
    }

    // Helper: Todos depositan garantías
    function _depositGuarantees(Circle circle, address[] memory members) internal {
        for (uint256 i = 0; i < members.length; i++) {
            vm.startPrank(members[i]);
            usdc.approve(address(circle), DEFAULT_GUARANTEE);
            circle.depositGuarantee();
            vm.stopPrank();
        }
    }

    // Helper: Todos pagan ronda actual
    function _payCurrentRound(Circle circle, address[] memory members) internal {
        for (uint256 i = 0; i < members.length; i++) {
            vm.startPrank(members[i]);
            usdc.approve(address(circle), DEFAULT_CUOTA);
            circle.makeRoundPayment();
            vm.stopPrank();
        }
    }

    // Helper: Simula respuesta VRF
    function _fulfillVRF(Circle circle) internal {
        uint256 requestId = circle.pendingRequestId();
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao)));

        vrfCoordinator.fulfillRandomWords(requestId, address(circle), randomWords);
    }
}
