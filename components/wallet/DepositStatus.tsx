'use client'

import { useEffect, useRef, useState } from 'react'

interface DepositStatusProps {
  depositId: string
  type: 'eth' | 'usdt'
  expectedAmount: number
  currency: string
  expiresAt: string
  onExpired?: () => void
  onConfirmed?: () => void
}

interface DepositData {
  status: 'pending' | 'confirming' | 'confirmed' | 'expired' | 'failed'
  confirmations: number
  requiredConfirmations: number
  txHash: string | null
  network: string | null
  ethAmount?: number
  usdtAmount?: number
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Waiting for payment…', color: '#f59e0b', icon: '⏳' },
  confirming: { label: 'Confirming on blockchain…', color: '#3b82f6', icon: '🔄' },
  confirmed: { label: 'Payment confirmed!', color: '#00ff00', icon: '✅' },
  expired: { label: 'Deposit expired', color: '#ef4444', icon: '❌' },
  failed: { label: 'Transaction failed', color: '#ef4444', icon: '❌' },
}

const EXPLORER_URLS: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  bsc: 'https://bscscan.com/tx/',
  polygon: 'https://polygonscan.com/tx/',
}

function useCountdown(expiresAt: string) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
      setTimeLeft(Math.floor(diff / 1000))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const s = (timeLeft % 60).toString().padStart(2, '0')
  return { timeLeft, display: `${m}:${s}` }
}

export default function DepositStatus({
  depositId,
  type,
  expiresAt,
  onExpired,
  onConfirmed,
}: DepositStatusProps) {
  const [data, setData] = useState<DepositData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const { timeLeft, display: countdown } = useCountdown(expiresAt)

  const fetchStatus = async () => {
    try {
      const endpoint = type === 'eth'
        ? `/api/payments/eth-deposit?depositId=${depositId}`
        : `/api/payments/usdt-deposit?depositId=${depositId}`

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const json = await res.json()
      const d = json.data || json

      setData({
        status: d.status,
        confirmations: d.confirmations ?? 0,
        requiredConfirmations: d.requiredConfirmations ?? 12,
        txHash: d.txHash ?? null,
        network: d.network ?? null,
        ethAmount: d.ethAmount,
        usdtAmount: d.usdtAmount,
      })

      if (d.status === 'confirmed') {
        onConfirmed?.()
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
      if (d.status === 'expired' || d.status === 'failed') {
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
    } catch (err) {
      setError('Failed to fetch status')
    }
  }

  useEffect(() => {
    fetchStatus()
    pollingRef.current = setInterval(fetchStatus, 5000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [depositId])

  // Stop polling on expire
  useEffect(() => {
    if (timeLeft === 0) {
      onExpired?.()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [timeLeft])

  if (error) {
    return <div className="status-error">⚠️ {error}</div>
  }

  const status = data?.status ?? 'pending'
  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.pending
  const progress = data
    ? Math.min(100, (data.confirmations / data.requiredConfirmations) * 100)
    : 0
  const explorerUrl = data?.network ? EXPLORER_URLS[data.network] : null

  return (
    <div className="deposit-status">
      {/* Status header */}
      <div className="status-header">
        <span className="status-icon">{statusInfo.icon}</span>
        <span className="status-label" style={{ color: statusInfo.color }}>
          {statusInfo.label}
        </span>
      </div>

      {/* Countdown */}
      {status === 'pending' && timeLeft > 0 && (
        <div className="status-countdown">
          <span className="countdown-label">Expires in</span>
          <span className={`countdown-value ${timeLeft < 120 ? 'countdown-urgent' : ''}`}>
            {countdown}
          </span>
        </div>
      )}

      {/* Confirmation progress (when confirming) */}
      {(status === 'confirming' || status === 'confirmed') && data && (
        <div className="status-confirmations">
          <div className="confirmations-header">
            <span>Confirmations</span>
            <span className="confirmations-count">
              {data.confirmations} / {data.requiredConfirmations}
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* TX Hash link */}
      {data?.txHash && explorerUrl && (
        <div className="status-txhash">
          <span className="txhash-label">Transaction</span>
          <a
            href={`${explorerUrl}${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="txhash-link"
            id="tx-explorer-link"
          >
            {data.txHash.slice(0, 10)}…{data.txHash.slice(-8)}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}

      {/* Success animation */}
      {status === 'confirmed' && (
        <div className="status-success-banner">
          🎉 Your balance has been credited!
        </div>
      )}

      <style jsx>{`
        .deposit-status {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
        }
        .status-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 600;
        }
        .status-icon { font-size: 20px; }
        .status-error {
          color: #f87171;
          font-size: 13px;
          padding: 10px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
        }
        .status-countdown {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary, #d1d5db);
        }
        .countdown-value {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: 700;
          color: #f59e0b;
          letter-spacing: 2px;
        }
        .countdown-urgent { color: #ef4444; animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .status-confirmations { display: flex; flex-direction: column; gap: 8px; }
        .confirmations-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary, #d1d5db);
        }
        .confirmations-count { font-weight: 700; color: #3b82f6; }
        .progress-bar-track {
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #00ff00);
          border-radius: 999px;
          transition: width 0.5s ease;
        }
        .status-txhash {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
        }
        .txhash-label { color: var(--text-secondary, #d1d5db); }
        .txhash-link {
          display: inline-flex;
          align-items: center;
          color: #3b82f6;
          text-decoration: none;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
        .txhash-link:hover { color: #60a5fa; text-decoration: underline; }
        .status-success-banner {
          padding: 12px 16px;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 10px;
          color: #00ff00;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
