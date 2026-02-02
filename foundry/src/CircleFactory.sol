// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Circle.sol";
import "./AguayoSBT.sol";
import "./KuyayVault.sol";
import "./RiskOracle.sol";

/**
 * @title CircleFactory (Monad Version)
 * @author Kuyay Protocol
 * @notice Fábrica para crear y validar Circles
 * 
 * CAMBIOS vs Arbitrum:
 * - Removido Chainlink VRF parameters
 * - Añadido soporte para agentes AI
 * - Función createAgentCircle() para tandas entre agentes
 */
contract CircleFactory is Ownable {

    AguayoSBT public immutable aguayoSBT;
    KuyayVault public immutable vault;
    RiskOracle public immutable riskOracle;
    IERC20 public immutable asset;

    address[] public allCircles;

    mapping(address => uint256) public circleCreatedAt;
    mapping(address => address) public circleCreator;
    mapping(address => address[]) public userCircles;
    mapping(address => uint256) public userActiveCircles;

    // Agent registry
    mapping(address => bool) public isRegisteredAgent;
    address[] public registeredAgents;

    uint256 public minMembers = 2;  // Reducido para agentes
    uint256 public maxMembers = 50;
    uint256 public minGuaranteeAmount = 1 * 10**6;       // 1 USDC (reducido para testing)
    uint256 public maxGuaranteeAmount = 10000 * 10**6;   // 10,000 USDC

    event CircleCreated(
        address indexed circleAddress,
        address indexed creator,
        Circle.CircleMode mode,
        uint256 memberCount,
        uint256 guaranteeAmount,
        uint256 cuotaAmount
    );
    event AgentCircleCreated(
        address indexed circleAddress,
        uint256 agentCount,
        uint256 humanCount
    );
    event CircleCompleted(address indexed circleAddress);
    event MinMembersUpdated(uint256 newMin);
    event MaxMembersUpdated(uint256 newMax);
    event GuaranteeRangeUpdated(uint256 newMin, uint256 newMax);
    event AgentRegistered(address indexed agent);
    event AgentUnregistered(address indexed agent);

    error InvalidMemberCount();
    error DuplicateMember();
    error MemberNotEligible(address member);
    error InvalidGuaranteeAmount();
    error InvalidCuotaAmount();
    error InvalidParameter();
    error MemberLimitExceeded();
    error AgentAlreadyRegistered();
    error NotAnAgent();

    constructor(
        address _aguayoSBT,
        address _vault,
        address _riskOracle,
        address _asset
    ) Ownable(msg.sender) {
        aguayoSBT = AguayoSBT(_aguayoSBT);
        vault = KuyayVault(_vault);
        riskOracle = RiskOracle(_riskOracle);
        asset = IERC20(_asset);
    }

    /// @notice Registra una dirección como agente AI autorizado
    function registerAgent(address agent) external onlyOwner {
        if (isRegisteredAgent[agent]) revert AgentAlreadyRegistered();
        
        isRegisteredAgent[agent] = true;
        registeredAgents.push(agent);
        
        emit AgentRegistered(agent);
    }

    /// @notice Quita registro de agente
    function unregisterAgent(address agent) external onlyOwner {
        if (!isRegisteredAgent[agent]) revert NotAnAgent();
        
        isRegisteredAgent[agent] = false;
        emit AgentUnregistered(agent);
    }

    /// @notice Crea un Circle donde participan agentes AI
    /// @dev Los agentes deben estar registrados previamente
    function createAgentCircle(
        address[] calldata members,
        address[] calldata agents,
        uint256 guaranteeAmount,
        uint256 cuotaAmount
    ) external returns (address) {
        // Los agents también deben estar en members
        _validateCircleParams(members, guaranteeAmount, cuotaAmount, false);
        
        // Verificar que todos los agentes están registrados
        for (uint256 i = 0; i < agents.length; i++) {
            if (!isRegisteredAgent[agents[i]]) revert NotAnAgent();
        }

        Circle newCircle = new Circle(
            Circle.CircleMode.SAVINGS,
            members,
            guaranteeAmount,
            cuotaAmount,
            address(asset),
            address(aguayoSBT),
            address(vault),
            address(riskOracle)
        );

        address circleAddress = address(newCircle);

        // Registrar agentes en el Circle
        for (uint256 i = 0; i < agents.length; i++) {
            newCircle.registerAgent(agents[i]);
        }

        aguayoSBT.authorizeCircle(circleAddress);

        _recordCircle(circleAddress, members, Circle.CircleMode.SAVINGS, guaranteeAmount, cuotaAmount);

        emit AgentCircleCreated(
            circleAddress,
            agents.length,
            members.length - agents.length
        );

        return circleAddress;
    }

    // Crea un Circle de Ahorro (cualquiera con Aguayo puede participar)
    function createSavingsCircle(
        address[] calldata members,
        uint256 guaranteeAmount,
        uint256 cuotaAmount
    ) external returns (address) {
        _validateCircleParams(members, guaranteeAmount, cuotaAmount, false);

        Circle newCircle = new Circle(
            Circle.CircleMode.SAVINGS,
            members,
            guaranteeAmount,
            cuotaAmount,
            address(asset),
            address(aguayoSBT),
            address(vault),
            address(riskOracle)
        );

        address circleAddress = address(newCircle);

        aguayoSBT.authorizeCircle(circleAddress);

        _recordCircle(circleAddress, members, Circle.CircleMode.SAVINGS, guaranteeAmount, cuotaAmount);

        return circleAddress;
    }

    // Crea un Circle de Crédito (solo usuarios Nivel 1+ sin manchas)
    function createCreditCircle(
        address[] calldata members,
        uint256 guaranteeAmount,
        uint256 cuotaAmount
    ) external returns (address) {
        _validateCircleParams(members, guaranteeAmount, cuotaAmount, true);

        Circle newCircle = new Circle(
            Circle.CircleMode.CREDIT,
            members,
            guaranteeAmount,
            cuotaAmount,
            address(asset),
            address(aguayoSBT),
            address(vault),
            address(riskOracle)
        );

        address circleAddress = address(newCircle);

        aguayoSBT.authorizeCircle(circleAddress);
        vault.authorizeCircle(circleAddress);

        _recordCircle(circleAddress, members, Circle.CircleMode.CREDIT, guaranteeAmount, cuotaAmount);

        return circleAddress;
    }

    function _validateCircleParams(
        address[] calldata members,
        uint256 guaranteeAmount,
        uint256 cuotaAmount,
        bool isCreditMode
    ) internal view {
        if (members.length < minMembers || members.length > maxMembers) {
            revert InvalidMemberCount();
        }

        if (guaranteeAmount < minGuaranteeAmount || guaranteeAmount > maxGuaranteeAmount) {
            revert InvalidGuaranteeAmount();
        }

        if (cuotaAmount == 0 || cuotaAmount > guaranteeAmount) {
            revert InvalidCuotaAmount();
        }

        _validateMembers(members, isCreditMode);
    }

    function _validateMembers(address[] calldata members, bool isCreditMode) internal view {
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];

            // Buscar duplicados
            for (uint256 j = i + 1; j < members.length; j++) {
                if (member == members[j]) revert DuplicateMember();
            }

            // Agentes registrados no necesitan Aguayo
            if (isRegisteredAgent[member]) {
                continue;
            }

            // Verificar que humanos tengan Aguayo
            if (!aguayoSBT.hasAguayo(member)) {
                revert MemberNotEligible(member);
            }

            // Verificar elegibilidad según modo
            if (!riskOracle.isMemberEligible(member, isCreditMode)) {
                revert MemberNotEligible(member);
            }

            if (userActiveCircles[member] >= 5) {
                revert MemberLimitExceeded();
            }
        }

        // Validación grupal para modo crédito (solo humanos)
        if (isCreditMode) {
            address[] memory humanMembers = _getHumanMembers(members);
            if (humanMembers.length > 0 && !riskOracle.areAllMembersEligible(humanMembers)) {
                revert MemberNotEligible(address(0));
            }
        }
    }

    function _getHumanMembers(address[] calldata members) internal view returns (address[] memory) {
        uint256 humanCount = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (!isRegisteredAgent[members[i]]) {
                humanCount++;
            }
        }

        address[] memory humans = new address[](humanCount);
        uint256 index = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (!isRegisteredAgent[members[i]]) {
                humans[index] = members[i];
                index++;
            }
        }

        return humans;
    }

    function _recordCircle(
        address circleAddress,
        address[] calldata members,
        Circle.CircleMode mode,
        uint256 guaranteeAmount,
        uint256 cuotaAmount
    ) internal {
        allCircles.push(circleAddress);
        circleCreatedAt[circleAddress] = block.timestamp;
        circleCreator[circleAddress] = msg.sender;

        for (uint256 i = 0; i < members.length; i++) {
            userCircles[members[i]].push(circleAddress);
            userActiveCircles[members[i]]++;
        }

        emit CircleCreated(
            circleAddress,
            msg.sender,
            mode,
            members.length,
            guaranteeAmount,
            cuotaAmount
        );
    }

    // ============ VIEW FUNCTIONS ============

    function getAllCircles() external view returns (address[] memory) {
        return allCircles;
    }

    function getCircleCount() external view returns (uint256) {
        return allCircles.length;
    }

    function getUserCircles(address user) external view returns (address[] memory) {
        return userCircles[user];
    }

    function getRegisteredAgents() external view returns (address[] memory) {
        return registeredAgents;
    }

    function getAgentCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < registeredAgents.length; i++) {
            if (isRegisteredAgent[registeredAgents[i]]) {
                count++;
            }
        }
        return count;
    }

    function getCircleInfo(address circleAddress)
        external
        view
        returns (address creator, uint256 createdAt, bool exists)
    {
        return (
            circleCreator[circleAddress],
            circleCreatedAt[circleAddress],
            circleCreatedAt[circleAddress] > 0
        );
    }

    function isValidCircle(address circleAddress) external view returns (bool) {
        return circleCreatedAt[circleAddress] > 0;
    }

    // Simula creación de circle (dry-run para UI)
    function previewCircleCreation(address[] calldata members, bool isCreditMode)
        external
        view
        returns (bool eligible, uint256 leverageMultiplier, uint256 interestRate)
    {
        if (members.length < minMembers || members.length > maxMembers) {
            return (false, 0, 0);
        }

        for (uint256 i = 0; i < members.length; i++) {
            // Agentes siempre elegibles
            if (isRegisteredAgent[members[i]]) {
                continue;
            }

            if (!aguayoSBT.hasAguayo(members[i])) {
                return (false, 0, 0);
            }

            if (!riskOracle.isMemberEligible(members[i], isCreditMode)) {
                return (false, 0, 0);
            }
        }

        eligible = true;

        if (isCreditMode) {
            address[] memory humanMembers = _getHumanMembers(members);
            if (humanMembers.length > 0) {
                (leverageMultiplier, interestRate) = riskOracle.getLeverageLevel(humanMembers);
            }
        }

        return (eligible, leverageMultiplier, interestRate);
    }

    // ============ ADMIN FUNCTIONS ============

    function setMinMembers(uint256 newMin) external onlyOwner {
        if (newMin < 2 || newMin > maxMembers) revert InvalidParameter();
        minMembers = newMin;
        emit MinMembersUpdated(newMin);
    }

    function setMaxMembers(uint256 newMax) external onlyOwner {
        if (newMax < minMembers || newMax > 1000) revert InvalidParameter();
        maxMembers = newMax;
        emit MaxMembersUpdated(newMax);
    }

    function setGuaranteeRange(uint256 newMin, uint256 newMax) external onlyOwner {
        if (newMin == 0 || newMin >= newMax) revert InvalidParameter();
        minGuaranteeAmount = newMin;
        maxGuaranteeAmount = newMax;
        emit GuaranteeRangeUpdated(newMin, newMax);
    }

    function notifyCircleCompleted(address circleAddress) external {
        Circle circle = Circle(circleAddress);
        address[] memory members = circle.getMembers();

        require(msg.sender == circleAddress, "Only circle can notify");
        require(
            circle.status() == Circle.CircleStatus.COMPLETED ||
            circle.status() == Circle.CircleStatus.LIQUIDATED,
            "Circle not finished"
        );

        for (uint256 i = 0; i < members.length; i++) {
            if (userActiveCircles[members[i]] > 0) {
                userActiveCircles[members[i]]--;
            }
        }

        emit CircleCompleted(circleAddress);
    }

    function revokeCircleAuthorization(address circleAddress) external onlyOwner {
        aguayoSBT.revokeCircle(circleAddress);
        vault.revokeCircle(circleAddress);
    }
}
