'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSendTransaction, useWriteContract, useChainId, useSwitchChain, type Connector } from 'wagmi'
import { parseEther, parseUnits } from 'viem'
import type { BaseError } from 'viem'
import { mainnet, bsc, polygon } from 'wagmi/chains'

// Minimal ERC-20 ABI for transfer
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const USDT_CONTRACTS: Record<string, `0x${string}`> = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  bsc: '0x55d398326f99059fF775485246999027B3197955',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
}

const CHAIN_IDS: Record<string, number> = {
  ethereum: mainnet.id,
  bsc: bsc.id,
  polygon: polygon.id,
}

interface ConnectWalletButtonProps {
  recipientAddress: `0x${string}` | string
  /** 'eth' for native ETH, 'usdt' for ERC-20 USDT */
  tokenType: 'eth' | 'usdt'
  /** Human-readable amount e.g. 0.05 */
  amount: number
  /** Network name: 'ethereum' | 'bsc' | 'polygon' */
  network: string
  onSuccess?: (txHash: string) => void
  onError?: (error: string) => void
}

export default function ConnectWalletButton({
  recipientAddress,
  tokenType,
  amount,
  network,
  onSuccess,
  onError,
}: ConnectWalletButtonProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const { sendTransaction, isPending: isSendingETH } = useSendTransaction()
  const { writeContract, isPending: isSendingUSDT } = useWriteContract()

  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showConnectors, setShowConnectors] = useState(false)

  const targetChainId = CHAIN_IDS[network] ?? mainnet.id
  const isWrongNetwork = isConnected && chainId !== targetChainId

  const handleSend = async () => {
    if (!isConnected) return
    setTxStatus('pending')
    setErrorMsg(null)

    try {
      if (tokenType === 'eth') {
        sendTransaction(
          {
            to: recipientAddress as `0x${string}`,
            value: parseEther(amount.toString()),
          },
          {
            onSuccess: (hash: string) => {
              setTxHash(hash)
              setTxStatus('success')
              onSuccess?.(hash)
            },
            onError: (err: BaseError) => {
              setErrorMsg(err.message)
              setTxStatus('error')
              onError?.(err.message)
            },
          }
        )
      } else {
        const contractAddress = USDT_CONTRACTS[network]
        if (!contractAddress) throw new Error(`Unsupported USDT network: ${network}`)

        writeContract(
          {
            address: contractAddress,
            abi: ERC20_TRANSFER_ABI,
            functionName: 'transfer',
            args: [
              recipientAddress as `0x${string}`,
              parseUnits(amount.toString(), 6), // USDT has 6 decimals
            ],
            chainId: targetChainId,
          },
          {
            onSuccess: (hash: string) => {
              setTxHash(hash)
              setTxStatus('success')
              onSuccess?.(hash)
            },
            onError: (err: BaseError) => {
              setErrorMsg(err.message)
              setTxStatus('error')
              onError?.(err.message)
            },
          }
        )
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Transaction failed')
      setTxStatus('error')
    }
  }

  const isSending = isSendingETH || isSendingUSDT

  if (!isConnected) {
    return (
      <div className="connect-section">
        <p className="connect-description">
          Connect your wallet to send {tokenType === 'eth' ? 'ETH' : 'USDT'} directly — no copy-paste needed.
        </p>

        <div className="connector-list">
          {connectors.map((connector: Connector) => (
            <button
              key={connector.id}
              id={`connect-${connector.id}`}
              className="connector-btn"
              onClick={() => connect({ connector })}
              disabled={isConnecting}
            >
              {/* MetaMask icon */}
              {connector.name.toLowerCase().includes('metamask') && (
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                  <path d="M35.6 3L21.7 13.1l2.6-6.1L35.6 3z" fill="#E17726" stroke="#E17726" strokeWidth="0.2" />
                  <path d="M4.4 3l13.8 10.2-2.5-6.1L4.4 3z" fill="#E27625" stroke="#E27625" strokeWidth="0.2" />
                  <path d="M30.5 27.3l-3.7 5.7 7.9 2.2 2.3-7.7-6.5-.2z" fill="#E27625" stroke="#E27625" strokeWidth="0.2" />
                  <path d="M3 27.5l2.2 7.7 7.9-2.2-3.7-5.7-6.4.2z" fill="#E27625" stroke="#E27625" strokeWidth="0.2" />
                  <path d="M12.7 18.3l-2.2 3.3 7.8.4-.3-8.4-5.3 4.7z" fill="#E27625" stroke="#E27625" strokeWidth="0.2" />
                  <path d="M27.3 18.3l-5.4-4.8-.3 8.5 7.8-.4-2.1-3.3z" fill="#E27625" stroke="#E27625" strokeWidth="0.2" />
                  <path d="M13.1 33l4.7-2.3-4.1-3.2-.6 5.5z" fill="#E27625" stroke="#E27625" strokeWidth="0.2" />
                  <path d="M22.2 30.7l4.7 2.3-.6-5.5-4.1 3.2z" fill="#E27625" stroke="#E27625" strokeWidth="0.2" />
                </svg>
              )}
              {/* WalletConnect icon */}
              {connector.name.toLowerCase().includes('walletconnect') && (
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="50" fill="#3B99FC" />
                  <path d="M29.5 38.3c11.3-11.1 29.7-11.1 41 0l1.4 1.3a1.4 1.4 0 0 1 0 2l-4.7 4.6a.7.7 0 0 1-1 0l-1.9-1.9c-7.9-7.7-20.6-7.7-28.4 0l-2 2a.7.7 0 0 1-1 0l-4.7-4.6a1.4 1.4 0 0 1 0-2l1.3-1.4zm50.7 9.4 4.2 4.1a1.4 1.4 0 0 1 0 2l-18.9 18.5a1.4 1.4 0 0 1-2 0L50 58.7a.4.4 0 0 0-.5 0L36 72.3a1.4 1.4 0 0 1-2 0L15 53.8a1.4 1.4 0 0 1 0-2l4.2-4.1a1.4 1.4 0 0 1 2 0L34.7 61a.4.4 0 0 0 .5 0l13.5-13.2a1.4 1.4 0 0 1 2 0L64.2 61a.4.4 0 0 0 .5 0l13.5-13.3a1.4 1.4 0 0 1 2 0z" fill="white" />
                </svg>
              )}
              {!connector.name.toLowerCase().includes('metamask') && !connector.name.toLowerCase().includes('walletconnect') && (
                <span className="connector-generic-icon">🔗</span>
              )}
              <span>{connector.name}</span>
              {isConnecting && <span className="connector-loading">…</span>}
            </button>
          ))}
        </div>

        <style jsx>{`
          .connect-section { display: flex; flex-direction: column; gap: 16px; }
          .connect-description { font-size: 14px; color: var(--text-secondary, #d1d5db); margin: 0; }
          .connector-list { display: flex; flex-direction: column; gap: 10px; }
          .connector-btn {
            display: flex; align-items: center; gap: 12px;
            padding: 14px 18px;
            background: rgba(147, 51, 234, 0.08);
            border: 1px solid rgba(147, 51, 234, 0.3);
            border-radius: 12px;
            color: #c084fc;
            font-size: 15px; font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .connector-btn:hover {
            background: rgba(147, 51, 234, 0.18);
            border-color: rgba(147, 51, 234, 0.6);
            color: #e879f9;
          }
          .connector-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .connector-loading { margin-left: auto; animation: spin 1s linear infinite; display: inline-block; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .connector-generic-icon { font-size: 18px; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="wallet-connected">
      {/* Connected address */}
      <div className="wallet-address-row">
        <div className="wallet-dot" />
        <span className="wallet-address-text">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <button className="disconnect-btn" onClick={() => disconnect()} id="disconnect-wallet-btn">
          Disconnect
        </button>
      </div>

      {/* Wrong network warning */}
      {isWrongNetwork && (
        <div className="wrong-network">
          <span>⚠️ Wrong network. Switch to <strong>{network}</strong>.</span>
          <button
            className="switch-network-btn"
            onClick={() => switchChain({ chainId: targetChainId })}
            disabled={isSwitching}
            id="switch-network-btn"
          >
            {isSwitching ? 'Switching…' : 'Switch Network'}
          </button>
        </div>
      )}

      {/* Payment summary */}
      <div className="payment-summary">
        <div className="summary-row">
          <span>Sending</span>
          <strong>{amount} {tokenType === 'eth' ? 'ETH' : 'USDT'}</strong>
        </div>
        <div className="summary-row">
          <span>To</span>
          <span className="summary-address">
            {recipientAddress?.toString().slice(0, 8)}…{recipientAddress?.toString().slice(-6)}
          </span>
        </div>
        <div className="summary-row">
          <span>Network</span>
          <strong style={{ textTransform: 'capitalize' }}>{network}</strong>
        </div>
      </div>

      {/* Send button */}
      {txStatus !== 'success' && (
        <button
          className={`send-btn ${isSending || isSwitching || isWrongNetwork ? 'send-btn--disabled' : ''}`}
          onClick={handleSend}
          disabled={isSending || isSwitching || isWrongNetwork}
          id="send-crypto-btn"
        >
          {isSending ? (
            <>
              <span className="send-spinner">⟳</span>
              Sending…
            </>
          ) : (
            <>
              🚀 Send {amount} {tokenType === 'eth' ? 'ETH' : 'USDT'}
            </>
          )}
        </button>
      )}

      {/* Error */}
      {txStatus === 'error' && errorMsg && (
        <div className="tx-error">
          ❌ {errorMsg.slice(0, 120)}
        </div>
      )}

      {/* Success */}
      {txStatus === 'success' && txHash && (
        <div className="tx-success">
          ✅ Transaction sent! Hash: <code>{txHash.slice(0, 10)}…{txHash.slice(-8)}</code>
          <br />
          <span style={{ fontSize: 12, opacity: 0.8 }}>Waiting for blockchain confirmations…</span>
        </div>
      )}

      <style jsx>{`
        .wallet-connected { display: flex; flex-direction: column; gap: 14px; }
        .wallet-address-row {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: rgba(0, 255, 0, 0.06);
          border: 1px solid rgba(0, 255, 0, 0.2);
          border-radius: 10px;
        }
        .wallet-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #00ff00;
          box-shadow: 0 0 6px #00ff00;
        }
        .wallet-address-text { font-family: monospace; font-size: 14px; color: #e2e8f0; flex: 1; }
        .disconnect-btn {
          background: none; border: none;
          color: #9ca3af; font-size: 12px; cursor: pointer;
          text-decoration: underline;
        }
        .disconnect-btn:hover { color: #ef4444; }
        .wrong-network {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 10px;
          font-size: 13px; color: #f59e0b;
        }
        .switch-network-btn {
          padding: 6px 12px;
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid #f59e0b;
          border-radius: 6px;
          color: #f59e0b; font-size: 12px; font-weight: 600;
          cursor: pointer;
        }
        .payment-summary {
          display: flex; flex-direction: column; gap: 8px;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }
        .summary-row {
          display: flex; justify-content: space-between;
          font-size: 14px; color: var(--text-secondary, #d1d5db);
        }
        .summary-row strong { color: #f1f5f9; }
        .summary-address { font-family: monospace; font-size: 12px; color: #94a3b8; }
        .send-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border: none; border-radius: 12px;
          color: white; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(147, 51, 234, 0.3);
        }
        .send-btn:hover:not(.send-btn--disabled) {
          background: linear-gradient(135deg, #a855f7, #8b5cf6);
          box-shadow: 0 6px 24px rgba(147, 51, 234, 0.5);
          transform: translateY(-1px);
        }
        .send-btn--disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .send-spinner { display: inline-block; animation: spin 1s linear infinite; margin-right: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tx-error {
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #f87171; font-size: 13px;
        }
        .tx-success {
          padding: 12px 14px;
          background: rgba(0, 255, 0, 0.08);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 10px;
          color: #00ff00; font-size: 13px; line-height: 1.6;
        }
        code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
      `}</style>
    </div>
  )
}
