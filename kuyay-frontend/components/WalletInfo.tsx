"use client";

import { useAccount,useBalance } from 'wagmi'

export default function WalletInfo() {
  const { address,isConnected } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })

  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-pachamama/20 to-transparent border-2 border-pachamama/50 rounded-xl p-6">
      <h3 className="text-xl font-display font-bold mb-4 text-pachamama">
        Wallet Connected ✅
      </h3>

      <div className="space-y-3">
        <div>
          <p className="text-gris text-sm mb-1">Address:</p>
          <p className="font-mono text-white break-all text-sm bg-profundo/50 px-3 py-2 rounded-lg">
            {address}
          </p>
        </div>

        <div>
          <p className="text-gris text-sm mb-1">Network:</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pachamama rounded-full animate-pulse"></div>
            <p className="text-white font-medium">Monad Mainnet</p>
          </div>
        </div>

        {balance && (
          <div>
            <p className="text-gris text-sm mb-1">Balance:</p>
            <p className="text-white font-mono text-lg">
              {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
