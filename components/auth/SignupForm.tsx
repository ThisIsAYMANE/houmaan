'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validation'
import { useAuthStore } from '@/stores/auth-store'
import toast from 'react-hot-toast'

interface SignupFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export default function SignupForm({
  onSuccess,
  onSwitchToLogin,
}: SignupFormProps) {
  const { setUser, setSession } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Registration failed')
      }

      setUser(result.data.user)
      setSession(result.data.sessionToken)
      toast.success('Inscription réussie!')
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de l\'inscription'
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Email *
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
          htmlFor="username"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Nom d'utilisateur (optionnel)
        </label>
        <input
          {...register('username')}
          type="text"
          id="username"
          className="w-full px-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
          placeholder="nom_utilisateur"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Mot de passe *
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="w-full px-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          Minimum 8 caractères
        </p>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Téléphone (optionnel)
        </label>
        <input
          {...register('phone')}
          type="tel"
          id="phone"
          className="w-full px-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
          placeholder="+212 6XX XXX XXX"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          required
          className="mt-1 w-4 h-4 text-accent-primary bg-background-elevated border-background-elevated rounded focus:ring-accent-primary"
        />
        <label htmlFor="terms" className="text-sm text-text-secondary">
          J'accepte les{' '}
          <a href="/terms" className="text-accent-primary hover:underline">
            conditions d'utilisation
          </a>{' '}
          et la{' '}
          <a href="/privacy" className="text-accent-primary hover:underline">
            politique de confidentialité
          </a>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-accent-primary text-background-primary rounded-md font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Inscription...' : "S'inscrire"}
      </button>

      {onSwitchToLogin && (
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Déjà un compte?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-accent-primary hover:underline font-medium"
            >
              Se connecter
            </button>
          </p>
        </div>
      )}
    </form>
  )
}



