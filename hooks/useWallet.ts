'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

interface WalletState {
  address: string | null
  isConnecting: boolean
  provider: ethers.BrowserProvider | null
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    provider: null,
  })

  useEffect(() => {
    // Check if wallet is already connected (only if MetaMask is installed)
    if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
      checkConnection()
    }
  }, [])

  const checkConnection = async () => {
    // Only check if MetaMask is actually available
    if (!window.ethereum?.isMetaMask) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      // Use send instead of listAccounts to avoid auto-connection
      const accounts = await provider.send('eth_accounts', [])
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        setWalletState({
          address,
          isConnecting: false,
          provider,
        })
      }
    } catch (error) {
      // Silently fail - wallet might not be connected or available
      // Don't log errors for missing wallets
    }
  }

  const connectWallet = async (): Promise<string | null> => {
    // Check if MetaMask is installed
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('Aucun portefeuille détecté. Veuillez installer MetaMask ou un autre portefeuille compatible.')
      return null
    }

    setWalletState(prev => ({ ...prev, isConnecting: true }))

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Request account access (this will prompt the user)
      await provider.send('eth_requestAccounts', [])
      
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setWalletState({
        address,
        isConnecting: false,
        provider,
      })

      return address
    } catch (error: any) {
      setWalletState(prev => ({ ...prev, isConnecting: false }))
      
      // Handle user rejection silently
      if (error.code === 4001) {
        // User rejected - don't show error, just return null
        return null
      }
      
      // Only show error for actual connection failures
      if (error.message?.includes('extension not found') || error.message?.includes('Failed to connect')) {
        toast.error('MetaMask n\'est pas installé. Veuillez installer MetaMask pour continuer.')
      } else {
        toast.error('Erreur lors de la connexion au portefeuille')
      }
      
      return null
    }
  }

  const signMessage = async (message: string): Promise<string | null> => {
    if (!walletState.provider || !walletState.address) {
      toast.error('Portefeuille non connecté')
      return null
    }

    try {
      const signer = await walletState.provider.getSigner()
      const signature = await signer.signMessage(message)
      return signature
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error('Signature refusée par l\'utilisateur')
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

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      send: (method: string, params?: any[]) => Promise<any>
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      selectedAddress?: string
    }
  }
}

