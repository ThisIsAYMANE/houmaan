'use client'

import { useState, useEffect } from 'react'
import { X, User, Trophy, TrendingUp, Coins, Edit2, Camera } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import toast from 'react-hot-toast'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  user: {
    id: string
    email: string
    username: string | null
    avatar: string | null
    vipLevel: number
    createdAt: string
  }
  profile: {
    firstName: string | null
    lastName: string | null
    language: string
    currency: string
    theme: string
    totalWinnings: number
    totalBets: number
    totalWagers: number
  } | null
}

const medalTypes = [
  { type: 'first_deposit', label: 'Premier dépôt', icon: '💰' },
  { type: 'first_bet', label: 'Premier pari', icon: '🎯' },
  { type: 'first_win', label: 'Première victoire', icon: '🏆' },
  { type: 'big_win', label: 'Gros gain', icon: '💎' },
  { type: 'loyalty', label: 'Fidélité', icon: '⭐' },
  { type: 'streak', label: 'Série', icon: '🔥' },
  { type: 'social', label: 'Social', icon: '👥' },
  { type: 'achievement', label: 'Réalisations', icon: '🎖️' },
]

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user: authUser, sessionToken } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (isOpen && sessionToken) {
      fetchProfile()
    }
  }, [isOpen, sessionToken])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch profile')
      }

      setProfile(result.data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors du chargement du profil'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const displayName =
    profile?.profile?.firstName && profile?.profile?.lastName
      ? `${profile.profile.firstName} ${profile.profile.lastName}`
      : profile?.user.username || profile?.user.email || 'Utilisateur'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background-secondary rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-background-elevated">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-background-elevated sticky top-0 bg-background-secondary z-10">
          <h2 className="text-2xl font-bold text-text-primary">Profil</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-background-elevated rounded-md transition-colors"
              title="Modifier"
            >
              <Edit2 className="w-5 h-5 text-text-secondary" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-elevated rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
              <p className="mt-4 text-text-secondary">Chargement...</p>
            </div>
          ) : (
            <>
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-accent-primary rounded-full flex items-center justify-center text-3xl font-bold text-background-primary">
                    {profile?.user.avatar ? (
                      <img
                        src={profile.user.avatar}
                        alt={displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-accent-primary rounded-full hover:bg-accent-primary/90 transition-colors">
                      <Camera className="w-4 h-4 text-background-primary" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-text-primary">
                    {displayName}
                  </h3>
                  <p className="text-text-secondary mt-1">
                    ID: {profile?.user.id.slice(0, 8)}...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Trophy className="w-4 h-4 text-accent-primary" />
                    <span className="text-sm font-medium text-accent-primary">
                      VIP Niveau {profile?.user.vipLevel || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-accent-primary" />
                    <span className="text-sm text-text-secondary">Gains totaux</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {profile?.profile?.totalWinnings
                      ? `${profile.profile.totalWinnings.toLocaleString('fr-FR')} ${profile.profile.currency}`
                      : '0 MAD'}
                  </p>
                </div>
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-accent-primary" />
                    <span className="text-sm text-text-secondary">Total paris</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {profile?.profile?.totalBets || 0}
                  </p>
                </div>
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-accent-primary" />
                    <span className="text-sm text-text-secondary">Total misées</span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary">
                    {profile?.profile?.totalWagers
                      ? `${profile.profile.totalWagers.toLocaleString('fr-FR')} ${profile.profile.currency}`
                      : '0 MAD'}
                  </p>
                </div>
              </div>

              {/* Medals Section */}
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-4">
                  Médailles
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  {medalTypes.map((medal) => (
                    <div
                      key={medal.type}
                      className="bg-background-elevated rounded-lg p-4 text-center hover:bg-background-primary transition-colors cursor-pointer"
                    >
                      <div className="text-4xl mb-2">{medal.icon}</div>
                      <p className="text-sm text-text-secondary">{medal.label}</p>
                      <div className="mt-2 w-full bg-background-secondary rounded-full h-1">
                        <div
                          className="bg-accent-primary h-1 rounded-full"
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-text-primary mb-4">
                  Informations
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Email
                    </label>
                    <p className="text-text-primary">{profile?.user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Langue
                    </label>
                    <p className="text-text-primary">
                      {profile?.profile?.language === 'fr' ? 'Français' : 'English'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Devise
                    </label>
                    <p className="text-text-primary">
                      {profile?.profile?.currency || 'MAD'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">
                      Membre depuis
                    </label>
                    <p className="text-text-primary">
                      {profile?.user.createdAt
                        ? new Date(profile.user.createdAt).toLocaleDateString('fr-FR')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}












