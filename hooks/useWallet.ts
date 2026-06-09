'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  send?: (method: string, params?: unknown[]) => Promise<unknown>
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  selectedAddress?: string
}

interface WalletState {
  address: string | null
  isConnecting: boolean
  provider: EthereumProvider | null
}

function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null
  return window.ethereum || null
}

function firstAccount(accounts: unknown): string | null {
  return Array.isArray(accounts) && typeof accounts[0] === 'string' ? accounts[0] : null
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    provider: null,
  })

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    const provider = getEthereumProvider()
    if (!provider) return

    try {
      const accounts = await provider.request({ method: 'eth_accounts' })
      const address = firstAccount(accounts)

      if (address) {
        setWalletState({
          address,
          isConnecting: false,
          provider,
        })
      }
    } catch {
      // Wallet may be locked, unavailable, or not authorized yet.
    }
  }

  const connectWallet = async (): Promise<string | null> => {
    const provider = getEthereumProvider()

    if (!provider) {
      toast.error('Aucun portefeuille detecte. Veuillez installer MetaMask ou un autre portefeuille compatible.')
      return null
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true }))

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      const address = firstAccount(accounts)

      if (!address) {
        setWalletState((prev) => ({ ...prev, isConnecting: false }))
        return null
      }

      setWalletState({
        address,
        isConnecting: false,
        provider,
      })

      return address
    } catch (error: any) {
      setWalletState((prev) => ({ ...prev, isConnecting: false }))

      if (error?.code === 4001) {
        return null
      }

      toast.error('Erreur lors de la connexion au portefeuille')
      return null
    }
  }

  const signMessage = async (message: string): Promise<string | null> => {
    const provider = walletState.provider || getEthereumProvider()
    const address = walletState.address || provider?.selectedAddress || null

    if (!provider || !address) {
      toast.error('Portefeuille non connecte')
      return null
    }

    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      })

      return typeof signature === 'string' ? signature : null
    } catch (error: any) {
      if (error?.code === 4001) {
        toast.error("Signature refusee par l'utilisateur")
      } else {
        toast.error('Erreur lors de la signature')
      }
      return null
    }
  }

  const disconnect = () => {
    setWalletState({
      address: null,
      isConnecting: false,
      provider: null,
    })
  }

  return {
    ...walletState,
    connectWallet,
    signMessage,
    disconnect,
  }
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}
