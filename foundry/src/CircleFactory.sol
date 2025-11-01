// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Circle.sol";
import "./AguayoSBT.sol";
import "./KuyayVault.sol";
import "./RiskOracle.sol";

/**
 * @title CircleFactory
 * @author Kuyay Protocol
 * @notice Fábrica para crear y validar Circles
 * 
 * Valida miembros, despliega Circles y los autoriza en otros contratos
 */
contract CircleFactory is Ownable {

    AguayoSBT public immutable aguayoSBT;
    KuyayVault public immutable vault;
    RiskOracle public immutable riskOracle;
    IERC20 public immutable asset;
    address public immutable vrfCoordinator;
    uint256 public immutable vrfSubscriptionId;
    bytes32 public immutable vrfKeyHash;

    address[] public allCircles;

    mapping(address => uint256) public circleCreatedAt;
    mapping(address => address) public circleCreator;
    mapping(address => address[]) public userCircles;
    mapping(address => uint256) public userActiveCircles;

    uint256 public minMembers = 3;
    uint256 public maxMembers = 50;
    uint256 public minGuaranteeAmount = 10 * 10**6;      // 10 USDC
    uint256 public maxGuaranteeAmount = 10000 * 10**6;   // 10,000 USDC

    event CircleCreated(
        address indexed circleAddress,
        address indexed creator,
        Circle.CircleMode mode,
        uint256 memberCount,
        uint256 guaranteeAmount,
        uint256 cuotaAmount
    );
    event CircleCompleted(address indexed circleAddress);
    event MinMembersUpdated(uint256 newMin);
    event MaxMembersUpdated(uint256 newMax);
    event GuaranteeRangeUpdated(uint256 newMin, uint256 newMax);

    error InvalidMemberCount();
    error DuplicateMember();
    error MemberNotEligible(address member);
    error InvalidGuaranteeAmount();
    error InvalidCuotaAmount();
    error InvalidParameter();
    error MemberLimitExceeded();

    constructor(
        address _aguayoSBT,
        address _vault,
        address _riskOracle,
        address _asset,
        address _vrfCoordinator,
        uint256 _vrfSubscriptionId,
        bytes32 _vrfKeyHash
    ) Ownable(msg.sender) {
        aguayoSBT = AguayoSBT(_aguayoSBT);
        vault = KuyayVault(_vault);
        riskOracle = RiskOracle(_riskOracle);
        asset = IERC20(_asset);
        vrfCoordinator = _vrfCoordinator;
        vrfSubscriptionId = _vrfSubscriptionId;
        vrfKeyHash = _vrfKeyHash;
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
            address(riskOracle),
            vrfCoordinator,
            vrfSubscriptionId,
            vrfKeyHash
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
            address(riskOracle),
            vrfCoordinator,
            vrfSubscriptionId,
            vrfKeyHash
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

            // Verificar que tenga Aguayo
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

        // Validación grupal para modo crédito
        if (isCreditMode) {
            if (!riskOracle.areAllMembersEligible(members)) {
                revert MemberNotEligible(address(0));
            }
        }
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

    function getAllCircles() external view returns (address[] memory) {
        return allCircles;
    }

    function getCircleCount() external view returns (uint256) {
        return allCircles.length;
    }

    function getUserCircles(address user) external view returns (address[] memory) {
        return userCircles[user];
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
            if (!aguayoSBT.hasAguayo(members[i])) {
                return (false, 0, 0);
            }

            if (!riskOracle.isMemberEligible(members[i], isCreditMode)) {
                return (false, 0, 0);
            }
        }

        eligible = true;

        if (isCreditMode) {
            (leverageMultiplier, interestRate) = riskOracle.getLeverageLevel(members);
        }

        return (eligible, leverageMultiplier, interestRate);
    }

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
