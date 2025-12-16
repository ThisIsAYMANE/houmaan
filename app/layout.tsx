import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/layout/MainLayout'

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
      </body>
    </html>
  )
}




