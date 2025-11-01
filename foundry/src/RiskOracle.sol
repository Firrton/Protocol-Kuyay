// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AguayoSBT.sol";

/**
 * @title RiskOracle
 * @author Kuyay Protocol
 * @notice Motor de evaluación de riesgo para Circles
 * 
 * Analiza la composición de grupos (niveles de Aguayo, manchas)
 * y calcula leverage permitido + tasas de interés
 */
contract RiskOracle is Ownable {

    AguayoSBT public immutable aguayoSBT;
    
    uint8 public minLevelForCredit = 1;              // Nivel mínimo para Modo Crédito
    uint256 public maxLeverageMultiplier = 500;      // Leverage máximo (5x)
    uint256 public baseInterestRateBps = 1000;       // Tasa base (10% APR)
    uint256 public riskPremiumPerStainBps = 200;     // Prima por mancha (+2%)

    struct LeverageTier {
        uint8 minAverageLevel;      // Nivel promedio mínimo del grupo
        uint256 multiplier;         // Multiplicador de leverage (100 = 1x)
        uint256 interestRateBps;    // Tasa de interés para este tier
    }

    LeverageTier[] public leverageTiers;

    event LeverageTierAdded(uint8 minAverageLevel, uint256 multiplier, uint256 interestRate);
    event LeverageTierUpdated(uint256 indexed tierId, uint8 minAverageLevel, uint256 multiplier, uint256 interestRate);
    event MinLevelForCreditUpdated(uint8 newMinLevel);
    event MaxLeverageUpdated(uint256 newMaxMultiplier);
    event BaseInterestRateUpdated(uint256 newRateBps);
    event RiskPremiumUpdated(uint256 newPremiumBps);

    error InvalidAddress();
    error InvalidParameter();
    error MemberNotEligible(address member);
    error InvalidTierId();
    error EmptyMemberList();

    constructor(address _aguayoSBT) Ownable(msg.sender) {
        if (_aguayoSBT == address(0)) revert InvalidAddress();
        aguayoSBT = AguayoSBT(_aguayoSBT);

        // Tiers por defecto
        leverageTiers.push(LeverageTier({
            minAverageLevel: 1,
            multiplier: 150,
            interestRateBps: 1200
        }));

        leverageTiers.push(LeverageTier({
            minAverageLevel: 3,
            multiplier: 300,
            interestRateBps: 1000
        }));

        leverageTiers.push(LeverageTier({
            minAverageLevel: 5,
            multiplier: 500,
            interestRateBps: 800
        }));
    }

    // Verifica si todos los miembros califican para Modo Crédito
    function areAllMembersEligible(address[] calldata members) external view returns (bool) {
        if (members.length == 0) return false;

        for (uint256 i = 0; i < members.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(members[i]);
            if (tokenId == 0) return false;
            if (!aguayoSBT.isEligibleForCredit(tokenId)) return false;
        }
        return true;
    }

    // Calcula leverage permitido e interés basado en el nivel promedio del grupo
    function getLeverageLevel(address[] calldata members)
        external
        view
        returns (uint256 multiplier, uint256 interestRateBps)
    {
        if (members.length == 0) revert EmptyMemberList();

        (uint256 avgLevel, uint256 stainedCount) = _getGroupStats(members);

        LeverageTier memory tier = _getTierForAverageLevel(uint8(avgLevel));

        multiplier = tier.multiplier;
        interestRateBps = tier.interestRateBps;

        if (stainedCount > 0) {
            uint256 leverageReduction = (multiplier * stainedCount * 10) / 100;
            multiplier = multiplier > leverageReduction ? multiplier - leverageReduction : 100;

            uint256 additionalInterest = stainedCount * riskPremiumPerStainBps;
            if (interestRateBps + additionalInterest > 10000) {
                interestRateBps = 10000;
            } else {
                interestRateBps += additionalInterest;
            }
        }

        if (multiplier > maxLeverageMultiplier) {
            multiplier = maxLeverageMultiplier;
        }

        return (multiplier, interestRateBps);
    }

    // Calcula probabilidades ponderadas para el sorteo VRF
    // Aguayos de mayor nivel tienen ligeramente mejor probabilidad
    function getWeightedProbabilities(address[] calldata members)
        external
        view
        returns (uint256[] memory weights)
    {
        if (members.length == 0) revert EmptyMemberList();

        weights = new uint256[](members.length);

        for (uint256 i = 0; i < members.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(members[i]);

            if (tokenId == 0) {
                weights[i] = 0;
                continue;
            }

            uint8 level = aguayoSBT.getLevel(tokenId);
            weights[i] = 10 + uint256(level);
        }

        return weights;
    }

    function getTotalWeight(uint256[] calldata weights) external pure returns (uint256) {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }
        return totalWeight;
    }

    // Valida si un miembro específico califica para un modo
    function isMemberEligible(address member, bool isCreditMode)
        external
        view
        returns (bool)
    {
        uint256 tokenId = aguayoSBT.userToAguayo(member);
        if (tokenId == 0) return false;
        if (!isCreditMode) return true;
        return aguayoSBT.isEligibleForCredit(tokenId);
    }

    function _getGroupStats(address[] calldata members)
        internal
        view
        returns (uint256 avgLevel, uint256 stainedCount)
    {
        uint256 totalLevel = 0;
        stainedCount = 0;

        for (uint256 i = 0; i < members.length; i++) {
            uint256 tokenId = aguayoSBT.userToAguayo(members[i]);
            if (tokenId == 0) revert MemberNotEligible(members[i]);

            AguayoSBT.AguayoMetadata memory aguayo = aguayoSBT.getAguayoMetadata(tokenId);
            totalLevel += aguayo.level;
            if (aguayo.isStained) stainedCount++;
        }

        avgLevel = totalLevel / members.length;
        return (avgLevel, stainedCount);
    }

    function _getTierForAverageLevel(uint8 avgLevel)
        internal
        view
        returns (LeverageTier memory)
    {
        for (uint256 i = leverageTiers.length; i > 0; i--) {
            LeverageTier memory tier = leverageTiers[i - 1];
            if (avgLevel >= tier.minAverageLevel) return tier;
        }
        return leverageTiers[0];
    }

    function getAllLeverageTiers() external view returns (LeverageTier[] memory) {
        return leverageTiers;
    }

    function getLeverageTier(uint256 tierId) external view returns (LeverageTier memory) {
        if (tierId >= leverageTiers.length) revert InvalidTierId();
        return leverageTiers[tierId];
    }

    function getLeverageTierCount() external view returns (uint256) {
        return leverageTiers.length;
    }

    function addLeverageTier(
        uint8 minAverageLevel,
        uint256 multiplier,
        uint256 interestRateBps
    ) external onlyOwner {
        if (multiplier == 0 || multiplier > maxLeverageMultiplier) revert InvalidParameter();
        if (interestRateBps == 0 || interestRateBps > 10000) revert InvalidParameter();

        leverageTiers.push(LeverageTier({
            minAverageLevel: minAverageLevel,
            multiplier: multiplier,
            interestRateBps: interestRateBps
        }));

        emit LeverageTierAdded(minAverageLevel, multiplier, interestRateBps);
    }

    function updateLeverageTier(
        uint256 tierId,
        uint8 minAverageLevel,
        uint256 multiplier,
        uint256 interestRateBps
    ) external onlyOwner {
        if (tierId >= leverageTiers.length) revert InvalidTierId();
        if (multiplier == 0 || multiplier > maxLeverageMultiplier) revert InvalidParameter();
        if (interestRateBps == 0 || interestRateBps > 10000) revert InvalidParameter();

        leverageTiers[tierId] = LeverageTier({
            minAverageLevel: minAverageLevel,
            multiplier: multiplier,
            interestRateBps: interestRateBps
        });

        emit LeverageTierUpdated(tierId, minAverageLevel, multiplier, interestRateBps);
    }

    function setMinLevelForCredit(uint8 newMinLevel) external onlyOwner {
        minLevelForCredit = newMinLevel;
        emit MinLevelForCreditUpdated(newMinLevel);
    }

    function setMaxLeverageMultiplier(uint256 newMaxMultiplier) external onlyOwner {
        if (newMaxMultiplier == 0 || newMaxMultiplier > 2000) revert InvalidParameter();
        maxLeverageMultiplier = newMaxMultiplier;
        emit MaxLeverageUpdated(newMaxMultiplier);
    }

    function setBaseInterestRate(uint256 newRateBps) external onlyOwner {
        if (newRateBps == 0 || newRateBps > 10000) revert InvalidParameter();
        baseInterestRateBps = newRateBps;
        emit BaseInterestRateUpdated(newRateBps);
    }

    function setRiskPremium(uint256 newPremiumBps) external onlyOwner {
        if (newPremiumBps > 1000) revert InvalidParameter();
        riskPremiumPerStainBps = newPremiumBps;
        emit RiskPremiumUpdated(newPremiumBps);
    }
}
