'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validation'
import { useAuthStore } from '@/stores/auth-store'
import toast from 'react-hot-toast'
import WalletConnectButton from './WalletConnectButton'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup?: () => void
  onLoginSuccess?: () => void
}

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToSignup,
  onLoginSuccess,
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password')
  const { setUser, setSession } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle different error formats
        const errorMessage = result.error?.message || 
                           result.message || 
                           (typeof result.error === 'string' ? result.error : 'Login failed')
        throw new Error(errorMessage)
      }

      // Check if result has data property (successResponse format)
      if (result.success && result.data) {
        setUser(result.data.user)
        setSession(result.data.sessionToken)
        toast.success('Connexion réussie!')
        
        // Call onLoginSuccess callback if provided (for redirects)
        if (onLoginSuccess) {
          onLoginSuccess()
        } else {
          onClose()
        }
      } else {
        // Fallback if response format is different
        throw new Error('Invalid response format from server')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la connexion'
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background-secondary rounded-lg shadow-xl w-full max-w-md mx-4 border border-background-elevated">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-background-elevated">
          <h2 className="text-2xl font-bold text-text-primary">Connexion</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-elevated rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-background-elevated">
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Mot de passe
          </button>
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'otp'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Code unique
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'password' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="votre@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Mot de passe
                </label>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="w-full px-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-accent-primary bg-background-elevated border-background-elevated rounded focus:ring-accent-primary"
                  />
                  <span className="text-sm text-text-secondary">
                    Se souvenir de moi
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-accent-primary hover:underline"
                >
                  Mot de passe oublié?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-accent-primary text-background-primary rounded-md font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="otp-email"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="otp-email"
                  className="w-full px-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="votre@email.com"
                />
              </div>

              <button className="w-full py-3 bg-accent-primary text-background-primary rounded-md font-medium hover:bg-accent-primary/90 transition-colors">
                Envoyer le code
              </button>

              <p className="text-sm text-text-secondary text-center">
                Un code unique sera envoyé à votre email
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-background-elevated">
            <p className="text-sm text-text-secondary text-center mb-4">
              Ou connectez-vous avec
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Social Login Options */}
              {['Google', 'X', 'Telegram', 'Line', 'Steam'].map((provider) => (
                <button
                  key={provider}
                  className="px-4 py-2 bg-background-elevated text-text-primary rounded-md text-sm font-medium hover:bg-background-primary transition-colors"
                  disabled
                  title="Bientôt disponible"
                >
                  {provider}
                </button>
              ))}
            </div>
            
            {/* Crypto Wallet Options */}
            <div className="mt-4">
              <p className="text-xs text-text-secondary text-center mb-3">
                Portefeuilles crypto
              </p>
              <div className="grid grid-cols-2 gap-2">
                <WalletConnectButton
                  walletName="MetaMask"
                  isLogin={true}
                  onSuccess={onClose}
                />
                <WalletConnectButton
                  walletName="WalletConnect"
                  isLogin={true}
                  onSuccess={onClose}
                />
                <WalletConnectButton
                  walletName="Coinbase"
                  isLogin={true}
                  onSuccess={onClose}
                />
                <WalletConnectButton
                  walletName="TrustWallet"
                  isLogin={true}
                  onSuccess={onClose}
                />
              </div>
            </div>
          </div>

          {onSwitchToSignup && (
            <div className="mt-6 text-center">
              <p className="text-sm text-text-secondary">
                Pas encore de compte?{' '}
                <button
                  onClick={onSwitchToSignup}
                  className="text-accent-primary hover:underline font-medium"
                >
                  S'inscrire
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}






