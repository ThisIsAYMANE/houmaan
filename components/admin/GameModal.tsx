'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Game {
  id?: string
  title: string
  thumbnail_url?: string
  category_id: string
  provider_id: string
  is_active: boolean
}

interface Category {
  id: string
  name: string
}

interface Provider {
  id: string
  name: string
}

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  game?: Game | null
  onSuccess: () => void
}

export default function GameModal({ isOpen, onClose, game, onSuccess }: GameModalProps) {
  const [formData, setFormData] = useState<Game>({
    title: '',
    thumbnail_url: '',
    category_id: '',
    provider_id: '',
    is_active: true,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndProviders()
      if (game) {
        setFormData({
          title: game.title || '',
          thumbnail_url: game.thumbnail_url || '',
          category_id: game.category_id || '',
          provider_id: game.provider_id || '',
          is_active: game.is_active !== undefined ? game.is_active : true,
        })
      } else {
        setFormData({
          title: '',
          thumbnail_url: '',
          category_id: '',
          provider_id: '',
          is_active: true,
        })
      }
    }
  }, [game, isOpen])

  const fetchCategoriesAndProviders = async () => {
    setLoadingData(true)
    try {
      const [categoriesRes, providersRes] = await Promise.all([
        fetch('/api/games/categories'),
        fetch('/api/games/providers'),
      ])

      const categoriesData = await categoriesRes.json()
      const providersData = await providersRes.json()

      if (categoriesData.success) {
        setCategories(categoriesData.data || [])
      }
      if (providersData.success) {
        setProviders(providersData.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories/providers:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('admin_session_token')
      const url = game?.id ? `/api/admin/games/${game.id}` : '/api/admin/games'
      const method = game?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(game?.id ? 'Jeu mis à jour' : 'Jeu créé')
        onSuccess()
        onClose()
      } else {
        toast.error(result.error?.message || 'Une erreur est survenue')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
      console.error('Error saving game:', error)
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
            {game?.id ? 'Modifier le jeu' : 'Nouveau jeu'}
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
              Titre *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL de l'image
            </label>
            <input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Catégorie *
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loadingData}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fournisseur *
            </label>
            <select
              required
              value={formData.provider_id}
              onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loadingData}
            >
              <option value="">Sélectionner un fournisseur</option>
              {providers.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Jeu actif
              </label>
              <p className="text-xs text-gray-400">Le jeu est visible pour les utilisateurs</p>
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
              disabled={loading || loadingData}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : game?.id ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

