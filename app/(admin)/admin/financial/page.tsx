'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface FinancialData {
  totalDeposits: number
  totalWithdrawals: number
  totalBalance: number
  pendingDeposits: number
  pendingWithdrawals: number
}

export default function FinancialPage() {
  const router = useRouter()
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchFinancialData()
  }, [])

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
      <div>
        <h1 className="text-3xl font-bold text-white">Gestion financière</h1>
        <p className="text-gray-400 mt-2">Vue d'ensemble des finances de la plateforme</p>
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
                  currency: 'MAD',
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
                  currency: 'MAD',
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
                  currency: 'MAD',
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
                  currency: 'MAD',
                  minimumFractionDigits: 0,
                })}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-sm">
                  {((data.totalDeposits - data.totalWithdrawals) / data.totalDeposits * 100).toFixed(1)}%
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
        <h2 className="text-xl font-bold text-white mb-4">Transactions récentes</h2>
        <div className="text-center py-12 text-gray-400">
          Liste des transactions à venir...
        </div>
      </div>
    </div>
  )
}


