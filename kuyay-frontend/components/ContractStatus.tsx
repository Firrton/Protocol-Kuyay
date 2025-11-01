"use client";

import { CONTRACTS, CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";

export default function ContractStatus() {
  const contracts = [
    { name: "AguayoSBT", address: CONTRACTS.arbitrumSepolia.aguayoSBT, deployed: CONTRACTS_DEPLOYED.aguayoSBT },
    { name: "CircleFactory", address: CONTRACTS.arbitrumSepolia.circleFactory, deployed: CONTRACTS_DEPLOYED.circleFactory },
    { name: "KuyayVault", address: CONTRACTS.arbitrumSepolia.vault, deployed: CONTRACTS_DEPLOYED.vault },
    { name: "RiskOracle", address: CONTRACTS.arbitrumSepolia.riskOracle, deployed: CONTRACTS_DEPLOYED.riskOracle },
  ];

  const allDeployed = contracts.every(c => c.deployed);

  return (
    <div className="bg-gradient-to-br from-profundo/80 to-transparent border-2 border-ceremonial/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${allDeployed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <h3 className="text-xl font-display font-bold text-ceremonial">
          Estado de Contratos
        </h3>
      </div>

      <div className="space-y-3">
        {contracts.map((contract) => (
          <div key={contract.name} className="bg-profundo/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-white">{contract.name}</p>
              <span className={`px-2 py-1 rounded text-xs font-mono ${
                contract.deployed
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {contract.deployed ? '✓ Deployed' : '✗ Not Deployed'}
              </span>
            </div>
            <p className="font-mono text-xs text-gris break-all">
              {contract.address}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-ceremonial/20">
        <p className="text-xs text-gris">
          <span className="font-semibold text-ceremonial">Red:</span> Arbitrum Sepolia (Chain ID: {CONTRACTS.arbitrumSepolia.chainId})
        </p>
      </div>
    </div>
  );
}
