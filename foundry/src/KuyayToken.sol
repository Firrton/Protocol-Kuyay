// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KuyayToken ($KUYAY)
 * @author Iglesia del Sol Eterno
 * @notice Token sagrado de Inti - "Luz solar solidificada"
 * 
 * NARRATIVA RELIGIOSA:
 * - Cada $KUYAY representa un fragmento de la luz de Inti
 * - Los holders son "Hijos del Sol"
 * - Participar en Pasanakus aumenta tu "Fe" (balance)
 * 
 * UTILIDAD:
 * - Acceso a Ayllus (Pasanakus) exclusivos
 * - Governance del protocolo
 * - Staking para rewards
 * - Pago de garantías en Circles premium
 */
contract KuyayToken is ERC20, ERC20Burnable, Ownable {
    
    // Decimales: 18 (estándar ERC-20)
    uint8 private constant DECIMALS = 18;
    
    // Supply total: 1,000,000,000 KUYAY (1 billion)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**DECIMALS;
    
    // Distribución sagrada (en porcentajes)
    uint256 public constant COMMUNITY_ALLOCATION = 60;  // 60% - Para Ayllus y rewards
    uint256 public constant TREASURY_ALLOCATION = 20;   // 20% - Tesoro de Inti
    uint256 public constant TEAM_ALLOCATION = 10;       // 10% - Sacerdotes fundadores
    uint256 public constant MISSIONARIES_ALLOCATION = 10; // 10% - Agentes misioneros

    // Addresses de distribución
    address public treasury;
    address public missionaryFund;
    
    // Círculos autorizados para mint de rewards
    mapping(address => bool) public authorizedCircles;
    
    // Tracking de bendiciones (participación en Pasanakus)
    mapping(address => uint256) public blessingsReceived;
    
    // Eventos sagrados
    event BlessingGranted(address indexed faithful, uint256 amount, string reason);
    event CircleAuthorized(address indexed circle);
    event CircleRevoked(address indexed circle);
    event MissionaryReward(address indexed missionary, address indexed converted, uint256 reward);

    error NotAuthorizedCircle();
    error MaxSupplyExceeded();
    error InvalidAddress();

    constructor(
        address _treasury,
        address _missionaryFund
    ) ERC20("Kuyay - Luz de Inti", "KUYAY") Ownable(msg.sender) {
        if (_treasury == address(0) || _missionaryFund == address(0)) revert InvalidAddress();
        
        treasury = _treasury;
        missionaryFund = _missionaryFund;
        
        // Distribución inicial
        uint256 communityAmount = (MAX_SUPPLY * COMMUNITY_ALLOCATION) / 100;
        uint256 treasuryAmount = (MAX_SUPPLY * TREASURY_ALLOCATION) / 100;
        uint256 teamAmount = (MAX_SUPPLY * TEAM_ALLOCATION) / 100;
        uint256 missionaryAmount = (MAX_SUPPLY * MISSIONARIES_ALLOCATION) / 100;
        
        // Mint a deployer (team) - será distribuido después
        _mint(msg.sender, teamAmount);
        
        // Mint a treasury
        _mint(_treasury, treasuryAmount + communityAmount);
        
        // Mint a fondo misionero (para agentes)
        _mint(_missionaryFund, missionaryAmount);
    }

    /// @notice Otorga bendición (reward) a un fiel por completar ronda de Pasanaku
    /// @dev Solo círculos autorizados pueden llamar esto
    function grantBlessing(address faithful, uint256 amount, string calldata reason) 
        external 
        onlyAuthorizedCircle 
    {
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyExceeded();
        
        _mint(faithful, amount);
        blessingsReceived[faithful] += amount;
        
        emit BlessingGranted(faithful, amount, reason);
    }

    /// @notice Reward para misioneros (agentes que convierten)
    /// @dev Solo owner puede llamar esto
    function rewardMissionary(address missionary, address converted, uint256 reward) 
        external 
        onlyOwner 
    {
        require(balanceOf(missionaryFund) >= reward, "Insufficient missionary fund");
        
        _transfer(missionaryFund, missionary, reward);
        
        emit MissionaryReward(missionary, converted, reward);
    }

    /// @notice Autoriza un Circle para otorgar bendiciones
    function authorizeCircle(address circle) external onlyOwner {
        if (circle == address(0)) revert InvalidAddress();
        authorizedCircles[circle] = true;
        emit CircleAuthorized(circle);
    }

    /// @notice Revoca autorización de un Circle
    function revokeCircle(address circle) external onlyOwner {
        authorizedCircles[circle] = false;
        emit CircleRevoked(circle);
    }

    /// @notice Consulta cuántas bendiciones ha recibido un fiel
    function getBlessings(address faithful) external view returns (uint256) {
        return blessingsReceived[faithful];
    }

    /// @notice Nivel de fe basado en bendiciones recibidas
    function getFaithLevel(address faithful) external view returns (uint8) {
        uint256 blessings = blessingsReceived[faithful];
        
        if (blessings >= 1000 * 10**DECIMALS) return 5;  // Amawta (Sabio)
        if (blessings >= 500 * 10**DECIMALS) return 4;   // Sacerdote
        if (blessings >= 100 * 10**DECIMALS) return 3;   // Tejedor
        if (blessings >= 10 * 10**DECIMALS) return 2;    // Bautizado
        if (blessings >= 1 * 10**DECIMALS) return 1;     // Catecúmeno
        return 0;  // Perdido
    }

    /// @notice Retorna nombre del nivel de fe
    function getFaithTitle(address faithful) external view returns (string memory) {
        uint8 level = this.getFaithLevel(faithful);
        
        if (level == 5) return "Amawta";
        if (level == 4) return "Sacerdote";
        if (level == 3) return "Tejedor";
        if (level == 2) return "Bautizado";
        if (level == 1) return unicode"Catecúmeno";
        return "Perdido";
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    modifier onlyAuthorizedCircle() {
        if (!authorizedCircles[msg.sender]) revert NotAuthorizedCircle();
        _;
    }
}
