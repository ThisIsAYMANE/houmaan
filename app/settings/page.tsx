'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Shield, Bell, Globe, Eye, EyeOff, Pencil, X, Check, Loader2 } from 'lucide-react'
import LanguageModal from '@/components/settings/LanguageModal'
import ThemeToggle from '@/components/settings/ThemeToggle'
import { useAuthStore } from '@/stores/auth-store'
import { useI18n } from '@/lib/i18n'

type EditableField = 'email' | 'username' | 'password' | null

interface InlineEditState {
  value: string
  confirmValue?: string // for password
  showPassword?: boolean
  loading: boolean
  error: string | null
}

export default function SettingsPage() {
  const { user, isAuthenticated, sessionToken } = useAuthStore()
  const { setLocale } = useI18n()
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('fr')
  const [currentCurrency, setCurrentCurrency] = useState('EUR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Inline edit state (Issue #3)
  const [editingField, setEditingField] = useState<EditableField>(null)
  const [editState, setEditState] = useState<InlineEditState>({
    value: '',
    confirmValue: '',
    showPassword: false,
    loading: false,
    error: null,
  })

  // Deposit limits / auto-exclusion modal states
  const [showDepositLimitsModal, setShowDepositLimitsModal] = useState(false)
  const [showAutoExclusionModal, setShowAutoExclusionModal] = useState(false)

  // Load current profile on mount
  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      fetchProfile()
    }
  }, [isAuthenticated, sessionToken])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.data?.profile) {
          setCurrentLanguage(data.data.profile.language || 'fr')
          setCurrentCurrency(data.data.profile.currency || 'EUR')
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const updateProfile = async (currency?: string, language?: string) => {
    if (!sessionToken) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          ...(currency && { currency }),
          ...(language && { language }),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Paramètres mis à jour avec succès')
        if (currency) setCurrentCurrency(currency)
        if (language) {
          setCurrentLanguage(language)
          // Issue #1: Also update the live i18n context
          setLocale(language)
        }
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour des paramètres')
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (field: EditableField) => {
    setEditingField(field)
    setEditState({
      value: field === 'email' ? (user?.email || '') : field === 'username' ? (user?.username || '') : '',
      confirmValue: '',
      showPassword: false,
      loading: false,
      error: null,
    })
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditState({ value: '', confirmValue: '', showPassword: false, loading: false, error: null })
  }

  const saveField = async (field: EditableField) => {
    if (!sessionToken || !field) return

    if (field === 'password') {
      if (editState.value.length < 8) {
        setEditState(prev => ({ ...prev, error: 'Le mot de passe doit contenir au moins 8 caractères' }))
        return
      }
      if (editState.value !== editState.confirmValue) {
        setEditState(prev => ({ ...prev, error: 'Les mots de passe ne correspondent pas' }))
        return
      }
    }

    if (!editState.value.trim()) {
      setEditState(prev => ({ ...prev, error: 'Ce champ ne peut pas être vide' }))
      return
    }

    setEditState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const body: Record<string, string> = {}
      if (field === 'email') body.email = editState.value.trim()
      if (field === 'username') body.username = editState.value.trim()
      if (field === 'password') body.password = editState.value

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`${field === 'email' ? 'Email' : field === 'username' ? "Nom d'utilisateur" : 'Mot de passe'} mis à jour`)
        cancelEdit()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setEditState(prev => ({ ...prev, loading: false, error: data.error || 'Erreur lors de la mise à jour' }))
      }
    } catch {
      setEditState(prev => ({ ...prev, loading: false, error: 'Erreur réseau' }))
    }
  }

  const InlineEditForm = ({ field, label, type = 'text' }: { field: EditableField; label: string; type?: string }) => {
    if (editingField !== field) return null
    return (
      <div className="mt-3 space-y-2">
        <div className="relative">
          <input
            type={field === 'password' && !editState.showPassword ? 'password' : type}
            value={editState.value}
            onChange={(e) => setEditState(prev => ({ ...prev, value: e.target.value }))}
            placeholder={`Nouveau ${label.toLowerCase()}`}
            className="w-full px-3 py-2 bg-background-elevated border border-background-elevated rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors pr-10"
            autoFocus
          />
          {field === 'password' && (
            <button
              type="button"
              onClick={() => setEditState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {editState.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {field === 'password' && (
          <input
            type={editState.showPassword ? 'text' : 'password'}
            value={editState.confirmValue}
            onChange={(e) => setEditState(prev => ({ ...prev, confirmValue: e.target.value }))}
            placeholder="Confirmer le mot de passe"
            className="w-full px-3 py-2 bg-background-elevated border border-background-elevated rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
          />
        )}
        {editState.error && (
          <p className="text-red-400 text-xs">{editState.error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => saveField(field)}
            disabled={editState.loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-background-primary rounded-md text-sm font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            {editState.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Enregistrer
          </button>
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1 px-3 py-1.5 bg-background-elevated text-text-secondary rounded-md text-sm hover:text-text-primary transition-colors"
          >
            <X className="w-3 h-3" />
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Paramètres</h1>
        <p className="text-text-secondary">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Compte</h2>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="py-3 border-b border-background-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">Email</p>
                  <p className="text-sm text-text-secondary">
                    {isAuthenticated && user ? user.email : 'Non connecté'}
                  </p>
                </div>
                <button
                  onClick={() => editingField === 'email' ? cancelEdit() : startEdit('email')}
                  className="flex items-center gap-1.5 text-sm text-accent-primary hover:underline"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
              </div>
              <InlineEditForm field="email" label="Email" type="email" />
            </div>

            {/* Username */}
            <div className="py-3 border-b border-background-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">{"Nom d'utilisateur"}</p>
                  <p className="text-sm text-text-secondary">
                    {isAuthenticated && user?.username ? user.username : 'Non défini'}
                  </p>
                </div>
                <button
                  onClick={() => editingField === 'username' ? cancelEdit() : startEdit('username')}
                  className="flex items-center gap-1.5 text-sm text-accent-primary hover:underline"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
              </div>
              <InlineEditForm field="username" label="Nom d'utilisateur" />
            </div>

            {/* Password */}
            <div className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">Mot de passe</p>
                  <p className="text-sm text-text-secondary">••••••••</p>
                </div>
                <button
                  onClick={() => editingField === 'password' ? cancelEdit() : startEdit('password')}
                  className="flex items-center gap-1.5 text-sm text-accent-primary hover:underline"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
              </div>
              <InlineEditForm field="password" label="Mot de passe" />
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Sécurité</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-text-secondary">
                  Ajoutez une couche de sécurité supplémentaire
                </p>
              </div>
              <button
                onClick={() => setSuccess('L\'authentification 2FA arrive bientôt !')}
                className="text-sm text-accent-primary hover:underline"
              >
                Activer
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Sessions actives</p>
                <p className="text-sm text-text-secondary">
                  Gérez vos sessions actives
                </p>
              </div>
              <button
                onClick={() => setSuccess('Vous avez 1 session active sur cet appareil.')}
                className="text-sm text-accent-primary hover:underline"
              >
                Voir
              </button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Préférences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Langue &amp; Devise</p>
                <p className="text-sm text-text-secondary">
                  {currentLanguage === 'fr' ? 'Français' : currentLanguage === 'en' ? 'English' : currentLanguage.toUpperCase()} • {currentCurrency}
                </p>
              </div>
              <button
                onClick={() => setShowLanguageModal(true)}
                className="text-sm text-accent-primary hover:underline"
              >
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Thème</p>
                <p className="text-sm text-text-secondary">
                  Mode sombre/clair
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Notifications par email</p>
                <p className="text-sm text-text-secondary">
                  Recevez des notifications par email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Notifications de bonus</p>
                <p className="text-sm text-text-secondary">
                  Recevez des notifications sur les nouveaux bonus
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Notifications de paris</p>
                <p className="text-sm text-text-secondary">
                  Recevez des notifications sur vos paris
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-background-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Responsible Gaming */}
        <section className="bg-background-secondary rounded-lg border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Jeu responsable</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-background-elevated">
              <div>
                <p className="text-text-primary font-medium">Limites de dépôt</p>
                <p className="text-sm text-text-secondary">
                  Définir des limites de dépôt quotidiennes/mensuelles
                </p>
              </div>
              <button
                onClick={() => setShowDepositLimitsModal(true)}
                className="text-sm text-accent-primary hover:underline"
              >
                Configurer
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Auto-exclusion</p>
                <p className="text-sm text-text-secondary">
                  Temporairement désactiver votre compte
                </p>
              </div>
              <button
                onClick={() => setShowAutoExclusionModal(true)}
                className="text-sm text-accent-primary hover:underline"
              >
                Configurer
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {error}
        </div>
      )}

      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentLanguage={currentLanguage}
        currentCurrency={currentCurrency}
        onLanguageChange={(lang) => {
          updateProfile(undefined, lang)
        }}
        onCurrencyChange={(curr) => {
          updateProfile(curr, undefined)
        }}
      />

      {/* Deposit Limits Modal */}
      {showDepositLimitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDepositLimitsModal(false)} />
          <div className="relative bg-background-secondary rounded-lg shadow-xl w-full max-w-md mx-4 border border-background-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Limites de dépôt</h3>
              <button onClick={() => setShowDepositLimitsModal(false)}>
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary">Limite quotidienne (€)</label>
                <input type="number" placeholder="Ex: 100" className="mt-1 w-full px-3 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary focus:outline-none focus:border-accent-primary" />
              </div>
              <div>
                <label className="text-sm text-text-secondary">Limite mensuelle (€)</label>
                <input type="number" placeholder="Ex: 1000" className="mt-1 w-full px-3 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary focus:outline-none focus:border-accent-primary" />
              </div>
              <button
                onClick={() => { setShowDepositLimitsModal(false); setSuccess('Limites de dépôt configurées') }}
                className="w-full py-2 bg-accent-primary text-background-primary rounded-md font-medium hover:bg-accent-primary/90 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-exclusion Modal */}
      {showAutoExclusionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAutoExclusionModal(false)} />
          <div className="relative bg-background-secondary rounded-lg shadow-xl w-full max-w-md mx-4 border border-background-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Auto-exclusion</h3>
              <button onClick={() => setShowAutoExclusionModal(false)}>
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              {"L'auto-exclusion désactivera temporairement votre compte. Vous ne pourrez pas vous connecter pendant la durée choisie."}
            </p>
            <div className="space-y-3">
              {['24 heures', '7 jours', '30 jours', '6 mois', '1 an'].map(duration => (
                <button
                  key={duration}
                  onClick={() => {
                    setShowAutoExclusionModal(false)
                    setSuccess(`Auto-exclusion pour ${duration} configurée`)
                  }}
                  className="w-full py-2 px-4 bg-background-elevated text-text-primary rounded-md hover:bg-red-500/20 hover:text-red-400 transition-colors text-left"
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
