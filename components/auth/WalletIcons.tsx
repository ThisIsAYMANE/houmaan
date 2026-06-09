'use client'

import React from 'react'
import {
  BadgeDollarSign,
  Coins,
  Flame,
  Link,
  Sparkles,
  Wallet,
} from 'lucide-react'

interface WalletIconProps {
  name: string
  className?: string
}

const getSizeFromClassName = (className?: string): number => {
  if (!className) return 24
  const match = className.match(/w-(\d+)|h-(\d+)/)
  if (match) {
    const size = parseInt(match[1] || match[2] || '6', 10)
    return size * 4
  }
  return 24
}

function iconForWallet(name: string) {
  switch (name) {
    case 'MetaMask':
      return { Icon: Flame, color: '#f6851b', bg: 'bg-orange-500/15' }
    case 'WalletConnect':
      return { Icon: Link, color: '#3b99fc', bg: 'bg-blue-500/15' }
    case 'Coinbase':
      return { Icon: BadgeDollarSign, color: '#2f6df6', bg: 'bg-blue-600/15' }
    case 'TrustWallet':
      return { Icon: Wallet, color: '#3375bb', bg: 'bg-sky-500/15' }
    case 'Binance':
      return { Icon: Coins, color: '#f3ba2f', bg: 'bg-yellow-500/15' }
    case 'Phantom':
      return { Icon: Sparkles, color: '#ab9ff2', bg: 'bg-purple-500/15' }
    case 'Solflare':
      return { Icon: Sparkles, color: '#14f195', bg: 'bg-emerald-500/15' }
    default:
      return { Icon: Wallet, color: '#9ca3af', bg: 'bg-gray-500/15' }
  }
}

export function WalletIcon({ name, className = 'w-6 h-6' }: WalletIconProps) {
  const size = getSizeFromClassName(className)
  const { Icon, color } = iconForWallet(name)

  return <Icon size={size} className={className} style={{ color }} />
}

export function SimpleWalletIcon({ name, className = 'w-6 h-6' }: WalletIconProps) {
  const size = getSizeFromClassName(className)
  const { Icon, color, bg } = iconForWallet(name)

  return (
    <div className={`${className} ${bg} flex items-center justify-center rounded-full`}>
      <Icon size={Math.max(14, size * 0.68)} style={{ color }} />
    </div>
  )
}
