'use client'

import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { SimpleWalletIcon } from './WalletIcons'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth-store'

interface WalletConnectButtonProps {
  walletName: string
  onSuccess?: () => void
  isLogin?: boolean
}

export default function WalletConnectButton({
  walletName,
  onSuccess,
  isLogin = false,
}: WalletConnectButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { connectWallet, signMessage, address } = useWallet()
  const { setUser, setSession } = useAuthStore()

  const handleConnect = async () => {
    setIsAuthenticating(true)

    try {
      // Step 1: Connect wallet
      const walletAddress = await connectWallet()
      if (!walletAddress) {
        setIsAuthenticating(false)
        return
      }

      // Step 2: Get nonce from server
      const nonceResponse = await fetch('/api/auth/wallet/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      const nonceResult = await nonceResponse.json()
      if (!nonceResponse.ok || !nonceResult.success) {
        throw new Error(nonceResult.error?.message || 'Erreur lors de la génération du nonce')
      }

      const { nonce } = nonceResult.data

      // Step 3: Sign message with wallet
      const message = `Sign this message to authenticate with Shartbandee\n\nNonce: ${nonce}`
      const signature = await signMessage(message)

      if (!signature) {
        setIsAuthenticating(false)
        return
      }

      // Step 4: Verify signature with server
      const verifyResponse = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          nonce,
        }),
      })

      const verifyResult = await verifyResponse.json()
      if (!verifyResponse.ok || !verifyResult.success) {
        throw new Error(verifyResult.error?.message || 'Erreur lors de la vérification')
      }

      // Step 5: Set user session
      setUser(verifyResult.data.user)
      setSession(verifyResult.data.sessionToken)

      if (verifyResult.data.isNewUser) {
        toast.success('Compte créé et connecté avec succès!')
      } else {
        toast.success('Connexion réussie!')
      }

      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la connexion'
      )
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isAuthenticating}
      className="flex items-center gap-3 px-4 py-3 bg-background-elevated hover:bg-background-primary border border-background-elevated rounded-lg text-text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <SimpleWalletIcon name={walletName} className="w-6 h-6" />
      <span className="font-medium text-sm">
        {isAuthenticating ? 'Connexion...' : walletName}
      </span>
    </button>
  )
}









