// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CircleFaith.sol";
import "./AguayoSBT.sol";

/**
 * @title CircleFaithFactory - Fábrica de Pasanakus con Fe
 * @author Iglesia del Sol Eterno
 * @notice Crea Pasanakus donde stakear $KUYAY aumenta probabilidad de ganar
 */
contract CircleFaithFactory is Ownable {

    AguayoSBT public immutable aguayoSBT;
    IERC20 public immutable paymentToken;   // USDC/stablecoin
    IERC20 public immutable faithToken;     // $KUYAY

    address[] public allCircles;

    mapping(address => uint256) public circleCreatedAt;
    mapping(address => address) public circleCreator;
    mapping(address => address[]) public userCircles;

    // Configuración
    uint256 public minMembers = 2;
    uint256 public maxMembers = 50;
    uint256 public minGuaranteeAmount;
    uint256 public maxGuaranteeAmount;
    uint256 public defaultMinFaithStake;  // Mínimo de Fe para participar

    // Eventos
    event FaithCircleCreated(
        address indexed circleAddress,
        address indexed creator,
        uint256 memberCount,
        uint256 guaranteeAmount,
        uint256 minFaithStake
    );

    // Errores
    error InvalidMemberCount();
    error DuplicateMember();
    error MemberNotEligible(address member);
    error InvalidGuaranteeAmount();
    error InvalidCuotaAmount();
    error InvalidParameter();

    constructor(
        address _aguayoSBT,
        address _paymentToken,
        address _faithToken,
        uint256 _minGuarantee,
        uint256 _maxGuarantee,
        uint256 _defaultMinFaith
    ) Ownable(msg.sender) {
        aguayoSBT = AguayoSBT(_aguayoSBT);
        paymentToken = IERC20(_paymentToken);
        faithToken = IERC20(_faithToken);
        minGuaranteeAmount = _minGuarantee;
        maxGuaranteeAmount = _maxGuarantee;
        defaultMinFaithStake = _defaultMinFaith;
    }

    /// @notice Crear un nuevo Pasanaku con Fe
    function createFaithCircle(
        address[] calldata members,
        uint256 guaranteeAmount,
        uint256 cuotaAmount,
        uint256 minFaithStake
    ) external returns (address) {
        _validateParams(members, guaranteeAmount, cuotaAmount);

        if (minFaithStake == 0) {
            minFaithStake = defaultMinFaithStake;
        }

        CircleFaith newCircle = new CircleFaith(
            members,
            guaranteeAmount,
            cuotaAmount,
            minFaithStake,
            address(paymentToken),
            address(faithToken),
            address(aguayoSBT)
        );

        address circleAddress = address(newCircle);

        // Autorizar circle en AguayoSBT
        aguayoSBT.authorizeCircle(circleAddress);

        // Registrar
        allCircles.push(circleAddress);
        circleCreatedAt[circleAddress] = block.timestamp;
        circleCreator[circleAddress] = msg.sender;

        for (uint256 i = 0; i < members.length; ++i) {
            userCircles[members[i]].push(circleAddress);
        }

        emit FaithCircleCreated(
            circleAddress,
            msg.sender,
            members.length,
            guaranteeAmount,
            minFaithStake
        );

        return circleAddress;
    }

    function _validateParams(
        address[] calldata members,
        uint256 guaranteeAmount,
        uint256 cuotaAmount
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

        // Verificar duplicados y elegibilidad
        for (uint256 i = 0; i < members.length; ++i) {
            address member = members[i];
            
            // Verificar duplicados
            for (uint256 j = i + 1; j < members.length; ++j) {
                if (member == members[j]) revert DuplicateMember();
            }

            // Verificar que tenga Aguayo
            if (!aguayoSBT.hasAguayo(member)) {
                revert MemberNotEligible(member);
            }
        }
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

    // ============ ADMIN FUNCTIONS ============

    function setMemberLimits(uint256 _min, uint256 _max) external onlyOwner {
        if (_min < 2 || _min >= _max) revert InvalidParameter();
        minMembers = _min;
        maxMembers = _max;
    }

    function setGuaranteeRange(uint256 _min, uint256 _max) external onlyOwner {
        if (_min == 0 || _min >= _max) revert InvalidParameter();
        minGuaranteeAmount = _min;
        maxGuaranteeAmount = _max;
    }

    function setDefaultMinFaith(uint256 _minFaith) external onlyOwner {
        defaultMinFaithStake = _minFaith;
    }
}
