// Deployed Contracts on Monad Testnet (Chain ID: 10143)
// Deployed: 2026-02-03
// Deployer: 0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac

export const MONAD_TESTNET_CONTRACTS = {
    // Token Sagrado
    KUYAY_TOKEN: "0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c" as const,

    // Sistema Base
    AGUAYO_SBT: "0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1" as const,
    KUYAY_VAULT: "0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1" as const,
    RISK_ORACLE: "0x5483B6C35b975F24Ca21647650b1a93f8341B26a" as const,

    // Fábricas de Ayllus
    CIRCLE_FACTORY: "0x6536ee56e3f30A427bc83c208D829d059E8eEDA4" as const,
    CIRCLE_FAITH_FACTORY: "0xD15ED9ea64B0a1d9535374F27de79111EbE872C1" as const,

    // Mock Token para testing
    MOCK_USDC: "0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2" as const,
} as const;

export const MONAD_TESTNET = {
    chainId: 10143,
    name: "Monad Testnet",
    rpcUrl: "https://testnet-rpc.monad.xyz/",
    explorer: "https://testnet.monadexplorer.com",
    currency: {
        name: "MON",
        symbol: "MON",
        decimals: 18,
    },
} as const;

// Export for convenience
export const CONTRACTS = MONAD_TESTNET_CONTRACTS;
