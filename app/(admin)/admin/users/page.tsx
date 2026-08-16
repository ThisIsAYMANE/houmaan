'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, MoreVertical, Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import UserModal from '@/components/admin/UserModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  username: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
  vip_level: number
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admin'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      const result = await response.json()
      if (result.success) {
        setUsers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && user.is_active) ||
      (filter === 'inactive' && !user.is_active) ||
      (filter === 'admin' && user.is_admin)

    return matchesSearch && matchesFilter
  })

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
          <h1 className="text-3xl font-bold text-white">Gestion des utilisateurs</h1>
          <p className="text-gray-400 mt-2">Gérer tous les utilisateurs de la plateforme</p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null)
            setIsModalOpen(true)
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par email ou nom d'utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'inactive' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Inactifs
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'admin' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  VIP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    title="Voir le détail de l'utilisateur"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{user.email}</div>
                        {user.username && (
                          <div className="text-sm text-gray-400">@{user.username}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Actif
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center">
                            <UserX className="w-3 h-3 mr-1" />
                            Inactif
                          </span>
                        )}
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">Niveau {user.vip_level || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setIsModalOpen(true)
                          }}
                          className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, user })}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-gray-400 font-medium">Aucun utilisateur trouvé</p>
                    <p className="text-gray-500 text-sm mt-1">Essayez de modifier votre recherche ou vos filtres</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white mt-2">{users.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Actifs</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {users.filter(u => u.is_active).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Inactifs</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            {users.filter(u => !u.is_active).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Admins</p>
          <p className="text-2xl font-bold text-purple-400 mt-2">
            {users.filter(u => u.is_admin).length}
          </p>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
        itemName={deleteModal.user?.email}
        loading={deleting}
      />
    </div>
  )

  async function handleDelete() {
    if (!deleteModal.user) return

    setDeleting(true)
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch(`/api/admin/users/${deleteModal.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Utilisateur supprimé avec succès')
        setDeleteModal({ isOpen: false, user: null })
        fetchUsers()
      } else {
        toast.error(result.error?.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error('Error deleting user:', error)
    } finally {
      setDeleting(false)
    }
  }
}

