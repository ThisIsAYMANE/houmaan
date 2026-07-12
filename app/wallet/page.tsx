'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WalletPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page where they can use the Deposit button in the header
    router.replace('/')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-text-secondary">Opening wallet...</p>
      </div>
    </div>
  )
}
