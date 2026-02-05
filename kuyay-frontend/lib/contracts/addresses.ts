/**
 * Smart Contract Addresses
 * Updated: 2026-02-04 - Monad MAINNET ✅
 */

export const CONTRACTS = {
  // Monad MAINNET (LIVE - Production Network)
  monadMainnet: {
    chainId: 143,
    // Core Contracts
    kuyayToken: "0xF10Fba346c07110A2A8543Df8659F0b600fD7777",
    usdc: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // Real USDC
    circleFaithFactory: "0x7066e62307551fd6f14325F905e5268436557837",
    aguayoSBT: "0x10C93611831AEFFA3D0Fde086C682dfE7E3495Ac",
    // Legacy/Optional
    kuyayVault: "",
    riskOracle: "",
  },
  // Monad Testnet (Legacy - for reference)
  monadTestnet: {
    chainId: 10143,
    kuyayToken: "0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c",
    aguayoSBT: "0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1",
    kuyayVault: "0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1",
    riskOracle: "0x5483B6C35b975F24Ca21647650b1a93f8341B26a",
    circleFactory: "0x6536ee56e3f30A427bc83c208D829d059E8eEDA4",
    circleFaithFactory: "0x61FC4578863DA32DC4e879F59e1cb673dA498618",
    mockUSDC: "0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2",
  },
} as const;

// Default network - MONAD MAINNET
export const DEFAULT_NETWORK = "monadMainnet" as const;
export const DEFAULT_CHAIN_ID = 143;
export const RPC_URL = "https://rpc.monad.xyz/";
export const BLOCK_EXPLORER = "https://monad.xyz/explorer";

// Helper para obtener address según network
export function getContractAddress(
  network: keyof typeof CONTRACTS,
  contract: string
): string {
  const networkContracts = CONTRACTS[network] as Record<string,unknown>;
  return (networkContracts[contract] as string) || "";
}

/**
 * Verificar si un contrato está desplegado
 */
export function isContractDeployed(address: string | undefined): boolean {
  return !!address && address !== "0x0000000000000000000000000000000000000000" && address !== "";
}

/**
 * Verificar si los contratos principales están desplegados en Monad Mainnet
 */
export const CONTRACTS_DEPLOYED = {
  kuyayToken: isContractDeployed(CONTRACTS.monadMainnet.kuyayToken),
  usdc: isContractDeployed(CONTRACTS.monadMainnet.usdc),
  circleFaithFactory: isContractDeployed(CONTRACTS.monadMainnet.circleFaithFactory),
};

// Monad Mainnet-specific exports for easy access
export const MONAD_CONTRACTS = CONTRACTS.monadMainnet;

