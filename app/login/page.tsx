'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import LoginModal from '@/components/auth/LoginModal'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleClose = () => {
    router.push('/')
  }

  const handleSwitchToSignup = () => {
    router.push('/register')
  }

  return (
    <LoginModal
      isOpen={true}
      onClose={handleClose}
      onSwitchToSignup={handleSwitchToSignup}
    />
  )
}



