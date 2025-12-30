'use client'

import React from 'react'
import { 
  WalletMetamask,
  WalletCoinbase,
  WalletPhantom,
} from '@web3icons/react'
import { 
  SiWalletconnect,
  SiBinance,
} from 'react-icons/si'
import { 
  Wallet,
} from 'lucide-react'

interface WalletIconProps {
  name: string
  className?: string
}

// Helper to extract size from className (e.g., "w-6 h-6" -> 24)
const getSizeFromClassName = (className?: string): number => {
  if (!className) return 24
  const match = className.match(/w-(\d+)|h-(\d+)/)
  if (match) {
    const size = parseInt(match[1] || match[2] || '24')
    return size * 4 // Tailwind: w-6 = 24px
  }
  return 24
}

// Professional wallet icons using @web3icons/react
export function WalletIcon({ name, className = 'w-6 h-6' }: WalletIconProps) {
  const size = getSizeFromClassName(className)
  
  const iconMap: Record<string, React.ReactNode> = {
    MetaMask: <WalletMetamask size={size} className={className} />,
    WalletConnect: <SiWalletconnect size={size} className={className} style={{ color: '#3B99FC' }} />,
    Coinbase: <WalletCoinbase size={size} className={className} />,
    TrustWallet: <Wallet size={size} className={className} style={{ color: '#3375BB' }} />,
    Binance: <SiBinance size={size} className={className} style={{ color: '#F3BA2F' }} />,
    Phantom: <WalletPhantom size={size} className={className} />,
    Solflare: <Wallet className={className} style={{ color: '#14F195' }} />,
  }

  return iconMap[name] || (
    <Wallet className={className} />
  )
}

// Enhanced wallet icons with better styling
export function SimpleWalletIcon({ name, className = 'w-6 h-6' }: WalletIconProps) {
  const size = getSizeFromClassName(className)
  
  const iconMap: Record<string, React.ReactNode> = {
    MetaMask: (
      <div className={`${className} flex items-center justify-center`}>
        <WalletMetamask size={size} />
      </div>
    ),
    WalletConnect: (
      <div className={`${className} flex items-center justify-center`}>
        <SiWalletconnect size={size} style={{ color: '#3B99FC' }} />
      </div>
    ),
    Coinbase: (
      <div className={`${className} flex items-center justify-center`}>
        <WalletCoinbase size={size} />
      </div>
    ),
    TrustWallet: (
      <div className={`${className} flex items-center justify-center rounded-full bg-blue-600`}>
        <Wallet size={size * 0.7} className="text-white" />
      </div>
    ),
    Binance: (
      <div className={`${className} flex items-center justify-center`}>
        <SiBinance size={size} style={{ color: '#F3BA2F' }} />
      </div>
    ),
    Phantom: (
      <div className={`${className} flex items-center justify-center`}>
        <WalletPhantom size={size} />
      </div>
    ),
    Solflare: (
      <div className={`${className} flex items-center justify-center rounded-full bg-green-500`}>
        <Wallet className="w-4 h-4 text-white" />
      </div>
    ),
  }

  return iconMap[name] || (
    <div className={`${className} flex items-center justify-center rounded-full bg-gray-600`}>
      <Wallet className="w-4 h-4 text-white" />
    </div>
  )
}
