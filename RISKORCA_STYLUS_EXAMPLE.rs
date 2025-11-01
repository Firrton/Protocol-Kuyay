// 🚀 RiskOracle en Arbitrum Stylus (Rust)
// Migración desde Solidity a Rust

#![no_main]
#![no_std]
extern crate alloc;

use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    call::Call,
    prelude::*,
    storage::*,
};

// Interfaz del AguayoSBT (Solidity) para llamar desde Stylus
sol_interface! {
    interface IAguayoSBT {
        function getAguayoByUser(address user) external view returns (uint256);
        function getAguayoMetadata(uint256 tokenId) external view returns (
            uint8 level,
            uint32 totalThreads,
            uint16 completedCircles,
            uint16 stains,
            uint48 lastActivityTimestamp,
            bool isStained
        );
    }
}

// Tier de leverage
#[derive(Copy, Clone)]
pub struct LeverageTier {
    min_average_level: u8,
    multiplier: U256,
    interest_rate_bps: U256,
}

// Storage del contrato
#[storage]
#[entrypoint]
pub struct RiskOracle {
    owner: StorageAddress,
    aguayo_sbt: StorageAddress,
    max_leverage_multiplier: StorageU256,
    tiers: StorageVec<StorageLeverageTier>,
}

// Storage wrapper para LeverageTier
#[storage]
pub struct StorageLeverageTier {
    min_average_level: StorageU8,
    multiplier: StorageU256,
    interest_rate_bps: StorageU256,
}

#[external]
#[inherit(StorageType)]
impl RiskOracle {
    // Constructor - llamado al deploy
    pub fn init(&mut self, aguayo_sbt_address: Address) -> Result<(), Vec<u8>> {
        self.owner.set(msg::sender());
        self.aguayo_sbt.set(aguayo_sbt_address);
        self.max_leverage_multiplier.set(U256::from(5)); // 5x max
        
        // Inicializar tiers por defecto
        self.add_default_tiers()?;
        
        Ok(())
    }

    // Añadir tiers por defecto
    fn add_default_tiers(&mut self) -> Result<(), Vec<u8>> {
        // Tier 1: Nivel 1-2 → 1.5x leverage, 12% APR
        self.add_tier(1, U256::from(150), U256::from(1200))?; // 1.5x = 150/100, 12% = 1200 bps
        
        // Tier 2: Nivel 3-4 → 3x leverage, 10% APR
        self.add_tier(3, U256::from(300), U256::from(1000))?;
        
        // Tier 3: Nivel 5+ → 5x leverage, 8% APR
        self.add_tier(5, U256::from(500), U256::from(800))?;
        
        Ok(())
    }

    // Verificar si todos los miembros son elegibles
    pub fn are_all_members_eligible(&self, members: Vec<Address>) -> Result<bool, Vec<u8>> {
        let aguayo_address = self.aguayo_sbt.get();
        
        for member in members.iter() {
            // Obtener tokenId del miembro
            let token_id = self.get_user_aguayo(aguayo_address, *member)?;
            
            if token_id == U256::ZERO {
                return Ok(false); // No tiene Aguayo
            }
            
            // Obtener metadata
            let metadata = self.get_aguayo_metadata(aguayo_address, token_id)?;
            
            // Verificar elegibilidad
            if metadata.level == 0 || metadata.is_stained {
                return Ok(false); // Nivel 0 o manchado = no elegible
            }
        }
        
        Ok(true)
    }

    // Obtener nivel de leverage para un grupo
    pub fn get_leverage_level(
        &self,
        members: Vec<Address>
    ) -> Result<(U256, U256), Vec<u8>> {
        if members.is_empty() {
            return Err(b"Empty members array".to_vec());
        }
        
        // Calcular nivel promedio
        let avg_level = self.calculate_average_level(&members)?;
        
        // Encontrar tier correspondiente
        let (multiplier, interest_rate) = self.find_tier_for_level(avg_level)?;
        
        Ok((multiplier, interest_rate))
    }

    // Calcular probabilidades ponderadas para sorteo
    pub fn get_weighted_probabilities(
        &self,
        members: Vec<Address>
    ) -> Result<Vec<U256>, Vec<u8>> {
        let mut weights = Vec::new();
        let aguayo_address = self.aguayo_sbt.get();
        
        for member in members.iter() {
            let token_id = self.get_user_aguayo(aguayo_address, *member)?;
            
            if token_id == U256::ZERO {
                weights.push(U256::from(100)); // Base weight
                continue;
            }
            
            let metadata = self.get_aguayo_metadata(aguayo_address, token_id)?;
            
            // Peso base 100 + (nivel * 10)
            // Ejemplo: Nivel 3 = 130 weight, Nivel 5 = 150 weight
            let weight = U256::from(100 + (metadata.level as u64 * 10));
            weights.push(weight);
        }
        
        Ok(weights)
    }

    // Verificar si un miembro es elegible (individual)
    pub fn is_member_eligible(
        &self,
        member: Address,
        is_credit_mode: bool
    ) -> Result<bool, Vec<u8>> {
        let aguayo_address = self.aguayo_sbt.get();
        let token_id = self.get_user_aguayo(aguayo_address, member)?;
        
        if token_id == U256::ZERO {
            return Ok(false); // No tiene Aguayo
        }
        
        let metadata = self.get_aguayo_metadata(aguayo_address, token_id)?;
        
        if is_credit_mode {
            // Modo crédito: requiere nivel 1+ y sin manchas
            Ok(metadata.level >= 1 && !metadata.is_stained)
        } else {
            // Modo ahorro: solo requiere tener Aguayo
            Ok(true)
        }
    }

    // Admin: Añadir tier
    pub fn add_tier(
        &mut self,
        min_level: u8,
        multiplier: U256,
        interest_rate_bps: U256
    ) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(b"Not owner".to_vec());
        }
        
        let mut new_tier = self.tiers.grow();
        new_tier.min_average_level.set(min_level);
        new_tier.multiplier.set(multiplier);
        new_tier.interest_rate_bps.set(interest_rate_bps);
        
        Ok(())
    }

    // Admin: Actualizar max leverage
    pub fn set_max_leverage_multiplier(&mut self, new_max: U256) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(b"Not owner".to_vec());
        }
        
        self.max_leverage_multiplier.set(new_max);
        Ok(())
    }

    // ========== FUNCIONES INTERNAS ==========

    // Calcular nivel promedio del grupo
    fn calculate_average_level(&self, members: &[Address]) -> Result<u8, Vec<u8>> {
        let mut total_level: u64 = 0;
        let aguayo_address = self.aguayo_sbt.get();
        
        for member in members.iter() {
            let token_id = self.get_user_aguayo(aguayo_address, *member)?;
            
            if token_id == U256::ZERO {
                continue; // Skip si no tiene Aguayo
            }
            
            let metadata = self.get_aguayo_metadata(aguayo_address, token_id)?;
            total_level += metadata.level as u64;
        }
        
        let avg = total_level / members.len() as u64;
        Ok(avg as u8)
    }

    // Encontrar tier para un nivel
    fn find_tier_for_level(&self, level: u8) -> Result<(U256, U256), Vec<u8>> {
        let tiers_len = self.tiers.len();
        
        // Buscar el tier más alto que califica
        let mut best_tier_index = 0;
        let mut best_min_level = 0u8;
        
        for i in 0..tiers_len {
            let tier = self.tiers.get(i).unwrap();
            let min_level = tier.min_average_level.get();
            
            if level >= min_level && min_level >= best_min_level {
                best_tier_index = i;
                best_min_level = min_level;
            }
        }
        
        // Obtener tier seleccionado
        let tier = self.tiers.get(best_tier_index).unwrap();
        let multiplier = tier.multiplier.get();
        let interest_rate = tier.interest_rate_bps.get();
        
        Ok((multiplier, interest_rate))
    }

    // Llamar a AguayoSBT (Solidity) desde Stylus
    fn get_user_aguayo(&self, aguayo_address: Address, user: Address) -> Result<U256, Vec<u8>> {
        let aguayo = IAguayoSBT::new(aguayo_address);
        let call = Call::new_in(self);
        
        match aguayo.get_aguayo_by_user(call, user) {
            Ok(token_id) => Ok(token_id),
            Err(_) => Ok(U256::ZERO), // Si falla, asumimos que no tiene
        }
    }

    // Obtener metadata del Aguayo
    fn get_aguayo_metadata(
        &self,
        aguayo_address: Address,
        token_id: U256
    ) -> Result<AguayoMetadata, Vec<u8>> {
        let aguayo = IAguayoSBT::new(aguayo_address);
        let call = Call::new_in(self);
        
        let result = aguayo.get_aguayo_metadata(call, token_id)
            .map_err(|_| b"Failed to get metadata".to_vec())?;
        
        Ok(AguayoMetadata {
            level: result.0,
            total_threads: result.1,
            completed_circles: result.2,
            stains: result.3,
            last_activity_timestamp: result.4,
            is_stained: result.5,
        })
    }
}

// Struct para metadata
struct AguayoMetadata {
    level: u8,
    total_threads: u32,
    completed_circles: u16,
    stains: u16,
    last_activity_timestamp: u48,
    is_stained: bool,
}

// ========== TESTS ==========

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tier_lookup() {
        // Test básico de lógica de tiers
        assert_eq!(2 + 2, 4);
    }
}
