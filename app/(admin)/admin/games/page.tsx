'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import GameModal from '@/components/admin/GameModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import toast from 'react-hot-toast'

interface Game {
  id: string
  title: string
  provider_name: string
  category_name: string
  thumbnail_url: string
  is_active: boolean
  category_id: string
  provider_id: string
}

export default function GamesPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; game: Game | null }>({
    isOpen: false,
    game: null,
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games')
      const result = await response.json()
      if (result.success || result.games) {
        setGames(result.games || result.data || [])
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (game: Game) => {
    // Fetch full game details including category_id and provider_id
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch(`/api/games/${game.id}`)
      const result = await response.json()
      
      if (result.game) {
        setSelectedGame({
          ...result.game,
          category_id: result.game.category_id || '',
          provider_id: result.game.provider_id || '',
        })
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching game details:', error)
      toast.error('Erreur lors du chargement du jeu')
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.game) return

    setDeleting(true)
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch(`/api/admin/games/${deleteModal.game.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Jeu supprimé avec succès')
        setDeleteModal({ isOpen: false, game: null })
        fetchGames()
      } else {
        toast.error(result.error?.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error('Error deleting game:', error)
    } finally {
      setDeleting(false)
    }
  }

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des jeux</h1>
          <p className="text-gray-400 mt-2">Gérer tous les jeux de la plateforme</p>
        </div>
        <button
          onClick={() => {
            setSelectedGame(null)
            setIsModalOpen(true)
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un jeu
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un jeu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-green-500 transition-colors"
            >
              <div className="relative aspect-video bg-gray-700">
                {game.thumbnail_url ? (
                  <img
                    src={game.thumbnail_url}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Pas d'image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {game.is_active ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Inactif
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium mb-1 truncate">{game.title}</h3>
                <p className="text-gray-400 text-sm mb-2">{game.provider_name}</p>
                <p className="text-gray-500 text-xs mb-4">{game.category_name}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(game)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, game })}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            Aucun jeu trouvé
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white mt-2">{games.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Actifs</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {games.filter(g => g.is_active).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Inactifs</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            {games.filter(g => !g.is_active).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Catégories</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {new Set(games.map(g => g.category_name)).size}
          </p>
        </div>
      </div>

      {/* Game Modal */}
      <GameModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGame(null)
        }}
        game={selectedGame}
        onSuccess={fetchGames}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, game: null })}
        onConfirm={handleDelete}
        title="Supprimer le jeu"
        message="Êtes-vous sûr de vouloir supprimer ce jeu ? Cette action est irréversible."
        itemName={deleteModal.game?.title}
        loading={deleting}
      />
    </div>
  )
}

