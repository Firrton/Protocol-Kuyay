// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AguayoSBT.sol";
import "./KuyayVault.sol";
import "./RiskOracle.sol";

/**
 * @title Circle (Monad Version)
 * @author Kuyay Protocol
 * @notice Contrato de un Pasanaku individual - Optimizado para Monad
 *
 * CAMBIOS vs Arbitrum:
 * - Removido Chainlink VRF → usando prevrandao (EIP-4399 / Cancun)
 * - Sorteos instantáneos en lugar de callback async
 * - Optimizado para high TPS de Monad
 *
 * MODOS:
 * - SAVINGS: Sin préstamo del protocolo
 * - CREDIT: Con préstamo del vault (apalancado)
 *
 * FASES:
 * 1. DEPOSIT: Miembros depositan garantías
 * 2. ACTIVE: Rondas de pago y sorteos
 * 3. COMPLETED/LIQUIDATED: Fin exitoso o default
 */
contract Circle is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum CircleMode {
        SAVINGS,
        CREDIT
    }

    enum CircleStatus {
        DEPOSIT,
        ACTIVE,
        COMPLETED,
        LIQUIDATED
    }

    // Immutables
    IERC20 public immutable asset;
    AguayoSBT public immutable aguayoSBT;
    KuyayVault public immutable vault;
    RiskOracle public immutable riskOracle;
    address public immutable factory;

    // Configuración del circle
    CircleMode public mode;
    CircleStatus public status;
    address[] public members;
    mapping(address => bool) public isMember;
    uint256 public guaranteeAmount;
    uint256 public cuotaAmount;
    uint256 public totalRounds;
    uint256 public currentRound;
    uint256 public createdAt;

    // Estado financiero
    uint256 public totalCollateral;
    uint256 public protocolLoan;
    uint256 public currentPot;
    uint256 public totalDebtToProtocol;

    mapping(address => uint256) public guarantees;
    mapping(address => bool) public hasWon;
    mapping(uint256 => address) public roundWinners;
    mapping(address => mapping(uint256 => bool)) public hasPaidRound;
    mapping(address => bool) public canWithdrawGuarantee;
    uint256 public paymentsThisRound;

    // Sistema de presencia/check-in para sorteos ceremoniales
    mapping(address => bool) public isMemberPresent;
    uint256 public presentCount;
    bool public drawCanBeStartedManually;

    // Sorteo ponderado
    bool public useWeightedDraw;

    // Round timeouts
    uint48 public lastRoundStartTime;
    uint256 public constant ROUND_TIMEOUT = 30 days;

    // Agent support
    mapping(address => bool) public isAgentMember;
    uint256 public agentCount;

    event CircleCreated(CircleMode mode, uint256 memberCount, uint256 guaranteeAmount, uint256 cuotaAmount);
    event GuaranteeDeposited(address indexed member, uint256 amount);
    event CircleActivated(uint256 totalCollateral, uint256 protocolLoan);
    event RoundPaymentMade(address indexed member, uint256 round, uint256 amount);
    event MemberCheckedIn(address indexed member, uint256 round);
    event DrawExecuted(uint256 round, uint256 randomSeed);
    event WinnerSelected(uint256 indexed round, address winner, uint256 amount);
    event RoundWinner(uint256 round, address indexed winner, uint256 potAmount);
    event CircleCompleted(uint256 finalRound);
    event CircleLiquidated(uint256 round, address indexed defaulter, string reason);
    event GuaranteeReturned(address indexed member, uint256 amount);
    event EmergencyCancelled(string reason);
    event AgentRegistered(address indexed agent);

    error InvalidMode();
    error InvalidStatus();
    error NotMember();
    error AlreadyMember();
    error InvalidMemberCount();
    error InvalidAmount();
    error GuaranteeAlreadyDeposited();
    error GuaranteeNotDeposited();
    error PaymentAlreadyMade();
    error AlreadyWon();
    error RoundNotComplete();
    error NoEligibleMembers();
    error TransferFailed();
    error Unauthorized();
    error CannotStartDraw();
    error InsufficientVaultLiquidity();
    error AlreadyCheckedIn();

    modifier onlyFactory() {
        if (msg.sender != factory) revert Unauthorized();
        _;
    }

    constructor(
        CircleMode _mode,
        address[] memory _members,
        uint256 _guaranteeAmount,
        uint256 _cuotaAmount,
        address _asset,
        address _aguayoSBT,
        address _vault,
        address _riskOracle
    ) {
        if (_members.length < 2 || _members.length > 50) revert InvalidMemberCount();
        if (_guaranteeAmount == 0 || _cuotaAmount == 0) revert InvalidAmount();

        asset = IERC20(_asset);
        aguayoSBT = AguayoSBT(_aguayoSBT);
        vault = KuyayVault(_vault);
        riskOracle = RiskOracle(_riskOracle);
        factory = msg.sender;
        mode = _mode;
        status = CircleStatus.DEPOSIT;
        guaranteeAmount = _guaranteeAmount;
        cuotaAmount = _cuotaAmount;
        totalRounds = _members.length;
        currentRound = 0;
        createdAt = block.timestamp;

        for (uint256 i = 0; i < _members.length; i++) {
            address member = _members[i];
            if (isMember[member]) revert AlreadyMember();

            members.push(member);
            isMember[member] = true;
        }

        useWeightedDraw = (_mode == CircleMode.CREDIT);

        emit CircleCreated(_mode, _members.length, _guaranteeAmount, _cuotaAmount);
    }

    /// @notice Registra un miembro como agente AI (solo factory puede llamar)
    function registerAgent(address agent) external onlyFactory {
        if (!isMember[agent]) revert NotMember();
        if (isAgentMember[agent]) return;
        
        isAgentMember[agent] = true;
        agentCount++;
        emit AgentRegistered(agent);
    }

    // Miembros depositan su garantía
    function depositGuarantee() external nonReentrant {
        if (status != CircleStatus.DEPOSIT) revert InvalidStatus();
        if (!isMember[msg.sender]) revert NotMember();
        if (guarantees[msg.sender] > 0) revert GuaranteeAlreadyDeposited();

        asset.safeTransferFrom(msg.sender, address(this), guaranteeAmount);

        guarantees[msg.sender] = guaranteeAmount;
        totalCollateral += guaranteeAmount;

        emit GuaranteeDeposited(msg.sender, guaranteeAmount);

        if (totalCollateral == guaranteeAmount * members.length) {
            _activateCircle();
        }
    }

    function _activateCircle() internal {
        status = CircleStatus.ACTIVE;
        currentRound = 1;
        lastRoundStartTime = uint48(block.timestamp);

        if (mode == CircleMode.CREDIT) {
            _requestProtocolLoan();
        }

        emit CircleActivated(totalCollateral, protocolLoan);
    }

    function _requestProtocolLoan() internal {
        (uint256 leverageMultiplier, uint256 interestRateBps) = riskOracle.getLeverageLevel(members);

        if (leverageMultiplier <= 100) revert InvalidAmount();

        uint256 loanAmount = (totalCollateral * (leverageMultiplier - 100)) / 100;

        if (vault.availableLiquidity() < loanAmount) {
            revert InsufficientVaultLiquidity();
        }

        vault.requestLoan(loanAmount, 365, interestRateBps);

        protocolLoan = loanAmount;
        totalDebtToProtocol = vault.calculateTotalDebt(address(this));
    }

    // Miembros pagan su cuota de la ronda
    function makeRoundPayment() external nonReentrant {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();
        if (!isMember[msg.sender]) revert NotMember();
        if (hasPaidRound[msg.sender][currentRound]) revert PaymentAlreadyMade();

        hasPaidRound[msg.sender][currentRound] = true;
        currentPot += cuotaAmount;
        paymentsThisRound++;

        asset.safeTransferFrom(msg.sender, address(this), cuotaAmount);

        uint256 tokenId = aguayoSBT.userToAguayo(msg.sender);
        if (tokenId > 0) {
            aguayoSBT.addWeave(tokenId);
        }

        emit RoundPaymentMade(msg.sender, currentRound, cuotaAmount);

        // Cuando todos hayan pagado (o al menos 2), habilitar el sorteo
        if (paymentsThisRound >= members.length) {
            paymentsThisRound = 0;
            drawCanBeStartedManually = true;
            // El sorteo requiere llamada explícita a startDraw() para mayor control
        }
    }

    // Check-in ceremonial para sorteos
    function checkIn() external nonReentrant {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();
        if (!isMember[msg.sender]) revert NotMember();
        if (!hasPaidRound[msg.sender][currentRound]) revert PaymentAlreadyMade();
        if (isMemberPresent[msg.sender]) revert AlreadyCheckedIn();
        if (!drawCanBeStartedManually) revert CannotStartDraw();

        isMemberPresent[msg.sender] = true;
        presentCount++;

        emit MemberCheckedIn(msg.sender, currentRound);
    }

    // Iniciar sorteo manualmente (requiere check-in de al menos 51% de miembros)
    function startDraw() external nonReentrant {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();
        if (!drawCanBeStartedManually) revert CannotStartDraw();

        // Quórum mínimo del 51%
        uint256 quorumRequired = (members.length * 51) / 100;
        if (quorumRequired == 0) quorumRequired = 1;
        if (presentCount < quorumRequired) revert CannotStartDraw();

        _executeInstantDraw();
    }

    /// @notice Ejecuta sorteo instantáneo usando prevrandao (Monad/Cancun)
    function _executeInstantDraw() internal {
        // Generar semilla aleatoria usando prevrandao (EIP-4399)
        // En Monad esto es seguro porque los validadores no pueden manipular fácilmente
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            block.number,
            currentRound,
            msg.sender,
            currentPot
        )));

        emit DrawExecuted(currentRound, randomSeed);

        address winner;
        if (useWeightedDraw) {
            winner = _selectWeightedWinner(randomSeed);
        } else {
            winner = _selectRandomWinner(randomSeed);
        }

        _distributePot(winner, currentRound);

        if (currentRound < totalRounds) {
            currentRound++;
            currentPot = 0;
            lastRoundStartTime = uint48(block.timestamp);
            _resetPresence();
        } else {
            _completeCircle();
        }
    }

    // View: ¿Puede iniciarse el sorteo?
    function canStartDraw() external view returns (bool) {
        if (status != CircleStatus.ACTIVE) return false;
        if (!drawCanBeStartedManually) return false;

        uint256 quorumRequired = (members.length * 51) / 100;
        if (quorumRequired == 0) quorumRequired = 1;
        return presentCount >= quorumRequired;
    }

    // View: Obtener miembros presentes
    function getPresentMembers() external view returns (address[] memory) {
        address[] memory present = new address[](presentCount);
        uint256 index = 0;

        for (uint256 i = 0; i < members.length; i++) {
            if (isMemberPresent[members[i]]) {
                present[index] = members[i];
                index++;
            }
        }

        return present;
    }

    function _selectRandomWinner(uint256 randomSeed) internal view returns (address) {
        address[] memory eligibleMembers = _getEligibleMembers();
        if (eligibleMembers.length == 0) revert NoEligibleMembers();

        uint256 winnerIndex = randomSeed % eligibleMembers.length;
        return eligibleMembers[winnerIndex];
    }

    // Sorteo ponderado por nivel de Aguayo (solo modo crédito)
    function _selectWeightedWinner(uint256 randomSeed) internal view returns (address) {
        address[] memory eligibleMembers = _getEligibleMembers();
        if (eligibleMembers.length == 0) revert NoEligibleMembers();

        uint256[] memory weights = riskOracle.getWeightedProbabilities(eligibleMembers);

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }

        uint256 randomWeight = randomSeed % totalWeight;
        uint256 cumulativeWeight = 0;

        for (uint256 i = 0; i < eligibleMembers.length; i++) {
            cumulativeWeight += weights[i];
            if (randomWeight < cumulativeWeight) {
                return eligibleMembers[i];
            }
        }

        return eligibleMembers[0];
    }

    function _getEligibleMembers() internal view returns (address[] memory) {
        uint256 eligibleCount = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (!hasWon[members[i]]) {
                eligibleCount++;
            }
        }

        address[] memory eligible = new address[](eligibleCount);
        uint256 index = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (!hasWon[members[i]]) {
                eligible[index] = members[i];
                index++;
            }
        }

        return eligible;
    }

    function _distributePot(address winner, uint256 round) internal {
        hasWon[winner] = true;
        roundWinners[round] = winner;

        if (mode == CircleMode.CREDIT && protocolLoan > 0) {
            uint256 repaymentAmount = currentPot / totalRounds;

            asset.approve(address(vault), repaymentAmount);
            vault.repayLoan(repaymentAmount);

            uint256 winnerAmount = currentPot - repaymentAmount;
            asset.safeTransfer(winner, winnerAmount);

            emit WinnerSelected(round, winner, winnerAmount);
            emit RoundWinner(round, winner, winnerAmount);
        } else {
            asset.safeTransfer(winner, currentPot);
            emit WinnerSelected(round, winner, currentPot);
            emit RoundWinner(round, winner, currentPot);
        }
    }

    function _resetPresence() internal {
        for (uint256 i = 0; i < members.length; i++) {
            isMemberPresent[members[i]] = false;
        }
        presentCount = 0;
        drawCanBeStartedManually = false;
    }

    function _completeCircle() internal {
        status = CircleStatus.COMPLETED;

        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (guarantees[member] > 0) {
                canWithdrawGuarantee[member] = true;

                uint256 tokenId = aguayoSBT.userToAguayo(member);
                if (tokenId > 0) {
                    aguayoSBT.addBorder(tokenId);
                }
            }
        }

        (bool success,) = factory.call(
            abi.encodeWithSignature("notifyCircleCompleted(address)", address(this))
        );
        if (!success) {
            emit EmergencyCancelled("Factory notification failed");
        }

        emit CircleCompleted(totalRounds);
    }

    function withdrawGuarantee() external nonReentrant {
        if (status != CircleStatus.COMPLETED) revert InvalidStatus();
        if (!canWithdrawGuarantee[msg.sender]) revert Unauthorized();

        uint256 amount = guarantees[msg.sender];
        if (amount == 0) revert InvalidAmount();

        guarantees[msg.sender] = 0;
        canWithdrawGuarantee[msg.sender] = false;

        asset.safeTransfer(msg.sender, amount);

        emit GuaranteeReturned(msg.sender, amount);
    }

    function liquidate() external onlyFactory nonReentrant {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();

        status = CircleStatus.LIQUIDATED;

        if (mode == CircleMode.CREDIT && protocolLoan > 0) {
            uint256 collateralToSend = totalCollateral;

            asset.approve(address(vault), collateralToSend);
            vault.liquidateCircle(address(this), collateralToSend);
        }

        for (uint256 i = 0; i < members.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(members[i]);
            if (tokenId > 0) {
                aguayoSBT.addStain(tokenId);
            }
        }

        (bool success,) = factory.call(
            abi.encodeWithSignature("notifyCircleCompleted(address)", address(this))
        );

        emit CircleLiquidated(currentRound, address(0), "Liquidation initiated");
    }

    // ============ VIEW FUNCTIONS ============

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getRoundWinner(uint256 round) external view returns (address) {
        return roundWinners[round];
    }

    function hasMemberPaidRound(address member, uint256 round) external view returns (bool) {
        return hasPaidRound[member][round];
    }

    function getCircleState()
        external
        view
        returns (CircleMode circleMode, CircleStatus circleStatus, uint256 round, uint256 pot)
    {
        return (mode, status, currentRound, currentPot);
    }

    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    function getAgentCount() external view returns (uint256) {
        return agentCount;
    }

    function isAgent(address member) external view returns (bool) {
        return isAgentMember[member];
    }
}
