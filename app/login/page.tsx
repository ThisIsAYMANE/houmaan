'use client'

import { Suspense } from 'react'
import LoginModal from '@/components/auth/LoginModal'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  const handleClose = () => {
    router.push(returnUrl)
  }

  const handleSwitchToSignup = () => {
    // Preserve returnUrl when switching to signup
    const signupUrl = returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'
    router.push(signupUrl)
  }

  const handleLoginSuccess = () => {
    // Redirect to returnUrl after successful login
    router.push(returnUrl)
  }

  return (
    <LoginModal
      isOpen={true}
      onClose={handleClose}
      onSwitchToSignup={handleSwitchToSignup}
      onLoginSuccess={handleLoginSuccess}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
          <p className="text-text-secondary mt-4">Chargement...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}














