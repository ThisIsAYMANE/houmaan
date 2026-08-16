'use client'

import { usePathname } from 'next/navigation'
import MainLayout from './MainLayout'
import PopupBanner from './PopupBanner'
import Web3Provider from '@/components/providers/Web3Provider'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  // Don't wrap admin routes with MainLayout
  if (isAdminRoute) {
    return <Web3Provider>{children}</Web3Provider>
  }

  // Wrap regular routes with MainLayout + Web3Provider + PopupBanner
  return (
    <Web3Provider>
      <MainLayout>{children}</MainLayout>
      <PopupBanner />
    </Web3Provider>
  )
}
