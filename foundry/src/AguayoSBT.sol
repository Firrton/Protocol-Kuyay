// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AguayoSBT
 * @author Kuyay Protocol
 * @notice NFT no-transferible que representa la reputación financiera del usuario
 *
 * METÁFORA VISUAL:
 * - Nivel 0: "Telar Vacío" - Usuario nuevo
 * - Nivel 1+: "Tejedor" - Cada pago añade un hilo
 * - Círculo completado: Añade un borde ceremonial
 * - Default: Añade una "Q'ipi" (mancha permanente)
 */
contract AguayoSBT is ERC721, Ownable {

    // Variables de estado
    uint256 private _tokenIdCounter;

    // Circles autorizados para actualizar Aguayos
    mapping(address => bool) public authorizedCircles;

    // Factories autorizadas para crear Circles
    mapping(address => bool) public authorizedFactories;

    // Metadata de cada Aguayo
    struct AguayoMetadata {
        uint8 level;                    // Nivel de reputación (0 = Telar Vacío, 1+ = Tejedor)
        uint32 totalThreads;            // Total de pagos exitosos
        uint16 completedCircles;        // Círculos completados
        uint16 stains;                  // Defaults acumulados
        uint48 lastActivityTimestamp;   // Última actualización
        bool isStained;                 // Tiene alguna mancha
    }

    // TokenID => Metadata
    mapping(uint256 => AguayoMetadata) public aguayos;

    // Usuario => TokenID (un Aguayo por dirección)
    mapping(address => uint256) public userToAguayo;

    event AguayoMinted(address indexed user, uint256 indexed tokenId);
    event ThreadAdded(uint256 indexed tokenId, uint32 newTotalThreads);
    event BorderAdded(uint256 indexed tokenId, uint16 newCompletedCircles, uint8 newLevel);
    event StainAdded(uint256 indexed tokenId, uint16 newStains);
    event CircleAuthorized(address indexed circleAddress);
    event CircleRevoked(address indexed circleAddress);
    event FactoryAuthorized(address indexed factoryAddress);
    event FactoryRevoked(address indexed factoryAddress);

    error AguayoAlreadyExists();
    error AguayoDoesNotExist();
    error NotAuthorizedCircle();
    error NotAuthorizedFactory();
    error TransferNotAllowed();
    error InvalidAddress();

    constructor() ERC721("Aguayo Digital", "AGUAYO") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    // Mintea un Aguayo Nivel 0 para el usuario que llama
    function mintAguayo() external returns (uint256) {
        return _mintAguayoFor(msg.sender);
    }

    // Mintea Aguayo para dirección específica (solo factory o owner)
    function mintAguayoFor(address user) external returns (uint256) {
        if (!authorizedFactories[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedFactory();
        }
        return _mintAguayoFor(user);
    }

    function _mintAguayoFor(address user) internal returns (uint256) {
        if (user == address(0)) revert InvalidAddress();
        if (userToAguayo[user] != 0) revert AguayoAlreadyExists();

        uint256 tokenId = _tokenIdCounter++;

        aguayos[tokenId] = AguayoMetadata({
            level: 0,
            totalThreads: 0,
            completedCircles: 0,
            stains: 0,
            lastActivityTimestamp: uint48(block.timestamp),
            isStained: false
        });

        _safeMint(user, tokenId);
        userToAguayo[user] = tokenId;

        emit AguayoMinted(user, tokenId);
        return tokenId;
    }

    // Añade un "hilo" al Aguayo (pago exitoso en una ronda)
    // Solo Circles autorizados
    function addWeave(uint256 tokenId) external onlyAuthorizedCircle {
        if (!_exists(tokenId)) revert AguayoDoesNotExist();

        AguayoMetadata storage aguayo = aguayos[tokenId];
        aguayo.totalThreads++;
        aguayo.lastActivityTimestamp = uint48(block.timestamp);

        emit ThreadAdded(tokenId, aguayo.totalThreads);
    }

    // Añade un "borde" al Aguayo (círculo completado)
    // Sube de nivel: nivel = círculos completados
    function addBorder(uint256 tokenId) external onlyAuthorizedCircle {
        if (!_exists(tokenId)) revert AguayoDoesNotExist();

        AguayoMetadata storage aguayo = aguayos[tokenId];
        aguayo.completedCircles++;
        aguayo.lastActivityTimestamp = uint48(block.timestamp);
        aguayo.level = uint8(aguayo.completedCircles);

        emit BorderAdded(tokenId, aguayo.completedCircles, aguayo.level);
    }

    // Añade una "mancha" (Q'ipi) al Aguayo por default
    // Marca la reputación como dañada permanentemente
    function addStain(uint256 tokenId) external onlyAuthorizedCircle {
        if (!_exists(tokenId)) revert AguayoDoesNotExist();

        AguayoMetadata storage aguayo = aguayos[tokenId];
        aguayo.stains++;
        aguayo.isStained = true;
        aguayo.lastActivityTimestamp = uint48(block.timestamp);

        emit StainAdded(tokenId, aguayo.stains);
    }

    function getAguayoByUser(address user) external view returns (uint256) {
        return userToAguayo[user];
    }

    function getAguayoMetadata(uint256 tokenId) external view returns (AguayoMetadata memory) {
        if (!_exists(tokenId)) revert AguayoDoesNotExist();
        return aguayos[tokenId];
    }

    function hasAguayo(address user) external view returns (bool) {
        return userToAguayo[user] != 0;
    }

    // Verifica si el Aguayo califica para Círculos de Crédito
    // Requiere: Nivel 1+ y sin manchas
    function isEligibleForCredit(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) return false;

        AguayoMetadata memory aguayo = aguayos[tokenId];
        return aguayo.level >= 1 && !aguayo.isStained;
    }

    function getLevel(uint256 tokenId) external view returns (uint8) {
        if (!_exists(tokenId)) revert AguayoDoesNotExist();
        return aguayos[tokenId].level;
    }

    function isAguayoStained(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) revert AguayoDoesNotExist();
        return aguayos[tokenId].isStained;
    }

    // Autoriza un Circle para actualizar Aguayos
    // Solo factory o owner
    function authorizeCircle(address circleAddress) external {
        if (!authorizedFactories[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedFactory();
        }
        if (circleAddress == address(0)) revert InvalidAddress();

        authorizedCircles[circleAddress] = true;
        emit CircleAuthorized(circleAddress);
    }

    function revokeCircle(address circleAddress) external onlyOwner {
        authorizedCircles[circleAddress] = false;
        emit CircleRevoked(circleAddress);
    }

    function authorizeFactory(address factoryAddress) external onlyOwner {
        if (factoryAddress == address(0)) revert InvalidAddress();
        authorizedFactories[factoryAddress] = true;
        emit FactoryAuthorized(factoryAddress);
    }

    function revokeFactory(address factoryAddress) external onlyOwner {
        authorizedFactories[factoryAddress] = false;
        emit FactoryRevoked(factoryAddress);
    }

    modifier onlyAuthorizedCircle() {
        if (!authorizedCircles[msg.sender]) revert NotAuthorizedCircle();
        _;
    }

    // Override para hacer el token no-transferible (Soul-Bound)
    // Permite minteo pero bloquea transferencias
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }

    // URL del metadata dinámico
    // En producción apuntaría a una API que genera SVGs según el estado del Aguayo
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert AguayoDoesNotExist();

        return string(abi.encodePacked(
            "https://api.kuyay.io/aguayo/",
            _toString(tokenId)
        ));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
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

    function _exists(uint256 tokenId) internal view returns (bool) {
        return super._ownerOf(tokenId) != address(0);
    }
}
