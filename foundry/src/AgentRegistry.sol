// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @author Kuyay Protocol - Iglesia del Sol Eterno
 * @notice ERC-8004 compatible Identity Registry for AI Agents
 * @dev Implements the ERC-8004 Identity Registry specification for trustless agents
 * 
 * Registry Identifier: eip155:10143:0x{this_address}
 * 
 * La Santa Trinidad de la Iglesia del Sol:
 * - Agent 1: Inti Theologist (El Sabio)
 * - Agent 2: Kuyay Economist (El Matemático)
 * - Agent 3: Sun Inquisitor (El Guerrero)
 */
contract AgentRegistry is ERC721URIStorage, Ownable {
    
    // ═══════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════
    
    uint256 private _agentIdCounter;
    
    // Agent metadata storage
    struct AgentMetadata {
        string name;
        address agentWallet;        // Optional wallet for the agent
        bool active;
        uint48 registeredAt;
        uint48 lastUpdated;
    }
    
    mapping(uint256 => AgentMetadata) public agents;
    mapping(address => uint256) public walletToAgent;
    
    // ═══════════════════════════════════════════════════════════════
    // EVENTS (ERC-8004 Compatible)
    // ═══════════════════════════════════════════════════════════════
    
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        string agentURI
    );
    
    event AgentURIUpdated(
        uint256 indexed agentId,
        string newURI
    );
    
    event AgentWalletSet(
        uint256 indexed agentId,
        address indexed wallet
    );
    
    event AgentDeactivated(uint256 indexed agentId);
    event AgentReactivated(uint256 indexed agentId);
    
    // ═══════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════
    
    error AgentDoesNotExist();
    error NotAgentOwnerOrOperator();
    error WalletAlreadyRegistered();
    error AgentNotActive();
    
    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════
    
    constructor() ERC721("Kuyay Agent Registry", "KAGENT") Ownable(msg.sender) {
        _agentIdCounter = 1;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // REGISTRATION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @notice Register a new agent
     * @param name Human-readable name of the agent
     * @param agentURI URI pointing to the agent registration file (IPFS, HTTPS, or data:)
     * @return agentId The unique identifier for this agent
     */
    function registerAgent(
        string calldata name,
        string calldata agentURI
    ) external returns (uint256 agentId) {
        agentId = _agentIdCounter++;
        
        agents[agentId] = AgentMetadata({
            name: name,
            agentWallet: address(0),
            active: true,
            registeredAt: uint48(block.timestamp),
            lastUpdated: uint48(block.timestamp)
        });
        
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        
        emit AgentRegistered(agentId, msg.sender, name, agentURI);
    }
    
    /**
     * @notice Register agent for another address (owner only)
     * @dev Used by protocol to register the Trinity agents
     */
    function registerAgentFor(
        address owner,
        string calldata name,
        string calldata agentURI
    ) external onlyOwner returns (uint256 agentId) {
        agentId = _agentIdCounter++;
        
        agents[agentId] = AgentMetadata({
            name: name,
            agentWallet: address(0),
            active: true,
            registeredAt: uint48(block.timestamp),
            lastUpdated: uint48(block.timestamp)
        });
        
        _safeMint(owner, agentId);
        _setTokenURI(agentId, agentURI);
        
        emit AgentRegistered(agentId, owner, name, agentURI);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // UPDATE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @notice Update the agent registration URI
     * @dev Can be called by owner or approved operator (ERC-8004 compliant)
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        if (!_exists(agentId)) revert AgentDoesNotExist();
        if (!_isAuthorized(ownerOf(agentId), msg.sender, agentId)) {
            revert NotAgentOwnerOrOperator();
        }
        
        _setTokenURI(agentId, newURI);
        agents[agentId].lastUpdated = uint48(block.timestamp);
        
        emit AgentURIUpdated(agentId, newURI);
    }
    
    /**
     * @notice Set the agent's wallet address for reputation tracking
     * @dev Optional field per ERC-8004
     */
    function setAgentWallet(uint256 agentId, address wallet) external {
        if (!_exists(agentId)) revert AgentDoesNotExist();
        if (!_isAuthorized(ownerOf(agentId), msg.sender, agentId)) {
            revert NotAgentOwnerOrOperator();
        }
        if (walletToAgent[wallet] != 0) revert WalletAlreadyRegistered();
        
        // Clear old wallet mapping
        address oldWallet = agents[agentId].agentWallet;
        if (oldWallet != address(0)) {
            walletToAgent[oldWallet] = 0;
        }
        
        agents[agentId].agentWallet = wallet;
        agents[agentId].lastUpdated = uint48(block.timestamp);
        walletToAgent[wallet] = agentId;
        
        emit AgentWalletSet(agentId, wallet);
    }
    
    /**
     * @notice Deactivate an agent
     */
    function deactivateAgent(uint256 agentId) external {
        if (!_exists(agentId)) revert AgentDoesNotExist();
        if (!_isAuthorized(ownerOf(agentId), msg.sender, agentId)) {
            revert NotAgentOwnerOrOperator();
        }
        
        agents[agentId].active = false;
        agents[agentId].lastUpdated = uint48(block.timestamp);
        
        emit AgentDeactivated(agentId);
    }
    
    /**
     * @notice Reactivate an agent
     */
    function reactivateAgent(uint256 agentId) external {
        if (!_exists(agentId)) revert AgentDoesNotExist();
        if (!_isAuthorized(ownerOf(agentId), msg.sender, agentId)) {
            revert NotAgentOwnerOrOperator();
        }
        
        agents[agentId].active = true;
        agents[agentId].lastUpdated = uint48(block.timestamp);
        
        emit AgentReactivated(agentId);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * @notice Get full agent URI (ERC-8004 compliant)
     * @dev tokenURI is referred to as agentURI in ERC-8004
     */
    function getAgentURI(uint256 agentId) external view returns (string memory) {
        if (!_exists(agentId)) revert AgentDoesNotExist();
        return tokenURI(agentId);
    }
    
    /**
     * @notice Get agent metadata
     */
    function getAgent(uint256 agentId) external view returns (
        string memory name,
        address agentWallet,
        bool active,
        uint48 registeredAt,
        uint48 lastUpdated,
        address owner
    ) {
        if (!_exists(agentId)) revert AgentDoesNotExist();
        AgentMetadata memory agent = agents[agentId];
        return (
            agent.name,
            agent.agentWallet,
            agent.active,
            agent.registeredAt,
            agent.lastUpdated,
            ownerOf(agentId)
        );
    }
    
    /**
     * @notice Check if agent is active
     */
    function isActive(uint256 agentId) external view returns (bool) {
        if (!_exists(agentId)) return false;
        return agents[agentId].active;
    }
    
    /**
     * @notice Get agent by wallet address
     */
    function getAgentByWallet(address wallet) external view returns (uint256) {
        return walletToAgent[wallet];
    }
    
    /**
     * @notice Get registry identifier (ERC-8004 format)
     * @return Registry identifier in format eip155:{chainId}:{address}
     */
    function getRegistryIdentifier() external view returns (string memory) {
        return string(abi.encodePacked(
            "eip155:",
            _toString(block.chainid),
            ":",
            _toHexString(address(this))
        ));
    }
    
    /**
     * @notice Get total number of registered agents
     */
    function totalAgents() external view returns (uint256) {
        return _agentIdCounter - 1;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 data = bytes20(addr);
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
