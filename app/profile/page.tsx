'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, AtSign, Calendar, Wallet, TrendingUp, Trophy, Pencil, Check, X, Loader2, Eye, EyeOff, Shield, Star } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface ProfileData {
  user: {
    id: string
    email: string
    username: string
    avatar?: string
    vipLevel?: number
    createdAt: string
  }
  profile: {
    firstName?: string
    lastName?: string
    language?: string
    currency?: string
    totalWinnings?: number
    totalBets?: number
    totalWagers?: number
  } | null
  wallet?: {
    balance: number
    currency: string
  }
}

type EditableField = 'email' | 'username' | 'password' | null

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, sessionToken, user: authUser } = useAuthStore()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Inline edit state
  const [editingField, setEditingField] = useState<EditableField>(null)
  const [editValue, setEditValue] = useState('')
  const [editConfirm, setEditConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchProfile()
  }, [isAuthenticated, sessionToken])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setProfileData(data.data)
      } else {
        setError('Impossible de charger le profil')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (field: EditableField, currentValue = '') => {
    setEditingField(field)
    setEditValue(field === 'password' ? '' : currentValue)
    setEditConfirm('')
    setShowPassword(false)
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValue('')
    setEditConfirm('')
    setEditError(null)
  }

  const saveEdit = async () => {
    if (!editingField || !sessionToken) return

    if (!editValue.trim()) {
      setEditError('Ce champ ne peut pas être vide')
      return
    }
    if (editingField === 'password') {
      if (editValue.length < 8) {
        setEditError('Minimum 8 caractères')
        return
      }
      if (editValue !== editConfirm) {
        setEditError('Les mots de passe ne correspondent pas')
        return
      }
    }

    setEditLoading(true)
    setEditError(null)

    try {
      const body: Record<string, string> = {}
      if (editingField === 'email') body.email = editValue.trim()
      if (editingField === 'username') body.username = editValue.trim()
      if (editingField === 'password') body.password = editValue

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setSuccess('Profil mis à jour avec succès')
        cancelEdit()
        fetchProfile()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await response.json()
        setEditError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      setEditError('Erreur réseau')
    } finally {
      setEditLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    )
  }

  const user = profileData?.user
  const profile = profileData?.profile
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
  const winRate = profile?.totalBets && profile.totalBets > 0
    ? ((profile.totalWinnings || 0) > 0 ? Math.round(((profile.totalWinnings || 0) / Math.max(profile.totalWagers || 1, 1)) * 100) : 0)
    : 0

  const fieldLabel: Record<NonNullable<EditableField>, string> = {
    email: 'Email',
    username: "Nom d'utilisateur",
    password: 'Mot de passe',
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Mon Profil</h1>
        <p className="text-text-secondary">Gérez vos informations personnelles</p>
      </div>

      {/* Profile Card */}
      <div className="bg-background-secondary rounded-xl border border-background-elevated p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-background-elevated flex items-center justify-center flex-shrink-0 border-2 border-accent-primary">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-accent-primary">
                {(user?.username || user?.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-text-primary truncate">
                {user?.username || 'Utilisateur'}
              </h2>
              {user?.vipLevel && user.vipLevel > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                  <Star className="w-3 h-3" />
                  VIP {user.vipLevel}
                </span>
              )}
            </div>
            <p className="text-text-secondary text-sm mb-2">{user?.email}</p>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Calendar className="w-3.5 h-3.5" />
              <span>Membre depuis {joinDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="bg-background-secondary rounded-xl border border-background-elevated p-6">
          <div className="flex items-center gap-3 mb-5">
            <User className="w-5 h-5 text-accent-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Informations du compte</h3>
          </div>

          <div className="space-y-5">
            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-secondary">Email</span>
                </div>
                {editingField !== 'email' && (
                  <button
                    onClick={() => startEdit('email', user?.email || '')}
                    className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    Modifier
                  </button>
                )}
              </div>
              {editingField === 'email' ? (
                <div className="space-y-2 mt-2">
                  <input
                    type="email"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                  />
                  {editError && <p className="text-red-400 text-xs">{editError}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={editLoading} className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-background-primary rounded text-xs font-medium disabled:opacity-50">
                      {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Enregistrer
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 bg-background-elevated text-text-secondary rounded text-xs">
                      <X className="w-3 h-3" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-primary font-medium">{user?.email || '—'}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-secondary">{"Nom d'utilisateur"}</span>
                </div>
                {editingField !== 'username' && (
                  <button
                    onClick={() => startEdit('username', user?.username || '')}
                    className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    Modifier
                  </button>
                )}
              </div>
              {editingField === 'username' ? (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                  />
                  {editError && <p className="text-red-400 text-xs">{editError}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={editLoading} className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-background-primary rounded text-xs font-medium disabled:opacity-50">
                      {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Enregistrer
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 bg-background-elevated text-text-secondary rounded text-xs">
                      <X className="w-3 h-3" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-primary font-medium">{user?.username || '—'}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-secondary">Mot de passe</span>
                </div>
                {editingField !== 'password' && (
                  <button
                    onClick={() => startEdit('password')}
                    className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    Modifier
                  </button>
                )}
              </div>
              {editingField === 'password' ? (
                <div className="space-y-2 mt-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      autoFocus
                      placeholder="Nouveau mot de passe (min. 8 car.)"
                      className="w-full px-3 py-2 pr-9 bg-background-elevated border border-transparent rounded-md text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editConfirm}
                    onChange={e => setEditConfirm(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    className="w-full px-3 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                  />
                  {editError && <p className="text-red-400 text-xs">{editError}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={editLoading} className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-background-primary rounded text-xs font-medium disabled:opacity-50">
                      {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Enregistrer
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 bg-background-elevated text-text-secondary rounded text-xs">
                      <X className="w-3 h-3" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-primary font-medium">••••••••</p>
              )}
            </div>

            {/* Member since */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-secondary">Membre depuis</span>
              </div>
              <p className="text-text-primary font-medium">{joinDate}</p>
            </div>
          </div>
        </div>

        {/* Betting Statistics */}
        <div className="space-y-6">
          {/* Wallet / Balance */}
          <div className="bg-background-secondary rounded-xl border border-background-elevated p-6">
            <div className="flex items-center gap-3 mb-5">
              <Wallet className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Portefeuille</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">Solde</p>
                <p className="text-xl font-bold text-accent-primary">
                  {profile?.currency === 'USD' ? '$' : '€'}{profileData?.wallet?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">Devise</p>
                <p className="text-xl font-bold text-text-primary">{profile?.currency || 'EUR'}</p>
              </div>
            </div>
          </div>

          {/* Betting stats */}
          <div className="bg-background-secondary rounded-xl border border-background-elevated p-6">
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Statistiques paris</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">Total paris</p>
                <p className="text-xl font-bold text-text-primary">{profile?.totalBets || 0}</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">Gains totaux</p>
                <p className="text-xl font-bold text-green-400">
                  {profile?.currency === 'USD' ? '$' : '€'}{profile?.totalWinnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">Total misé</p>
                <p className="text-xl font-bold text-text-primary">
                  {profile?.currency === 'USD' ? '$' : '€'}{profile?.totalWagers?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xs text-text-secondary mb-1">Taux retour</p>
                <p className="text-xl font-bold text-blue-400">{winRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
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
    </div>
  )
}
