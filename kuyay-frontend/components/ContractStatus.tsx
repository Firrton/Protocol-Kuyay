"use client";

import { CONTRACTS,CONTRACTS_DEPLOYED } from "@/lib/contracts/addresses";

export default function ContractStatus() {
  const contracts = [
    { name: "KUYAY Token",address: CONTRACTS.monadMainnet.kuyayToken,deployed: CONTRACTS_DEPLOYED.kuyayToken },
    { name: "USDC",address: CONTRACTS.monadMainnet.usdc,deployed: CONTRACTS_DEPLOYED.usdc },
    { name: "AguayoSBT",address: CONTRACTS.monadMainnet.aguayoSBT,deployed: true },
    { name: "CircleFaithFactory",address: CONTRACTS.monadMainnet.circleFaithFactory,deployed: CONTRACTS_DEPLOYED.circleFaithFactory },
  ];

  const allDeployed = contracts.every(c => c.deployed);

  return (
    <div className="bg-gradient-to-br from-profundo/80 to-transparent border-2 border-ceremonial/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${allDeployed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <h3 className="text-xl font-display font-bold text-ceremonial">
          Contract Status
        </h3>
      </div>

      <div className="space-y-3">
        {contracts.map((contract) => (
          <div key={contract.name} className="bg-profundo/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-white">{contract.name}</p>
              <span className={`px-2 py-1 rounded text-xs font-mono ${contract.deployed
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
          <span className="font-semibold text-ceremonial">Network:</span> Monad Mainnet (Chain ID: {CONTRACTS.monadMainnet.chainId})
        </p>
      </div>
    </div>
  );
}
