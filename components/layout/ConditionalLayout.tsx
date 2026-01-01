'use client'

import { usePathname } from 'next/navigation'
import MainLayout from './MainLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  // Don't wrap admin routes with MainLayout
  if (isAdminRoute) {
    return <>{children}</>
  }

  // Wrap regular routes with MainLayout
  return <MainLayout>{children}</MainLayout>
}






