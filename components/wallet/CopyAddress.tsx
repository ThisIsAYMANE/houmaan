'use client'

import { useState } from 'react'

interface CopyAddressProps {
  address: string
  network: string
  label?: string
}

const NETWORK_BADGES: Record<string, { label: string; color: string }> = {
  ethereum: { label: 'ERC-20 / ETH', color: '#627EEA' },
  bsc: { label: 'BEP-20', color: '#F3BA2F' },
  polygon: { label: 'Polygon', color: '#8247E5' },
  eth: { label: 'Ethereum', color: '#627EEA' },
}

export default function CopyAddress({ address, network, label }: CopyAddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = address
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const badge = NETWORK_BADGES[network?.toLowerCase()] ?? { label: network, color: '#9333ea' }

  return (
    <div className="copy-address-container">
      {label && <p className="copy-address-label">{label}</p>}

      {/* Network badge */}
      <div className="copy-address-badge-row">
        <span
          className="copy-address-badge"
          style={{ backgroundColor: badge.color + '22', color: badge.color, borderColor: badge.color + '44' }}
        >
          <span className="badge-dot" style={{ backgroundColor: badge.color }} />
          {badge.label}
        </span>
      </div>

      {/* Address display */}
      <div className="copy-address-box">
        <span className="copy-address-text">{address}</span>
        <button
          onClick={handleCopy}
          className={`copy-btn ${copied ? 'copy-btn--copied' : ''}`}
          title="Copy address"
          id="copy-address-btn"
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Warning */}
      <p className="copy-address-warning">
        ⚠️ Only send on the <strong>{badge.label}</strong> network. Wrong network = permanent loss.
      </p>

      <style jsx>{`
        .copy-address-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .copy-address-label {
          font-size: 13px;
          color: var(--text-secondary, #d1d5db);
          margin: 0;
        }
        .copy-address-badge-row {
          display: flex;
          align-items: center;
        }
        .copy-address-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }
        .copy-address-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px;
        }
        .copy-address-text {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #e2e8f0;
          word-break: break-all;
          flex: 1;
          line-height: 1.6;
        }
        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(0, 255, 0, 0.3);
          background: rgba(0, 255, 0, 0.08);
          color: #00ff00;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .copy-btn:hover {
          background: rgba(0, 255, 0, 0.18);
          border-color: rgba(0, 255, 0, 0.6);
        }
        .copy-btn--copied {
          background: rgba(0, 255, 0, 0.2);
          border-color: #00ff00;
          color: #00ff00;
        }
        .copy-address-warning {
          font-size: 12px;
          color: #f59e0b;
          margin: 0;
          padding: 8px 12px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}
