"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { useState, useEffect } from 'react'

export default function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <button className="bg-gradient-to-r from-ceremonial to-ocre text-white px-6 py-2 rounded-lg font-medium">
        Cargando...
      </button>
    )
  }

  const isCorrectNetwork = chainId === arbitrumSepolia.id

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-pachamama/20 border border-pachamama/50 rounded-lg px-4 py-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isCorrectNetwork ? 'bg-pachamama' : 'bg-warning'}`}></div>
          <span className="text-xs text-gris">
            {isCorrectNetwork ? 'Arbitrum Sepolia' : 'Red Incorrecta'}
          </span>
          <span className="text-xs font-mono text-white border-l border-gris/30 pl-2">
            {address.slice(0, 4)}...{address.slice(-3)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-tierra/50 hover:bg-peligro/50 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-tierra hover:border-peligro text-sm"
        >
          Desconectar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        const injectedConnector = connectors.find((c) => c.id === 'injected')
        if (injectedConnector) {
          connect({ connector: injectedConnector })
        }
      }}
      className="bg-gradient-to-r from-ceremonial to-ocre text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
    >
      Conectar Wallet
    </button>
  )
}
