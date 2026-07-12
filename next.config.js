/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    config.externals.push('porto', 'porto/internal', '@base-org/account', '@metamask/connect-evm', 'accounts', '@coinbase/wallet-sdk')
    return config
  },
}

module.exports = nextConfig




















