'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Bitcoin,
  Wallet,
  TrendingUpIcon
} from 'lucide-react'

interface FinancialData {
  totalDeposits: number
  totalWithdrawals: number
  totalBalance: number
  pendingDeposits: number
  pendingWithdrawals: number
}

interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: string
  btc_amount: number | null
  address: string | null
  tx_hash: string | null
  status: string
  network: string | null
  created_at: string
  type: string
  email: string
  username: string | null
}

export default function FinancialPage() {
  const router = useRouter()
  const [data, setData] = useState<FinancialData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchFinancialData()
    fetchTransactions()
  }, [typeFilter, statusFilter, page])

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/stats', {
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
        setData({
          totalDeposits: result.data.financial.totalDeposits,
          totalWithdrawals: result.data.financial.totalWithdrawals,
          totalBalance: result.data.financial.totalBalance,
          pendingDeposits: 0,
          pendingWithdrawals: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    setTxLoading(true)
    try {
      const token = localStorage.getItem('admin_session_token')
      const params = new URLSearchParams({
        type: typeFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      })
      
      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactions(result.data.transactions)
          setTotalPages(result.data.pagination.totalPages)
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setTxLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      case 'processing':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'withdrawal':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'bet':
        return <TrendingUpIcon className="w-4 h-4 text-blue-500" />
      case 'win':
        return <DollarSign className="w-4 h-4 text-yellow-500" />
      default:
        return <Wallet className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion financière</h1>
          <p className="text-gray-400 mt-2">Vue d'ensemble des finances de la plateforme</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Solde total</p>
              <p className="text-3xl font-bold text-white mt-2">
                {data.totalBalance.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Dépôts totaux</p>
              <p className="text-3xl font-bold text-white mt-2">
                {data.totalDeposits.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                })}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-sm flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Entrées
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Retraits totaux</p>
              <p className="text-3xl font-bold text-white mt-2">
                {data.totalWithdrawals.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                })}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-red-400 text-sm flex items-center">
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                  Sorties
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Bénéfice net</p>
              <p className="text-3xl font-bold text-white mt-2">
                {(data.totalDeposits - data.totalWithdrawals).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                })}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-sm">
                  {data.totalDeposits > 0 
                    ? ((data.totalDeposits - data.totalWithdrawals) / data.totalDeposits * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Transactions</h2>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tous les types</option>
              <option value="deposit">Dépôts</option>
              <option value="withdrawal">Retraits</option>
              <option value="bet">Paris</option>
              <option value="win">Gains</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En traitement</option>
              <option value="completed">Complété</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
        </div>

        {txLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Chargement des transactions...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Aucune transaction trouvée</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Utilisateur</th>
                    <th className="pb-3 font-medium">Montant</th>
                    <th className="pb-3 font-medium">BTC</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">TX Hash</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          <span className="text-white capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="text-white">{tx.username || 'Anonyme'}</div>
                          <div className="text-gray-400 text-xs">{tx.email}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-white font-medium">
                          {tx.amount.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: tx.currency || 'EUR',
                          })}
                        </span>
                      </td>
                      <td className="py-4">
                        {tx.btc_amount ? (
                          <div className="flex items-center gap-1 text-orange-400">
                            <Bitcoin className="w-3 h-3" />
                            <span>{tx.btc_amount.toFixed(8)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4">
                        {tx.tx_hash ? (
                          <a
                            href={`https://blockstream.info/${tx.network === 'testnet' ? 'testnet/' : ''}tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs font-mono"
                          >
                            {tx.tx_hash.substring(0, 8)}...
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Précédent
                </button>
                <span className="text-gray-400">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
