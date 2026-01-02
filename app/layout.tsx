import './globals.css'
import type { Metadata } from 'next'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BC.GAME - Casino & Sports Betting',
  description: 'The ultimate online casino and sports betting platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-bg-primary text-text-primary antialiased`}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  )
}
