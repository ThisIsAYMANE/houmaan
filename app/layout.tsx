import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/layout/MainLayout'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'boz.Topol - Casino & Sports Betting',
  description: 'boz.Topol - Your premier destination for casino games and sports betting',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} overflow-x-hidden`}>
      <body className="min-h-screen bg-background-primary text-text-primary overflow-x-hidden">
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




