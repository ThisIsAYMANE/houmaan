'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id?: string
  email: string
  username?: string | null
  is_active: boolean
  is_admin: boolean
  vip_level: number
  password?: string
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null
  onSuccess: () => void
}

export default function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState<User>({
    email: '',
    username: '',
    is_active: true,
    is_admin: false,
    vip_level: 0,
    password: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        username: user.username || '',
        is_active: user.is_active,
        is_admin: user.is_admin,
        vip_level: user.vip_level,
        password: '',
      })
    } else {
      setFormData({
        email: '',
        username: '',
        is_active: true,
        is_admin: false,
        vip_level: 0,
        password: '',
      })
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('admin_session_token')
      const url = user?.id ? `/api/admin/users/${user.id}` : '/api/admin/users'
      const method = user?.id ? 'PUT' : 'POST'

      const payload: any = {
        email: formData.email,
        username: formData.username || undefined,
        is_active: formData.is_active,
        is_admin: formData.is_admin,
        vip_level: formData.vip_level,
      }

      if (!user?.id || formData.password) {
        if (!formData.password || formData.password.length < 6) {
          toast.error('Le mot de passe doit contenir au moins 6 caractères')
          setLoading(false)
          return
        }
        payload.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(user?.id ? 'Utilisateur mis à jour' : 'Utilisateur créé')
        onSuccess()
        onClose()
      } else {
        toast.error(result.error?.message || 'Une erreur est survenue')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
      console.error('Error saving user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {user?.id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {user?.id ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
            </label>
            <input
              type="password"
              required={!user?.id}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Niveau VIP
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.vip_level}
              onChange={(e) => setFormData({ ...formData, vip_level: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Compte actif
              </label>
              <p className="text-xs text-gray-400">L'utilisateur peut se connecter</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_active ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Administrateur
              </label>
              <p className="text-xs text-gray-400">Accès au panneau d'administration</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_admin: !formData.is_admin })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_admin ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_admin ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : user?.id ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}








