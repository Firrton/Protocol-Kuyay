/**
 * Smart Contract Addresses
 * TODO: Actualizar con addresses reales después del deploy
 */

export const CONTRACTS = {
  // Arbitrum Sepolia (testnet)
  arbitrumSepolia: {
    chainId: 421614,
    aguayoSBT: "0x8b48577F4252c19214d4C0c3240D1465606BDdAa",
    circleFactory: "0x9D4CA17641F9c3A6959058c51dD1C73d3c58CbbF",
    vault: "0xA63a6865c78ac03CC44ecDd9a113744DCFA72dF6",
    riskOracle: "0x2B8C421b276a7fc16f0b9BF78A3C7649Bc813F99",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // USDC de testnet
  },
} as const;

// Helper para obtener address según network
export function getContractAddress(
  network: keyof typeof CONTRACTS,
  contract: Exclude<keyof typeof CONTRACTS.arbitrumSepolia, 'chainId'>
): string {
  return CONTRACTS[network][contract] as string;
}

/**
 * Helper para verificar si un contrato está desplegado
 * Retorna false si la dirección es 0x0000...0000
 */
export function isContractDeployed(address: string): boolean {
  return address !== "0x0000000000000000000000000000000000000000" && address !== "";
}

/**
 * Verificar si los contratos principales están desplegados
 */
export const CONTRACTS_DEPLOYED = {
  aguayoSBT: isContractDeployed(CONTRACTS.arbitrumSepolia.aguayoSBT),
  circleFactory: isContractDeployed(CONTRACTS.arbitrumSepolia.circleFactory),
  vault: isContractDeployed(CONTRACTS.arbitrumSepolia.vault),
  riskOracle: isContractDeployed(CONTRACTS.arbitrumSepolia.riskOracle),
};
