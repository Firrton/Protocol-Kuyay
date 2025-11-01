//! Monte Carlo Simulation Tests for Circle Simulator
//!
//! These tests verify the correctness and statistical properties
//! of the Monte Carlo simulation mechanism

#[cfg(test)]
mod tests {
    use circle_simulator::*;
    use stylus_sdk::alloy_primitives::{Address, U256};

    // Helper to create a simulator instance
    fn create_simulator() -> CircleSimulator {
        CircleSimulator {
            owner: Address::ZERO.into(),
            simulation_count: U256::ZERO.into(),
            last_simulation_gas: U256::ZERO.into(),
        }
    }

    #[test]
    fn test_initialization() {
        let mut sim = create_simulator();
        assert_eq!(sim.owner(), Address::ZERO);
        assert_eq!(sim.simulation_count(), U256::ZERO);
    }

    #[test]
    fn test_basic_simulation_params() {
        let mut sim = create_simulator();

        // Test with valid parameters
        let result = sim.simulate_circle(
            10,              // 10 members
            U256::from(100), // 100 wei cuota
            12,              // 12 rounds
            1000,            // 10% default probability
            100,             // 100 simulations
        );

        assert!(result.is_ok(), "Valid simulation should succeed");

        let (success_rate, expected_return, successes, best_case, worst_case) = result.unwrap();

        // With 10% default rate, we expect high success rate
        assert!(success_rate > 5000, "Success rate should be > 50% with low default rate");
        assert!(expected_return > U256::ZERO, "Expected return should be positive");
        assert!(successes > 0, "Should have some successful outcomes");
    }

    #[test]
    fn test_invalid_member_count() {
        let mut sim = create_simulator();

        // Test with 0 members (invalid)
        let result = sim.simulate_circle(
            0,
            U256::from(100),
            12,
            1000,
            100,
        );
        assert!(result.is_err(), "Should reject 0 members");

        // Test with >100 members (invalid)
        let result = sim.simulate_circle(
            101,
            U256::from(100),
            12,
            1000,
            100,
        );
        assert!(result.is_err(), "Should reject >100 members");
    }

    #[test]
    fn test_invalid_simulation_count() {
        let mut sim = create_simulator();

        // Test with 0 simulations
        let result = sim.simulate_circle(
            10,
            U256::from(100),
            12,
            1000,
            0,
        );
        assert!(result.is_err(), "Should reject 0 simulations");

        // Test with >10000 simulations
        let result = sim.simulate_circle(
            10,
            U256::from(100),
            12,
            1000,
            10001,
        );
        assert!(result.is_err(), "Should reject >10000 simulations");
    }

    #[test]
    fn test_high_default_probability() {
        let mut sim = create_simulator();

        // Test with 90% default probability
        let result = sim.simulate_circle(
            10,
            U256::from(100),
            12,
            9000, // 90% default rate
            100,
        );

        assert!(result.is_ok());
        let (success_rate, expected_return, _, _, _) = result.unwrap();

        // With 90% default rate, most simulations should fail
        assert!(success_rate < 5000, "Success rate should be < 50% with high default rate");

        // Expected return should be very low
        assert!(expected_return < U256::from(50), "Expected return should be minimal with high defaults");
    }

    #[test]
    fn test_zero_default_probability() {
        let mut sim = create_simulator();

        // Test with 0% default probability
        let result = sim.simulate_circle(
            5,               // 5 members
            U256::from(100), // 100 wei cuota
            12,              // 12 rounds
            0,               // 0% default rate
            100,
        );

        assert!(result.is_ok());
        let (success_rate, expected_return, successes, _, _) = result.unwrap();

        // All simulations should succeed with 0% default
        assert_eq!(success_rate, 10000, "Should have 100% success rate with 0% defaults");
        assert_eq!(successes, 100, "All 100 simulations should succeed");

        // Expected return should equal total contributions
        // 5 members * 100 wei * 12 rounds = 6000 wei total
        // Per member: 6000 / 5 = 1200 wei
        let expected_per_member = U256::from(1200);
        assert_eq!(expected_return, expected_per_member, "Return should match contributions");
    }

    #[test]
    fn test_percentile_ordering() {
        let mut sim = create_simulator();

        let result = sim.simulate_circle(
            10,
            U256::from(100),
            12,
            2000, // 20% default rate
            1000, // More sims for better percentile accuracy
        );

        assert!(result.is_ok());
        let (_, _, _, best_case, worst_case) = result.unwrap();

        // Best case (95th percentile) should be >= worst case (5th percentile)
        assert!(best_case >= worst_case, "95th percentile should be >= 5th percentile");
    }

    #[test]
    fn test_quick_simulate() {
        let mut sim = create_simulator();

        let result = sim.quick_simulate(
            8,               // 8 members
            U256::from(50),  // 50 wei cuota
            1500,            // 15% default probability
        );

        assert!(result.is_ok(), "Quick simulation should succeed");

        let (success_rate, expected_return) = result.unwrap();

        // Should return reasonable values
        assert!(success_rate <= 10000, "Success rate should be <= 100%");
        assert!(expected_return >= U256::ZERO, "Expected return should be non-negative");
    }

    #[test]
    fn test_simulation_count_increments() {
        let mut sim = create_simulator();

        let initial_count = sim.simulation_count();

        // Run one simulation
        let _ = sim.simulate_circle(10, U256::from(100), 12, 1000, 100);

        let after_count = sim.simulation_count();

        assert_eq!(after_count, initial_count + U256::from(1),
            "Simulation count should increment by 1");
    }

    #[test]
    fn test_different_member_counts() {
        let mut sim = create_simulator();

        // Test with different member counts
        for num_members in [3, 5, 10, 20, 50] {
            let result = sim.simulate_circle(
                num_members,
                U256::from(100),
                12,
                1500, // 15% default
                100,
            );

            assert!(result.is_ok(),
                "Simulation should work with {} members", num_members);

            let (success_rate, _, _, _, _) = result.unwrap();
            assert!(success_rate <= 10000, "Success rate should be valid percentage");
        }
    }

    #[test]
    fn test_expected_return_logic() {
        let mut sim = create_simulator();

        let num_members = 10u8;
        let cuota = U256::from(100);
        let num_rounds = 12u8;

        // Calculate theoretical max return (if everyone pays always)
        let max_return = cuota * U256::from(num_members) * U256::from(num_rounds)
                        / U256::from(num_members);

        let result = sim.simulate_circle(
            num_members,
            cuota,
            num_rounds,
            500, // 5% default (very low)
            100,
        );

        assert!(result.is_ok());
        let (_, expected_return, _, _, _) = result.unwrap();

        // Expected return should be close to max (but not exceed it)
        assert!(expected_return <= max_return,
            "Expected return should not exceed theoretical maximum");

        // With only 5% default, should be close to max
        assert!(expected_return > max_return * U256::from(80) / U256::from(100),
            "With low defaults, return should be >80% of max");
    }

    #[test]
    fn test_catastrophic_failure_threshold() {
        let mut sim = create_simulator();

        // With very high default rate, circles should fail catastrophically
        let result = sim.simulate_circle(
            10,
            U256::from(100),
            12,
            9500, // 95% default rate - should trigger 30% threshold
            100,
        );

        assert!(result.is_ok());
        let (success_rate, expected_return, _, _, worst_case) = result.unwrap();

        // Most should fail catastrophically
        assert!(success_rate < 1000, "Success rate should be very low");

        // Worst case should often be zero (catastrophic failure)
        assert_eq!(worst_case, U256::ZERO, "Worst case should be total loss");
    }

    #[test]
    fn test_deterministic_with_same_state() {
        let mut sim1 = create_simulator();
        let mut sim2 = create_simulator();

        // Both should start with same state
        let result1 = sim1.simulate_circle(10, U256::from(100), 12, 1500, 50);
        let result2 = sim2.simulate_circle(10, U256::from(100), 12, 1500, 50);

        assert!(result1.is_ok() && result2.is_ok());

        let (sr1, er1, _, _, _) = result1.unwrap();
        let (sr2, er2, _, _, _) = result2.unwrap();

        // Results should be identical with same initial state
        assert_eq!(sr1, sr2, "Success rates should match");
        assert_eq!(er1, er2, "Expected returns should match");
    }

    #[test]
    fn test_varying_round_numbers() {
        let mut sim = create_simulator();

        // More rounds = more opportunity for defaults
        let result_6_rounds = sim.simulate_circle(10, U256::from(100), 6, 2000, 100);
        let result_24_rounds = sim.simulate_circle(10, U256::from(100), 24, 2000, 100);

        assert!(result_6_rounds.is_ok());
        assert!(result_24_rounds.is_ok());

        let (sr_6, _, _, _, _) = result_6_rounds.unwrap();
        let (sr_24, _, _, _, _) = result_24_rounds.unwrap();

        // With same default rate, shorter circles should have higher success rate
        assert!(sr_6 >= sr_24,
            "Shorter circles should have equal or higher success rate");
    }
}
