interface ICircleSimulator  {
    function initialize() external;

    function simulateCircle(uint8 num_members, uint256 cuota_amount, uint8 num_rounds, uint32 avg_default_probability, uint16 num_simulations) external returns (uint32, uint256, uint32, uint256, uint256);

    function quickSimulate(uint8 num_members, uint256 cuota_amount, uint32 avg_default_prob) external returns (uint32, uint256);

    function owner() external view returns (address);

    function simulationCount() external view returns (uint256);

    function lastGasUsed() external view returns (uint256);
}
