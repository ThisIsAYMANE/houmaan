'use client'

import { Suspense } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import SignupForm from '@/components/auth/SignupForm'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  const handleSuccess = () => {
    router.push(returnUrl)
  }

  const handleSwitchToLogin = () => {
    // Preserve returnUrl when switching to login
    const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'
    router.push(loginUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background-secondary rounded-lg shadow-xl border border-background-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Inscription</h1>
            <Link
              href="/"
              className="p-2 hover:bg-background-elevated rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </Link>
          </div>

          <SignupForm
            onSuccess={handleSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
          <p className="text-text-secondary mt-4">Chargement...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}














