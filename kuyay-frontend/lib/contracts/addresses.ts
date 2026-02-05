/**
 * Smart Contract Addresses
 * Updated: 2026-02-04 - Monad Testnet Deployed ✅
 */

export const CONTRACTS = {
  // Monad Testnet (LIVE - Primary Network)
  monadTestnet: {
    chainId: 10143,
    // Core Contracts
    kuyayToken: "0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c",
    aguayoSBT: "0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1",
    kuyayVault: "0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1",
    riskOracle: "0x5483B6C35b975F24Ca21647650b1a93f8341B26a",
    circleFactory: "0x6536ee56e3f30A427bc83c208D829d059E8eEDA4", // Legacy
    circleFaithFactory: "0x61FC4578863DA32DC4e879F59e1cb673dA498618", // V2 - Active
    mockUSDC: "0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2",
  },
  // Arbitrum Sepolia (Legacy - for reference)
  arbitrumSepolia: {
    chainId: 421614,
    aguayoSBT: "0x8b48577F4252c19214d4C0c3240D1465606BDdAa",
    circleFactory: "0x9D4CA17641F9c3A6959058c51dD1C73d3c58CbbF",
    vault: "0xA63a6865c78ac03CC44ecDd9a113744DCFA72dF6",
    circleSimulator: "0x319570972527b9e3c989902311b9f808fe3553a4",
    riskOracle: "0xc9ca3c1ceaf97012daae2f270f65d957113da3be",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  },
} as const;

// Default network - MONAD TESTNET
export const DEFAULT_NETWORK = "monadTestnet" as const;
export const DEFAULT_CHAIN_ID = 10143;
export const RPC_URL = "https://testnet-rpc.monad.xyz/";

// Helper para obtener address según network
export function getContractAddress(
  network: keyof typeof CONTRACTS,
  contract: string
): string {
  const networkContracts = CONTRACTS[network] as Record<string,unknown>;
  return networkContracts[contract] as string || "";
}

/**
 * Helper para verificar si un contrato está desplegado
 */
export function isContractDeployed(address: string | undefined): boolean {
  return !!address && address !== "0x0000000000000000000000000000000000000000";
}

/**
 * Verificar si los contratos principales están desplegados en Monad
 */
export const CONTRACTS_DEPLOYED = {
  aguayoSBT: isContractDeployed(CONTRACTS.monadTestnet.aguayoSBT),
  circleFactory: isContractDeployed(CONTRACTS.monadTestnet.circleFaithFactory),
  kuyayToken: isContractDeployed(CONTRACTS.monadTestnet.kuyayToken),
  vault: isContractDeployed(CONTRACTS.monadTestnet.kuyayVault),
  riskOracle: isContractDeployed(CONTRACTS.monadTestnet.riskOracle),
};

// Monad Testnet-specific exports for easy access
export const MONAD_CONTRACTS = CONTRACTS.monadTestnet;
