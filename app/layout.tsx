import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/layout/MainLayout'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'BC.GAME - Casino & Sports Betting',
  description: 'BC.GAME - Your premier destination for casino games and sports betting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-background-primary text-text-primary">
        <MainLayout>{children}</MainLayout>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--background-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--background-secondary)',
            },
          }}
        />
      </body>
    </html>
  )
}




