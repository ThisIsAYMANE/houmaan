'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react'

interface Payout {
  betId: string
  matchId: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  totalStake: number
  totalPayout: number
  betCount: number
  status: 'pending' | 'processed'
}

export default function PayoutsPage() {
  const router = useRouter()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchPayouts()
  }, [])

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/payouts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      const result = await response.json()
      if (result.success) {
        setPayouts(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const processMatch = async (matchId: string, result: 'home' | 'away' | 'draw' | 'void') => {
    if (!confirm(`Process all bets for this match as ${result.toUpperCase()}?`)) return

    setProcessing(matchId)
    try {
      const token = localStorage.getItem('admin_session_token')
      const response = await fetch('/api/admin/payouts/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matchId, result })
      })

      const data = await response.json()
      if (data.success) {
        alert(`✅ Processed ${data.processed} bets, Paid out ${data.totalPaid} MAD`)
        fetchPayouts()
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to process payouts')
    } finally {
      setProcessing(null)
    }
  }

  const filteredPayouts = payouts.filter(p =>
    p.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-500" />
          Payout Management
        </h1>
        <p className="text-gray-400 mt-2">Process bet settlements and payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Pending Matches</div>
          <div className="text-2xl font-bold text-white">
            {payouts.filter(p => p.status === 'pending').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total at Risk</div>
          <div className="text-2xl font-bold text-yellow-500">
            {payouts.reduce((sum, p) => sum + p.totalPayout, 0).toLocaleString()} MAD
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Pending Bets</div>
          <div className="text-2xl font-bold text-white">
            {payouts.reduce((sum, p) => sum + p.betCount, 0)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredPayouts.map((payout) => (
          <div
            key={payout.matchId}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="text-xl font-bold text-white mb-2">
                  {payout.homeTeam} vs {payout.awayTeam}
                </div>
                {payout.homeScore !== null && payout.awayScore !== null && (
                  <div className="text-lg text-gray-300">
                    Score: {payout.homeScore} - {payout.awayScore}
                  </div>
                )}
                <div className="text-sm text-gray-400 mt-2">
                  {payout.betCount} pending bets • {payout.totalStake.toLocaleString()} MAD stake •{' '}
                  {payout.totalPayout.toLocaleString()} MAD potential payout
                </div>
              </div>
              
              {payout.status === 'pending' && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => processMatch(payout.matchId, 'home')}
                    disabled={processing === payout.matchId}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Home Win
                  </button>
                  <button
                    onClick={() => processMatch(payout.matchId, 'draw')}
                    disabled={processing === payout.matchId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Draw
                  </button>
                  <button
                    onClick={() => processMatch(payout.matchId, 'away')}
                    disabled={processing === payout.matchId}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Away Win
                  </button>
                  <button
                    onClick={() => processMatch(payout.matchId, 'void')}
                    disabled={processing === payout.matchId}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Void
                  </button>
                </div>
              )}
              
              {payout.status === 'processed' && (
                <div className="px-6 py-3 bg-green-500/20 text-green-500 rounded-lg font-semibold">
                  ✓ Processed
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredPayouts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No matches found
          </div>
        )}
      </div>
    </div>
  )
}


