'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/admin/login'

  // Issue #8 (Admin): Auth guard — redirect to login if no token
  useEffect(() => {
    if (!isLoginPage) {
      const token = localStorage.getItem('admin_session_token')
      if (!token) {
        router.replace('/admin/login')
      }
    }
  }, [isLoginPage, router])

  // Issue #8 (Admin): Apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  if (isLoginPage) {
    return (
      <div data-admin="true" className="min-h-screen bg-gray-900 dark:bg-gray-950 text-white antialiased transition-colors">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #374151',
            },
          }}
        />
      </div>
    )
  }

  return (
    <div data-admin="true" className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white antialiased transition-colors">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  )
}
