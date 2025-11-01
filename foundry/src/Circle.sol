// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "./AguayoSBT.sol";
import "./KuyayVault.sol";
import "./RiskOracle.sol";

/**
 * @title Circle
 * @author Kuyay Protocol
 * @notice Contrato de un Pasanaku individual
 *
 * MODOS:
 * - SAVINGS: Sin préstamo del protocolo
 * - CREDIT: Con préstamo del vault (apalancado)
 *
 * FASES:
 * 1. DEPOSIT: Miembros depositan garantías
 * 2. ACTIVE: Rondas de pago y sorteos VRF
 * 3. COMPLETED/LIQUIDATED: Fin exitoso o default
 */
contract Circle is VRFConsumerBaseV2Plus, ReentrancyGuard {
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
    IVRFCoordinatorV2Plus public immutable vrfCoordinator;
    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;
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

    // VRF
    uint256 public pendingRequestId;
    mapping(uint256 => uint256) public requestIdToRound;
    bool public useWeightedDraw;
    uint48 public vrfRequestTimestamp;          
    uint256 public constant VRF_TIMEOUT = 7 days; 

    // Round timeouts
    uint48 public lastRoundStartTime;           
    uint256 public constant ROUND_TIMEOUT = 30 days; 

    event CircleCreated(CircleMode mode, uint256 memberCount, uint256 guaranteeAmount, uint256 cuotaAmount);
    event GuaranteeDeposited(address indexed member, uint256 amount);
    event CircleActivated(uint256 totalCollateral, uint256 protocolLoan);
    event RoundPaymentMade(address indexed member, uint256 round, uint256 amount);
    event MemberCheckedIn(address indexed member, uint256 round);
    event DrawRequested(uint256 indexed requestId, uint256 round);
    event RoundDrawStarted(uint256 round, uint256 requestId);
    event WinnerSelected(uint256 indexed round, address winner, uint256 amount);
    event RoundWinner(uint256 round, address indexed winner, uint256 potAmount);
    event CircleCompleted(uint256 finalRound);
    event CircleLiquidated(uint256 round, address indexed defaulter, string reason);
    event GuaranteeReturned(address indexed member, uint256 amount);
    event EmergencyCancelled(string reason);
    event EmergencyWithdraw(address indexed member, uint256 amount); 

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
    error DrawAlreadyStarted();
    error NoEligibleMembers();
    error TransferFailed();
    error Unauthorized();
    error VRFTimeoutNotReached();
    error RoundTimeoutNotReached();
    error NoLiquidationReason();
    error InsufficientVaultLiquidity();
    error AlreadyCheckedIn();
    error CannotStartDraw();

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
        address _riskOracle,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        if (_members.length < 2 || _members.length > 50) revert InvalidMemberCount();
        if (_guaranteeAmount == 0 || _cuotaAmount == 0) revert InvalidAmount();

        asset = IERC20(_asset);
        aguayoSBT = AguayoSBT(_aguayoSBT);
        vault = KuyayVault(_vault);
        riskOracle = RiskOracle(_riskOracle);
        vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
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
        aguayoSBT.addWeave(tokenId);

        emit RoundPaymentMade(msg.sender, currentRound, cuotaAmount);

        if (paymentsThisRound == members.length) {
            paymentsThisRound = 0;
            drawCanBeStartedManually = true;

            // Si nadie ha hecho check-in, iniciar sorteo automáticamente
            if (presentCount == 0) {
                _startRoundDraw();
            }
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
    function startDraw() external nonReentrant returns (uint256) {
        if (status != CircleStatus.ACTIVE) revert InvalidStatus();
        if (!drawCanBeStartedManually) revert CannotStartDraw();
        if (pendingRequestId != 0) revert DrawAlreadyStarted();

        // Requiere quórum mínimo del 51%
        uint256 quorumRequired = (members.length * 51) / 100;
        if (presentCount < quorumRequired) revert CannotStartDraw();

        return _startRoundDraw();
    }

    // View: ¿Puede iniciarse el sorteo?
    function canStartDraw() external view returns (bool) {
        if (status != CircleStatus.ACTIVE) return false;
        if (!drawCanBeStartedManually) return false;
        if (pendingRequestId != 0) return false;

        uint256 quorumRequired = (members.length * 51) / 100;
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

    function _isRoundFullyPaid(uint256 round) internal view returns (bool) {
        for (uint256 i = 0; i < members.length; i++) {
            if (!hasPaidRound[members[i]][round]) {
                return false;
            }
        }
        return true;
    }

    function _startRoundDraw() internal returns (uint256) {
        if (pendingRequestId != 0) revert DrawAlreadyStarted();

        // Crear request struct para VRF V2 Plus
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: 3,
            callbackGasLimit: 200000,
            numWords: 1,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        });

        uint256 requestId = vrfCoordinator.requestRandomWords(req);

        pendingRequestId = requestId;
        requestIdToRound[requestId] = currentRound;
        vrfRequestTimestamp = uint48(block.timestamp);

        emit RoundDrawStarted(currentRound, requestId);
        emit DrawRequested(requestId, currentRound);

        return requestId;
    }

    // Callback de Chainlink VRF
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords)
        internal
        override
    {
        uint256 round = requestIdToRound[requestId];
        if (round == 0) return;

        pendingRequestId = 0;
        vrfRequestTimestamp = 0;

        address winner;
        if (useWeightedDraw) {
            winner = _selectWeightedWinner(randomWords[0]);
        } else {
            winner = _selectRandomWinner(randomWords[0]);
        }

        _distributePot(winner, round);

        if (currentRound < totalRounds) {
            currentRound++;
            currentPot = 0;
            _resetPresence();
        } else {
            _completeCircle();
        }
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
        // Reset presencia para la siguiente ronda
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
                aguayoSBT.addBorder(tokenId);
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
            aguayoSBT.addStain(tokenId);
        }

        (bool success,) = factory.call(
            abi.encodeWithSignature("notifyCircleCompleted(address)", address(this))
        );

        emit CircleLiquidated(currentRound, address(0), "Liquidation initiated");
    }

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
}
