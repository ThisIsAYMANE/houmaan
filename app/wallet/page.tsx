'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import CryptoPaymentModal from '@/components/wallet/CryptoPaymentModal'
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
} from 'lucide-react'

interface WalletBalance {
  balance: number
  bonusBalance: number
  lockedBalance: number
  currency: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  description?: string
  createdAt: string
  referenceType?: string
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  confirmed: <CheckCircle className="w-4 h-4 text-green-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  processing: <Clock className="w-4 h-4 text-yellow-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  cancelled: <XCircle className="w-4 h-4 text-red-400" />,
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-green-400',
  confirmed: 'text-green-400',
  pending: 'text-yellow-400',
  processing: 'text-yellow-400',
  failed: 'text-red-400',
  cancelled: 'text-red-400',
}

const TYPE_LABEL: Record<string, string> = {
  deposit: 'Dépôt',
  withdrawal: 'Retrait',
  bet: 'Pari',
  win: 'Gain',
  bonus: 'Bonus',
  refund: 'Remboursement',
}

const TYPE_SIGN: Record<string, string> = {
  deposit: '+',
  win: '+',
  bonus: '+',
  refund: '+',
  withdrawal: '-',
  bet: '-',
}

const TYPE_COLOR: Record<string, string> = {
  deposit: 'text-green-400',
  win: 'text-green-400',
  bonus: 'text-purple-400',
  refund: 'text-blue-400',
  withdrawal: 'text-red-400',
  bet: 'text-orange-400',
}

const ITEMS_PER_PAGE = 10

export default function WalletPage() {
  const { isAuthenticated, sessionToken } = useAuthStore()
  const router = useRouter()

  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalTx, setTotalTx] = useState(0)
  const [page, setPage] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [depositOpen, setDepositOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const authHeader: Record<string, string> = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}

  const fetchBalance = useCallback(async () => {
    if (!sessionToken) return
    try {
      const res = await fetch('/api/wallet/balance', { headers: authHeader })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.data ?? data)
      }
    } catch (err) {
      console.error('Balance fetch error:', err)
    } finally {
      setBalanceLoading(false)
    }
  }, [sessionToken])

  const fetchTransactions = useCallback(async () => {
    if (!sessionToken) return
    setTxLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String(page * ITEMS_PER_PAGE),
      })
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const res = await fetch(`/api/wallet/transactions?${params}`, { headers: authHeader })
      if (res.ok) {
        const data = await res.json()
        const payload = data.data ?? data
        setTransactions(payload.transactions ?? payload.items ?? [])
        setTotalTx(payload.total ?? payload.count ?? 0)
      }
    } catch (err) {
      console.error('Transactions fetch error:', err)
    } finally {
      setTxLoading(false)
    }
  }, [sessionToken, page, typeFilter])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchBalance(), fetchTransactions()])
    setRefreshing(false)
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance()
    } else {
      setBalanceLoading(false)
    }
  }, [isAuthenticated, fetchBalance])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions()
    }
  }, [isAuthenticated, fetchTransactions])

  const totalPages = Math.ceil(totalTx / ITEMS_PER_PAGE)

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-accent-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Accès au portefeuille</h2>
          <p className="text-text-secondary">Connectez-vous pour accéder à votre portefeuille</p>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-primary/90 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  // ── Main wallet page ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Portefeuille</h1>
            <p className="text-sm text-text-secondary">Gérez vos fonds et transactions</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-background-elevated text-text-secondary hover:text-text-primary rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ── Balance Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Balance */}
        <div className="md:col-span-1 bg-gradient-to-br from-accent-primary/20 to-purple-600/10 border border-accent-primary/30 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-medium text-text-secondary uppercase tracking-wide">Solde principal</p>
          {balanceLoading ? (
            <div className="h-10 w-32 bg-background-elevated animate-pulse rounded-lg" />
          ) : (
            <p className="text-4xl font-bold text-text-primary">
              {(balance?.balance ?? 0).toFixed(2)}
              <span className="text-xl ml-2 text-text-secondary">{balance?.currency ?? 'EUR'}</span>
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setDepositOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-primary text-white rounded-xl font-semibold hover:bg-accent-primary/90 transition-colors text-sm"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Déposer
            </button>
          </div>
        </div>

        {/* Bonus Balance */}
        <div className="bg-background-secondary border border-background-elevated rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wide">Solde bonus</p>
          </div>
          {balanceLoading ? (
            <div className="h-8 w-24 bg-background-elevated animate-pulse rounded-lg" />
          ) : (
            <p className="text-2xl font-bold text-purple-400">
              {(balance?.bonusBalance ?? 0).toFixed(2)}
              <span className="text-sm ml-1 text-text-secondary">{balance?.currency ?? 'EUR'}</span>
            </p>
          )}
          <p className="text-xs text-text-secondary">Non retirable avant complétion des mises</p>
          {(balance?.bonusBalance ?? 0) > 0 && (
            <a
              href="/bonuses"
              className="text-xs text-purple-400 hover:text-purple-300 hover:underline font-medium transition-colors"
            >
              Voir mes bonus →
            </a>
          )}
        </div>

        {/* Locked Balance */}
        <div className="bg-background-secondary border border-background-elevated rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wide">Solde bloqué</p>
          </div>
          {balanceLoading ? (
            <div className="h-8 w-24 bg-background-elevated animate-pulse rounded-lg" />
          ) : (
            <p className="text-2xl font-bold text-yellow-400">
              {(balance?.lockedBalance ?? 0).toFixed(2)}
              <span className="text-sm ml-1 text-text-secondary">{balance?.currency ?? 'EUR'}</span>
            </p>
          )}
          <p className="text-xs text-text-secondary">Mises en cours — libéré après règlement</p>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setDepositOpen(true)}
          className="flex items-center gap-3 p-5 bg-background-secondary border border-background-elevated hover:border-accent-primary/50 rounded-2xl transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-green-500/10 group-hover:bg-green-500/20 flex items-center justify-center transition-colors">
            <ArrowDownCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-text-primary">Déposer</p>
            <p className="text-xs text-text-secondary">BTC, ETH, USDT</p>
          </div>
        </button>
        <button
          onClick={() => setDepositOpen(true)}
          className="flex items-center gap-3 p-5 bg-background-secondary border border-background-elevated hover:border-red-500/30 rounded-2xl transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
            <ArrowUpCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-text-primary">Retirer</p>
            <p className="text-xs text-text-secondary">Vers votre wallet crypto</p>
          </div>
        </button>
      </div>

      {/* ── Transaction History ──────────────────────────────────────────── */}
      <div className="bg-background-secondary border border-background-elevated rounded-2xl overflow-hidden">
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-background-elevated">
          <h2 className="text-xl font-bold text-text-primary">Historique des transactions</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['all', 'deposit', 'withdrawal', 'bet', 'win', 'bonus'].map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(0) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  typeFilter === t
                    ? 'bg-accent-primary text-white'
                    : 'bg-background-elevated text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'all' ? 'Tout' : TYPE_LABEL[t] ?? t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {txLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-background-elevated animate-pulse rounded-lg" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-40" />
            <p className="text-text-secondary font-medium">Aucune transaction trouvée</p>
            <p className="text-sm text-text-secondary mt-1">
              {typeFilter !== 'all' ? 'Essayez un autre filtre' : 'Effectuez votre premier dépôt pour commencer'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-background-elevated">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-background-elevated/30 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['deposit', 'win', 'bonus', 'refund'].includes(tx.type)
                      ? 'bg-green-500/10'
                      : 'bg-red-500/10'
                  }`}>
                    {['deposit', 'win', 'bonus', 'refund'].includes(tx.type) ? (
                      <ArrowDownCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowUpCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  {/* Details */}
                  <div>
                    <p className="font-medium text-text-primary">
                      {TYPE_LABEL[tx.type] ?? tx.type}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {tx.description ?? tx.referenceType ?? tx.id.slice(0, 12)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-bold ${TYPE_COLOR[tx.type] ?? 'text-text-primary'}`}>
                    {TYPE_SIGN[tx.type] ?? ''}{Math.abs(tx.amount).toFixed(2)} {tx.currency}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {STATUS_ICON[tx.status] ?? <AlertCircle className="w-4 h-4 text-text-secondary" />}
                    <span className={`text-xs ${STATUS_COLOR[tx.status] ?? 'text-text-secondary'}`}>
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-background-elevated">
            <p className="text-sm text-text-secondary">
              Page {page + 1} sur {totalPages} ({totalTx} transactions)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg bg-background-elevated text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg bg-background-elevated text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Deposit Modal ────────────────────────────────────────────────── */}
      <CryptoPaymentModal
        isOpen={depositOpen}
        onClose={() => {
          setDepositOpen(false)
          // Refresh balance after modal closes
          fetchBalance()
          fetchTransactions()
        }}
      />
    </div>
  )
}
