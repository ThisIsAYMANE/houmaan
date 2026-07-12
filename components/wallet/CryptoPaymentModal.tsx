'use client'

import { useState, useEffect, useRef } from 'react'
import CopyAddress from './CopyAddress'
import ConnectWalletButton from './ConnectWalletButton'
import DepositStatus from './DepositStatus'

// ─── Types ───────────────────────────────────────────────────────────────────
type TabType = 'deposit' | 'withdraw'
type TokenType = 'eth' | 'usdt' | 'btc'
type USDTNetwork = 'ethereum' | 'bsc' | 'polygon'
type DepositMethod = 'copy' | 'qr' | 'wallet'

interface DepositResponse {
  depositId: string
  address: string
  amount: number
  currency: string
  ethAmount?: number
  usdtAmount?: number
  btcAmount?: number
  network: string
  qrCode: string | null
  expiresAt: string
  paymentURL: string
  instructions: string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TOKENS = [
  { id: 'btc' as TokenType, label: 'BTC', icon: '₿', color: '#F7931A', desc: 'Bitcoin' },
  { id: 'eth' as TokenType, label: 'ETH', icon: '⟠', color: '#627EEA', desc: 'Ethereum' },
  { id: 'usdt' as TokenType, label: 'USDT', icon: '₮', color: '#26A17B', desc: 'Tether' },
]

const USDT_NETWORKS = [
  { id: 'bsc' as USDTNetwork, label: 'BNB Smart Chain', short: 'BEP-20', icon: '🟡', confirmations: 15 },
  { id: 'ethereum' as USDTNetwork, label: 'Ethereum', short: 'ERC-20', icon: '🔵', confirmations: 12 },
  { id: 'polygon' as USDTNetwork, label: 'Polygon', short: 'MATIC', icon: '🟣', confirmations: 20 },
]

// Copy icon SVG
const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

// QR icon SVG
const QRIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
    <rect x="18" y="18" width="3" height="3" /><rect x="14" y="18" width="3" height="3" />
    <rect x="18" y="14" width="3" height="3" />
  </svg>
)

// Wallet icon SVG
const WalletIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
)

const DEPOSIT_METHODS = [
  { id: 'copy' as DepositMethod, label: 'Copy', Icon: CopyIcon },
  { id: 'qr' as DepositMethod, label: 'QR Code', Icon: QRIcon },
  { id: 'wallet' as DepositMethod, label: 'Wallet', Icon: WalletIcon },
]

// ─── Props ───────────────────────────────────────────────────────────────────
interface CryptoPaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Shared Styles ─────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#f1f5f9',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  display: 'block',
  marginBottom: '7px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
  border: 'none',
  borderRadius: '14px',
  color: 'white',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CryptoPaymentModal({ isOpen, onClose }: CryptoPaymentModalProps) {
  const [tab, setTab] = useState<TabType>('deposit')

  // Deposit state
  const [token, setToken] = useState<TokenType>('usdt')
  const [usdtNetwork, setUsdtNetwork] = useState<USDTNetwork>('bsc')
  const [amount, setAmount] = useState('50')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [method, setMethod] = useState<DepositMethod>('copy')
  const [deposit, setDeposit] = useState<DepositResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Withdraw state
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawToken, setWithdrawToken] = useState<TokenType>('usdt')
  const [withdrawNetwork, setWithdrawNetwork] = useState<USDTNetwork>('bsc')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [userBalance, setUserBalance] = useState<number | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)

  // Lock body scroll & handle outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutside)
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Fetch balance when switching to withdraw tab
  useEffect(() => {
    if (tab === 'withdraw') fetchBalance()
  }, [tab])

  const fetchBalance = async () => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const res = await fetch('/api/wallet/balance', {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setUserBalance(data.data?.balance ?? data.balance ?? null)
      }
    } catch { /* non-fatal */ }
  }

  const getAuthToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const handleGenerateDeposit = async () => {
    const num = parseFloat(amount)
    if (isNaN(num) || num < 5) { setAmountError('Minimum deposit is €5'); return }
    setAmountError(null)
    setIsLoading(true)
    setApiError(null)

    try {
      let endpoint = ''
      const body: Record<string, any> = { amount: num, currency: 'EUR' }

      if (token === 'btc') {
        endpoint = '/api/payments/deposit'
        body.network = 'mainnet'
      } else if (token === 'eth') {
        endpoint = '/api/payments/eth-deposit'
      } else {
        endpoint = '/api/payments/usdt-deposit'
        body.network = usdtNetwork
      }

      const authToken = getAuthToken()
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'Failed to create deposit')
      setDeposit(json.data ?? json)
    } catch (err: any) {
      setApiError(err.message ?? 'Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAddress || withdrawAddress.length < 10) {
      setWithdrawError('Please enter a valid wallet address')
      return
    }
    const num = parseFloat(withdrawAmount)
    if (isNaN(num) || num < 10) { setWithdrawError('Minimum withdrawal is €10'); return }

    setWithdrawError(null)
    setWithdrawLoading(true)
    try {
      const authToken = getAuthToken()
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          type: 'withdrawal',
          amount: num,
          currency: 'EUR',
          toAddress: withdrawAddress,
          network: withdrawToken === 'usdt' ? withdrawNetwork : withdrawToken === 'btc' ? 'mainnet' : 'ethereum',
          tokenType: withdrawToken,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'Withdrawal failed')
      setWithdrawSuccess(true)
    } catch (err: any) {
      setWithdrawError(err.message ?? 'Withdrawal failed. Please try again.')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handleReset = () => {
    setDeposit(null)
    setIsConfirmed(false)
    setApiError(null)
    setAmountError(null)
  }

  const cryptoAmount = deposit
    ? token === 'eth' ? deposit.ethAmount
      : token === 'btc' ? deposit.btcAmount
      : deposit.usdtAmount
    : null

  const cryptoLabel = token === 'eth' ? 'ETH' : token === 'btc' ? 'BTC' : 'USDT'
  const activeToken = TOKENS.find((t) => t.id === token)!

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px',
        animation: 'cpModalFadeIn 0.2s ease',
      }}>
        {/* Modal Panel */}
        <div
          ref={modalRef}
          style={{
            width: '100%', maxWidth: '480px',
            maxHeight: '92vh', overflowY: 'auto',
            background: 'linear-gradient(160deg, #1c1e30 0%, #14161f 100%)',
            border: '1px solid rgba(139,92,246,0.22)',
            borderRadius: '22px',
            boxShadow: '0 30px 90px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset',
            animation: 'cpModalSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            position: 'relative',
          }}
        >
          {/* ── Header Tabs ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 22px 0',
          }}>
            {/* Deposit / Withdraw toggle */}
            <div style={{
              display: 'flex', gap: '2px',
              background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '3px',
            }}>
              {(['deposit', 'withdraw'] as TabType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); if (t === 'deposit') handleReset() }}
                  style={{
                    padding: '7px 18px', borderRadius: '7px', border: 'none',
                    fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: tab === t ? 'rgba(139,92,246,0.25)' : 'transparent',
                    color: tab === t ? '#c084fc' : '#6b7280',
                  }}
                >
                  {t === 'deposit' ? '📥 Deposit' : '📤 Withdraw'}
                </button>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#6b7280', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = 'rgba(239,68,68,0.15)'
                el.style.color = '#f87171'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = 'rgba(255,255,255,0.04)'
                el.style.color = '#6b7280'
              }}
            >
              ✕
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0 0' }} />

          {/* ══════════════════════════════════════════
              DEPOSIT TAB
          ══════════════════════════════════════════ */}
          {tab === 'deposit' && (
            <div style={{ padding: '18px 22px 24px' }}>

              {/* Token selector */}
              <div style={{ marginBottom: '16px' }}>
                <p style={labelStyle}>Select Token</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {TOKENS.map((t) => (
                    <button
                      key={t.id}
                      id={`modal-token-${t.id}`}
                      onClick={() => { setToken(t.id); handleReset() }}
                      style={{
                        padding: '11px 8px', borderRadius: '12px',
                        border: `2px solid ${token === t.id ? t.color + '90' : 'rgba(255,255,255,0.07)'}`,
                        background: token === t.id ? t.color + '18' : 'rgba(0,0,0,0.25)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        boxShadow: token === t.id ? `0 0 16px ${t.color}25` : 'none',
                      }}
                    >
                      <span style={{ fontSize: '20px', color: t.color }}>{t.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: token === t.id ? '#f1f5f9' : '#9ca3af' }}>
                        {t.label}
                      </span>
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* USDT Network selector */}
              {token === 'usdt' && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={labelStyle}>Network</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {USDT_NETWORKS.map((n) => (
                      <button
                        key={n.id}
                        id={`modal-network-${n.id}`}
                        onClick={() => { setUsdtNetwork(n.id); handleReset() }}
                        style={{
                          flex: 1, padding: '9px 6px', borderRadius: '10px',
                          border: `1px solid ${usdtNetwork === n.id ? '#26A17B80' : 'rgba(255,255,255,0.07)'}`,
                          background: usdtNetwork === n.id ? 'rgba(38,161,123,0.14)' : 'rgba(0,0,0,0.25)',
                          cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{n.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: usdtNetwork === n.id ? '#26A17B' : '#6b7280' }}>
                          {n.short}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BTC network note */}
              {token === 'btc' && (
                <div style={{
                  marginBottom: '16px', padding: '10px 12px',
                  background: 'rgba(247,147,26,0.08)',
                  border: '1px solid rgba(247,147,26,0.2)',
                  borderRadius: '10px', fontSize: '12px', color: '#f59e0b',
                }}>
                  ₿ Bitcoin Mainnet — native BTC deposits only. Minimum 6 confirmations.
                </div>
              )}

              {/* Amount (only shown before deposit is generated) */}
              {!deposit && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={labelStyle}>Amount</p>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'rgba(0,0,0,0.35)',
                    border: `1px solid ${amountError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px', overflow: 'hidden',
                  }}>
                    <input
                      id="modal-deposit-amount"
                      type="number" min="5"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setAmountError(null) }}
                      placeholder="0.00"
                      style={{
                        flex: 1, padding: '14px 15px', background: 'none',
                        border: 'none', outline: 'none', color: '#f1f5f9',
                        fontSize: '20px', fontWeight: 700,
                      }}
                    />
                    <span style={{
                      padding: '0 15px', color: '#6b7280', fontSize: '13px',
                      fontWeight: 700, borderLeft: '1px solid rgba(255,255,255,0.07)',
                    }}>EUR</span>
                  </div>
                  {amountError && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{amountError}</p>}

                  {/* Presets */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[20, 50, 100, 200, 500].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(String(v))}
                        style={{
                          padding: '5px 12px', borderRadius: '999px',
                          border: `1px solid ${amount === String(v) ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                          background: amount === String(v) ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                          color: amount === String(v) ? '#c084fc' : '#9ca3af',
                          fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        €{v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Method selector (copy / QR / wallet) — only ETH and USDT support wallet connect */}
              <div style={{ marginBottom: '16px' }}>
                <p style={labelStyle}>Payment Method</p>
                <div style={{
                  display: 'flex', gap: '4px',
                  background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px',
                }}>
                  {DEPOSIT_METHODS.filter((m) => {
                    // BTC does not support Connect Wallet (wagmi only for EVM)
                    if (token === 'btc' && m.id === 'wallet') return false
                    return true
                  }).map((m) => (
                    <button
                      key={m.id}
                      id={`modal-method-${m.id}`}
                      onClick={() => setMethod(m.id)}
                      style={{
                        flex: 1, padding: '9px 6px',
                        border: 'none', borderRadius: '8px',
                        background: method === m.id ? 'rgba(139,92,246,0.22)' : 'transparent',
                        color: method === m.id ? '#c084fc' : '#6b7280',
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '4px',
                        fontSize: '10px', fontWeight: 600,
                        boxShadow: method === m.id ? '0 2px 8px rgba(139,92,246,0.2)' : 'none',
                      }}
                    >
                      <m.Icon />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Before generating: show Generate button ── */}
              {!deposit && (
                <>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px', textAlign: 'center', lineHeight: 1.5 }}>
                    {method === 'copy' && `Generate a ${cryptoLabel} address and copy it to your wallet`}
                    {method === 'qr' && `Scan the QR code with your mobile ${cryptoLabel} wallet`}
                    {method === 'wallet' && 'Connect MetaMask or WalletConnect and send in one click'}
                  </p>

                  <button
                    id="modal-generate-deposit-btn"
                    onClick={handleGenerateDeposit}
                    disabled={isLoading || !amount || parseFloat(amount) < 5}
                    style={{
                      ...primaryBtnStyle,
                      opacity: (!amount || parseFloat(amount) < 5) ? 0.5 : 1,
                      cursor: (!amount || parseFloat(amount) < 5) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span style={{ animation: 'cpSpin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                        Generating address…
                      </>
                    ) : (
                      <>🔐 Generate {token.toUpperCase()} Address</>
                    )}
                  </button>

                  {apiError && (
                    <div style={{
                      marginTop: '12px', padding: '12px 14px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '10px', color: '#f87171', fontSize: '13px',
                    }}>
                      ⚠️ {apiError}
                    </div>
                  )}
                </>
              )}

              {/* ── After generating: show payment details ── */}
              {deposit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Amount summary badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', padding: '12px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
                      €{deposit.amount} EUR
                    </span>
                    <span style={{ color: '#6b7280' }}>≈</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: activeToken.color }}>
                      {cryptoAmount} {cryptoLabel}
                    </span>
                  </div>

                  {/* Method tabs (re-selectable after generation) */}
                  <div style={{
                    display: 'flex', gap: '4px',
                    background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px',
                  }}>
                    {DEPOSIT_METHODS.filter((m) => !(token === 'btc' && m.id === 'wallet')).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        style={{
                          flex: 1, padding: '9px 6px', border: 'none', borderRadius: '8px',
                          background: method === m.id ? 'rgba(139,92,246,0.22)' : 'transparent',
                          color: method === m.id ? '#c084fc' : '#6b7280',
                          cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: '4px',
                          fontSize: '10px', fontWeight: 600,
                        }}
                      >
                        <m.Icon />
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* ── Copy/Paste method ── */}
                  {method === 'copy' && (
                    <CopyAddress
                      address={deposit.address}
                      network={deposit.network}
                      label={`Send exactly ${cryptoAmount} ${cryptoLabel} to:`}
                    />
                  )}

                  {/* ── QR Code method ── */}
                  {method === 'qr' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                      {deposit.qrCode ? (
                        <div style={{
                          padding: '16px', background: 'white',
                          borderRadius: '16px',
                          boxShadow: `0 0 40px ${activeToken.color}30`,
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={deposit.qrCode} alt="Payment QR Code" width={180} height={180} style={{ display: 'block' }} />
                        </div>
                      ) : (
                        <div style={{ padding: '30px', color: '#6b7280', textAlign: 'center', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                          QR code unavailable — use Copy Address instead.
                        </div>
                      )}
                      <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
                        Scan with your {cryptoLabel} wallet app<br />
                        Amount: <strong style={{ color: '#f1f5f9' }}>{cryptoAmount} {cryptoLabel}</strong>
                      </p>
                      <div style={{ width: '100%' }}>
                        <CopyAddress address={deposit.address} network={deposit.network} />
                      </div>
                    </div>
                  )}

                  {/* ── Connect Wallet (EVM only) ── */}
                  {method === 'wallet' && token !== 'btc' && (
                    <ConnectWalletButton
                      recipientAddress={deposit.address}
                      tokenType={token as 'eth' | 'usdt'}
                      amount={cryptoAmount ?? 0}
                      network={deposit.network}
                      onSuccess={(txHash) => console.log('[Modal] Payment sent:', txHash)}
                      onError={(err) => setApiError(err)}
                    />
                  )}

                  {/* Instructions */}
                  {deposit.instructions && deposit.instructions.length > 0 && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      borderLeft: `3px solid ${activeToken.color}`,
                      borderRadius: '0 8px 8px 0',
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: activeToken.color, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Important
                      </p>
                      <ol style={{ margin: 0, paddingLeft: '16px' }}>
                        {deposit.instructions.map((ins, i) => (
                          <li key={i} style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', lineHeight: 1.5 }}>
                            {ins}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Status tracker (only for ETH/USDT — BTC uses different polling) */}
                  {token !== 'btc' && (
                    <DepositStatus
                      depositId={deposit.depositId}
                      type={token as 'eth' | 'usdt'}
                      expectedAmount={cryptoAmount ?? 0}
                      currency={cryptoLabel}
                      expiresAt={deposit.expiresAt}
                      onConfirmed={() => setIsConfirmed(true)}
                      onExpired={() => {}}
                    />
                  )}

                  {/* BTC status note */}
                  {token === 'btc' && (
                    <div style={{
                      padding: '14px 16px',
                      background: 'rgba(247,147,26,0.08)',
                      border: '1px solid rgba(247,147,26,0.2)',
                      borderRadius: '12px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <span style={{ fontSize: '20px' }}>⏳</span>
                      <div>
                        <p style={{ fontWeight: 600, color: '#f59e0b', fontSize: '13px', margin: '0 0 2px' }}>
                          Waiting for Bitcoin payment…
                        </p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                          Your balance will be credited after 6 confirmations (~60 min)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* New deposit button */}
                  <button
                    id="modal-new-deposit-btn"
                    onClick={handleReset}
                    style={{
                      width: '100%', padding: '11px',
                      background: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px', color: '#6b7280',
                      fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'rgba(255,255,255,0.2)'
                      el.style.color = '#9ca3af'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'rgba(255,255,255,0.1)'
                      el.style.color = '#6b7280'
                    }}
                  >
                    ← New Deposit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              WITHDRAW TAB
          ══════════════════════════════════════════ */}
          {tab === 'withdraw' && (
            <div style={{ padding: '18px 22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Balance */}
              <div style={{
                padding: '14px 16px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Available Balance</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                  {userBalance !== null ? `€${userBalance.toFixed(2)}` : '—'}
                </span>
              </div>

              {withdrawSuccess ? (
                <div style={{
                  padding: '24px', background: 'rgba(0,255,0,0.07)',
                  border: '1px solid rgba(0,255,0,0.25)',
                  borderRadius: '14px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
                  <p style={{ color: '#00ff00', fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>
                    Withdrawal Submitted!
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px' }}>
                    Your request is being processed.<br />Funds will arrive within 1–24 hours.
                  </p>
                  <button
                    onClick={() => { setWithdrawSuccess(false); setWithdrawAddress(''); setWithdrawAmount('') }}
                    style={{
                      padding: '10px 24px',
                      background: 'rgba(0,255,0,0.1)',
                      border: '1px solid rgba(0,255,0,0.3)',
                      borderRadius: '10px', color: '#00ff00',
                      cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                    }}
                  >
                    + New Withdrawal
                  </button>
                </div>
              ) : (
                <>
                  {/* Token selector */}
                  <div>
                    <p style={labelStyle}>Token</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {TOKENS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setWithdrawToken(t.id)}
                          style={{
                            padding: '10px 8px', borderRadius: '10px',
                            border: `2px solid ${withdrawToken === t.id ? t.color + '90' : 'rgba(255,255,255,0.07)'}`,
                            background: withdrawToken === t.id ? t.color + '18' : 'rgba(0,0,0,0.25)',
                            cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <span style={{ fontSize: '18px', color: t.color }}>{t.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: withdrawToken === t.id ? '#f1f5f9' : '#6b7280' }}>
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* USDT network */}
                  {withdrawToken === 'usdt' && (
                    <div>
                      <p style={labelStyle}>Network</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {USDT_NETWORKS.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => setWithdrawNetwork(n.id)}
                            style={{
                              flex: 1, padding: '8px 6px', borderRadius: '10px',
                              border: `1px solid ${withdrawNetwork === n.id ? '#26A17B80' : 'rgba(255,255,255,0.07)'}`,
                              background: withdrawNetwork === n.id ? 'rgba(38,161,123,0.14)' : 'rgba(0,0,0,0.25)',
                              cursor: 'pointer', transition: 'all 0.2s',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>{n.icon}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: withdrawNetwork === n.id ? '#26A17B' : '#6b7280' }}>
                              {n.short}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destination address */}
                  <div>
                    <p style={labelStyle}>Destination Address</p>
                    <input
                      id="withdraw-address-input"
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => { setWithdrawAddress(e.target.value); setWithdrawError(null) }}
                      placeholder={withdrawToken === 'btc' ? 'bc1q...' : '0x...'}
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <p style={labelStyle}>Amount (EUR)</p>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', overflow: 'hidden',
                    }}>
                      <input
                        id="withdraw-amount-input"
                        type="number" min="10"
                        value={withdrawAmount}
                        onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError(null) }}
                        placeholder="0.00"
                        style={{
                          flex: 1, padding: '13px 14px', background: 'none',
                          border: 'none', outline: 'none', color: '#f1f5f9',
                          fontSize: '18px', fontWeight: 700,
                        }}
                      />
                      {userBalance !== null && (
                        <button
                          id="withdraw-max-btn"
                          onClick={() => setWithdrawAmount(String(Math.floor(userBalance)))}
                          style={{
                            padding: '0 14px',
                            background: 'rgba(139,92,246,0.1)',
                            border: 'none', borderLeft: '1px solid rgba(255,255,255,0.07)',
                            color: '#a78bfa', fontSize: '12px', fontWeight: 700,
                            cursor: 'pointer', minHeight: '48px', transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}
                        >
                          MAX
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px' }}>Min. withdrawal: €10</p>
                  </div>

                  {/* Warning */}
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(245,158,11,0.07)',
                    border: '1px solid rgba(245,158,11,0.18)',
                    borderRadius: '10px', fontSize: '12px', color: '#f59e0b', lineHeight: 1.5,
                  }}>
                    ⚠️ Double-check your address — withdrawals are <strong>irreversible</strong>.
                  </div>

                  {withdrawError && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '10px', color: '#f87171', fontSize: '13px',
                    }}>
                      ⚠️ {withdrawError}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    id="modal-withdraw-btn"
                    onClick={handleWithdraw}
                    disabled={withdrawLoading}
                    style={{
                      width: '100%', padding: '15px',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      border: 'none', borderRadius: '14px',
                      color: 'white', fontSize: '15px', fontWeight: 700,
                      cursor: withdrawLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      opacity: withdrawLoading ? 0.6 : 1,
                    }}
                  >
                    {withdrawLoading ? (
                      <>
                        <span style={{ animation: 'cpSpin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                        Processing…
                      </>
                    ) : (
                      <>💸 Confirm Withdrawal</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes cpModalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cpModalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes cpSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
