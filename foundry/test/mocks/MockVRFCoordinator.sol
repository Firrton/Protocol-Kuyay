// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

// Mock para testing local - simula Chainlink VRF V2 Plus sin gastar LINK
contract MockVRFCoordinator {

    uint256 private requestIdCounter = 1;

    mapping(uint256 => address) public requestIdToConsumer;

    event RandomWordsRequested(
        uint256 indexed requestId,
        address indexed consumer
    );

    event RandomWordsFulfilled(
        uint256 indexed requestId,
        uint256 randomWord
    );

    // Simula requestRandomWords de VRF V2 Plus
    // Recibe un struct VRFV2PlusClient.RandomWordsRequest
    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata /* req */
    ) external returns (uint256) {
        uint256 requestId = requestIdCounter++;
        requestIdToConsumer[requestId] = msg.sender;

        emit RandomWordsRequested(requestId, msg.sender);

        return requestId;
    }

    // Llama manualmente para simular el callback de Chainlink
    // En producción, Chainlink lo hace automáticamente
    function fulfillRandomWords(uint256 requestId) external {
        address consumer = requestIdToConsumer[requestId];
        require(consumer != address(0), "Request not found");

        // Genera número "aleatorio" basado en block data
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(
            keccak256(abi.encode(block.timestamp, block.prevrandao, requestId))
        );

        emit RandomWordsFulfilled(requestId, randomWords[0]);

        // Llama al callback del consumer (Circle.sol)
        (bool success,) = consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );

        require(success, "Callback failed");
    }

    // Sobrecarga para tests avanzados
    function fulfillRandomWords(uint256 requestId, address consumer, uint256[] memory randomWords) external {
        require(consumer != address(0), "Invalid consumer");

        emit RandomWordsFulfilled(requestId, randomWords[0]);

        // Llama al callback del consumer
        (bool success,) = consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );

        require(success, "Callback failed");
    }

    // Helper para tests: cumple el request inmediatamente
    function fulfillRandomWordsImmediately(uint256 requestId, uint256 randomWord) external {
        address consumer = requestIdToConsumer[requestId];
        require(consumer != address(0), "Request not found");

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomWord;

        (bool success,) = consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );

        require(success, "Callback failed");
    }
}
