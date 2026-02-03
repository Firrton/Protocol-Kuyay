// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AguayoSBT.sol";
import "./KuyayVault.sol";
import "./RiskOracle.sol";
import "./KuyayToken.sol";

/**
 * @title CircleFaith - Pasanaku con Sistema de Fe
 * @author Iglesia del Sol Eterno
 * @notice Pasanaku donde la Fe stakeada ($KUYAY) determina probabilidades de ganar
 * 
 * MECÁNICA DE FE:
 * - Miembros stakean $KUYAY al unirse
 * - Más KUYAY stakeado = Mayor probabilidad de ganar
 * - Probabilidad = tuKuyay / totalKuyayStakeado
 * - Al ganar o completar, recuperas tu $KUYAY
 * 
 * RANDOMNESS:
 * - Usa prevrandao (EIP-4399) + blockhash para aleatoriedad
 * - Seguro en Monad BFT por consenso distribuido
 * - Sorteos instantáneos (sin callback de VRF)
 */
contract CircleFaith is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum CircleStatus {
        DEPOSIT,    // Esperando garantías y Fe
        ACTIVE,     // Rondas en progreso
        COMPLETED,  // Todos ganaron
        LIQUIDATED  // Default
    }

    // Tokens
    IERC20 public immutable paymentToken;    // Token para pagos (USDC/stablecoin)
    IERC20 public immutable faithToken;      // Token de Fe ($KUYAY)
    
    // Protocolo
    AguayoSBT public immutable aguayoSBT;
    address public immutable factory;

    // Configuración
    CircleStatus public status;
    address[] public members;
    mapping(address => bool) public isMember;
    uint256 public guaranteeAmount;    // Garantía en paymentToken
    uint256 public cuotaAmount;        // Cuota por ronda en paymentToken
    uint256 public minFaithStake;      // Mínimo de Fe para participar

    // Estado del juego
    uint256 public totalRounds;
    uint256 public currentRound;
    uint256 public currentPot;
    uint256 public createdAt;

    // Garantías (paymentToken)
    mapping(address => uint256) public guarantees;
    uint256 public totalGuarantees;

    // Fe stakeada ($KUYAY)
    mapping(address => uint256) public stakedFaith;
    uint256 public totalStakedFaith;

    // Estado de rondas
    mapping(address => bool) public hasWon;
    mapping(uint256 => address) public roundWinners;
    mapping(address => mapping(uint256 => bool)) public hasPaidRound;
    mapping(address => bool) public canWithdrawGuarantee;
    uint256 public paymentsThisRound;

    // Check-in ceremonial
    mapping(address => bool) public isMemberPresent;
    uint256 public presentCount;
    bool public drawReady;

    // Eventos sagrados
    event CircleCreated(uint256 memberCount, uint256 guaranteeAmount, uint256 minFaith);
    event GuaranteeDeposited(address indexed member, uint256 amount);
    event FaithStaked(address indexed member, uint256 amount, uint256 totalFaith);
    event CircleActivated(uint256 totalGuarantees, uint256 totalFaith);
    event RoundPaymentMade(address indexed member, uint256 round, uint256 amount);
    event MemberCheckedIn(address indexed member, uint256 round);
    event DrawExecuted(uint256 round, uint256 randomSeed, uint256 totalFaith);
    event WinnerSelected(uint256 indexed round, address winner, uint256 potAmount, uint256 winnerFaith);
    event CircleCompleted(uint256 finalRound);
    event FaithReturned(address indexed member, uint256 amount);
    event GuaranteeReturned(address indexed member, uint256 amount);

    // Errores
    error InvalidStatus();
    error NotMember();
    error AlreadyMember();
    error InvalidMemberCount();
    error InvalidAmount();
    error GuaranteeAlreadyDeposited();
    error FaithAlreadyStaked();
    error InsufficientFaith();
    error PaymentAlreadyMade();
    error AlreadyWon();
    error NoEligibleMembers();
    error Unauthorized();
    error CannotStartDraw();
    error AlreadyCheckedIn();
    error ZeroAddress();

    modifier onlyFactory() {
        if (msg.sender != factory) revert Unauthorized();
        _;
    }

    constructor(
        address[] memory _members,
        uint256 _guaranteeAmount,
        uint256 _cuotaAmount,
        uint256 _minFaithStake,
        address _paymentToken,
        address _faithToken,
        address _aguayoSBT
    ) {
        // Validaciones
        if (_paymentToken == address(0)) revert ZeroAddress();
        if (_faithToken == address(0)) revert ZeroAddress();
        if (_aguayoSBT == address(0)) revert ZeroAddress();
        if (_members.length < 2 || _members.length > 50) revert InvalidMemberCount();
        if (_guaranteeAmount == 0 || _cuotaAmount == 0) revert InvalidAmount();

        paymentToken = IERC20(_paymentToken);
        faithToken = IERC20(_faithToken);
        aguayoSBT = AguayoSBT(_aguayoSBT);
        factory = msg.sender;
        
        status = CircleStatus.DEPOSIT;
        guaranteeAmount = _guaranteeAmount;
        cuotaAmount = _cuotaAmount;
        minFaithStake = _minFaithStake;
        totalRounds = _members.length;
        currentRound = 0;
        createdAt = block.timestamp;

        // Registrar miembros
        uint256 len = _members.length;
        for (uint256 i = 0; i < len; ++i) {
            address member = _members[i];
            if (isMember[member]) revert AlreadyMember();
            members.push(member);
            isMember[member] = true;
        }

        emit CircleCreated(_members.length, _guaranteeAmount, _minFaithStake);
    }

    /// @notice Depositar garantía Y stakear Fe en una sola transacción
    /// @param faithAmount Cantidad de $KUYAY a stakear
    function joinWithFaith(uint256 faithAmount) external nonReentrant {
        if (status != CircleStatus.DEPOSIT) revert InvalidStatus();
        if (!isMember[msg.sender]) revert NotMember();
        if (guarantees[msg.sender] > 0) revert GuaranteeAlreadyDeposited();
        if (faithAmount < minFaithStake) revert InsufficientFaith();

        // 1. Depositar garantía
        paymentToken.safeTransferFrom(msg.sender, address(this), guaranteeAmount);
        guarantees[msg.sender] = guaranteeAmount;
        totalGuarantees += guaranteeAmount;

        // 2. Stakear Fe
        faithToken.safeTransferFrom(msg.sender, address(this), faithAmount);
        stakedFaith[msg.sender] = faithAmount;
        totalStakedFaith += faithAmount;

        emit GuaranteeDeposited(msg.sender, guaranteeAmount);
        emit FaithStaked(msg.sender, faithAmount, totalStakedFaith);

        // Activar si todos depositaron
        if (totalGuarantees == guaranteeAmount * members.length) {
            _activateCircle();
        }
    }

    function _activateCircle() internal {
        status = CircleStatus.ACTIVE;
        currentRound = 1;
        emit CircleActivated(totalGuarantees, totalStakedFaith);
    }

    /// @notice Pagar cuota de la ronda actual
    function makeRoundPayment() external nonReentrant {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();
        if (!isMember[msg.sender]) revert NotMember();
        if (hasPaidRound[msg.sender][currentRound]) revert PaymentAlreadyMade();

        hasPaidRound[msg.sender][currentRound] = true;
        currentPot += cuotaAmount;
        paymentsThisRound++;

        paymentToken.safeTransferFrom(msg.sender, address(this), cuotaAmount);

        // Actualizar Aguayo
        uint256 tokenId = aguayoSBT.userToAguayo(msg.sender);
        if (tokenId > 0) {
            aguayoSBT.addWeave(tokenId);
        }

        emit RoundPaymentMade(msg.sender, currentRound, cuotaAmount);

        // Habilitar sorteo cuando todos pagaron
        if (paymentsThisRound >= members.length) {
            paymentsThisRound = 0;
            drawReady = true;
        }
    }

    /// @notice Check-in ceremonial antes del sorteo
    function checkIn() external nonReentrant {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();
        if (!isMember[msg.sender]) revert NotMember();
        if (!hasPaidRound[msg.sender][currentRound]) revert PaymentAlreadyMade();
        if (isMemberPresent[msg.sender]) revert AlreadyCheckedIn();
        if (!drawReady) revert CannotStartDraw();

        isMemberPresent[msg.sender] = true;
        presentCount++;

        emit MemberCheckedIn(msg.sender, currentRound);
    }

    /// @notice Ejecutar sorteo sagrado - probabilidad basada en Fe
    function startDraw() external nonReentrant {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();
        if (!drawReady) revert CannotStartDraw();

        // Quórum mínimo del 51%
        uint256 quorumRequired = (members.length * 51) / 100;
        if (quorumRequired == 0) quorumRequired = 1;
        if (presentCount < quorumRequired) revert CannotStartDraw();

        _executeFaithBasedDraw();
    }

    /// @notice Sorteo ponderado por Fe stakeada
    function _executeFaithBasedDraw() internal {
        // Generar semilla aleatoria (prevrandao + blockhash = seguro en Monad BFT)
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            blockhash(block.number - 1),
            block.timestamp,
            currentRound,
            address(this),
            totalStakedFaith
        )));

        emit DrawExecuted(currentRound, randomSeed, totalStakedFaith);

        // Seleccionar ganador basado en Fe
        address winner = _selectFaithWinner(randomSeed);
        
        // Distribuir pot al ganador
        _distributePot(winner, currentRound);

        // Avanzar ronda o completar
        if (currentRound < totalRounds) {
            currentRound++;
            currentPot = 0;
            _resetPresence();
        } else {
            _completeCircle();
        }
    }

    /// @notice Selección de ganador ponderada por Fe stakeada
    function _selectFaithWinner(uint256 randomSeed) internal view returns (address) {
        // Obtener miembros elegibles (que no han ganado)
        address[] memory eligible = _getEligibleMembers();
        if (eligible.length == 0) revert NoEligibleMembers();

        // Calcular Fe total de elegibles
        uint256 eligibleFaith = 0;
        uint256 len = eligible.length;
        for (uint256 i = 0; i < len; ++i) {
            eligibleFaith += stakedFaith[eligible[i]];
        }

        // Seleccionar basado en Fe ponderada
        uint256 randomPoint = randomSeed % eligibleFaith;
        uint256 cumulative = 0;

        for (uint256 i = 0; i < len; ++i) {
            cumulative += stakedFaith[eligible[i]];
            if (randomPoint < cumulative) {
                return eligible[i];
            }
        }

        // Fallback (no debería llegar aquí)
        return eligible[0];
    }

    function _getEligibleMembers() internal view returns (address[] memory) {
        uint256 len = members.length;
        uint256 eligibleCount = 0;
        
        for (uint256 i = 0; i < len; ++i) {
            if (!hasWon[members[i]]) {
                ++eligibleCount;
            }
        }

        address[] memory eligible = new address[](eligibleCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < len; ++i) {
            if (!hasWon[members[i]]) {
                eligible[index] = members[i];
                ++index;
            }
        }

        return eligible;
    }

    function _distributePot(address winner, uint256 round) internal {
        hasWon[winner] = true;
        roundWinners[round] = winner;

        uint256 winnerFaith = stakedFaith[winner];
        
        paymentToken.safeTransfer(winner, currentPot);

        emit WinnerSelected(round, winner, currentPot, winnerFaith);
    }

    function _resetPresence() internal {
        uint256 len = members.length;
        for (uint256 i = 0; i < len; ++i) {
            isMemberPresent[members[i]] = false;
        }
        presentCount = 0;
        drawReady = false;
    }

    function _completeCircle() internal {
        status = CircleStatus.COMPLETED;

        uint256 len = members.length;
        for (uint256 i = 0; i < len; ++i) {
            address member = members[i];
            if (guarantees[member] > 0) {
                canWithdrawGuarantee[member] = true;

                // Actualizar Aguayo
                uint256 tokenId = aguayoSBT.userToAguayo(member);
                if (tokenId > 0) {
                    aguayoSBT.addBorder(tokenId);
                }
            }
        }

        emit CircleCompleted(totalRounds);
    }

    /// @notice Retirar garantía después de completar
    function withdrawGuarantee() external nonReentrant {
        if (status != CircleStatus.COMPLETED) revert InvalidStatus();
        if (!canWithdrawGuarantee[msg.sender]) revert Unauthorized();

        uint256 amount = guarantees[msg.sender];
        if (amount == 0) revert InvalidAmount();

        guarantees[msg.sender] = 0;
        canWithdrawGuarantee[msg.sender] = false;

        paymentToken.safeTransfer(msg.sender, amount);

        emit GuaranteeReturned(msg.sender, amount);
    }

    /// @notice Retirar Fe stakeada después de completar
    function withdrawFaith() external nonReentrant {
        if (status != CircleStatus.COMPLETED) revert InvalidStatus();
        
        uint256 amount = stakedFaith[msg.sender];
        if (amount == 0) revert InvalidAmount();

        stakedFaith[msg.sender] = 0;
        totalStakedFaith -= amount;

        faithToken.safeTransfer(msg.sender, amount);

        emit FaithReturned(msg.sender, amount);
    }

    // ============ VIEW FUNCTIONS ============

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    function getRoundWinner(uint256 round) external view returns (address) {
        return roundWinners[round];
    }

    function getMemberFaith(address member) external view returns (uint256) {
        return stakedFaith[member];
    }

    function getMemberFaithPercentage(address member) external view returns (uint256) {
        if (totalStakedFaith == 0) return 0;
        return (stakedFaith[member] * 10000) / totalStakedFaith; // Basis points
    }

    function canStartDraw() external view returns (bool) {
        if (status != CircleStatus.ACTIVE) return false;
        if (!drawReady) return false;
        
        uint256 quorumRequired = (members.length * 51) / 100;
        if (quorumRequired == 0) quorumRequired = 1;
        return presentCount >= quorumRequired;
    }

    function getCircleState() external view returns (
        CircleStatus circleStatus,
        uint256 round,
        uint256 pot,
        uint256 totalFaith
    ) {
        return (status, currentRound, currentPot, totalStakedFaith);
    }
}
