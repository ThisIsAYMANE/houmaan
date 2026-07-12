/**
 * Wagmi v2 configuration
 * Supports MetaMask (injected) + WalletConnect v3
 * Chains: Ethereum Mainnet, BNB Smart Chain, Polygon
 */

import { createConfig, http } from 'wagmi'
import { mainnet, bsc, polygon } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'

export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
  ssr: true,
})

// Map our internal network names to wagmi chain IDs
export const networkToChainId: Record<string, number> = {
  ethereum: mainnet.id,   // 1
  bsc: bsc.id,            // 56
  polygon: polygon.id,    // 137
}

// USDT contract addresses per network
export const USDT_CONTRACTS: Record<string, `0x${string}`> = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  bsc: '0x55d398326f99059fF775485246999027B3197955',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
}
