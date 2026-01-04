'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import SignupForm from '@/components/auth/SignupForm'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(true)

  const handleSuccess = () => {
    router.push('/')
  }

  const handleSwitchToLogin = () => {
    router.push('/login')
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













