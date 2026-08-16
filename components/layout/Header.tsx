'use client'

import { useState, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
import Link from 'next/link'
import BCJetonCard from './BCJetonCard'
import ProfileDropdown from './ProfileDropdown'
import CryptoPaymentModal from '@/components/wallet/CryptoPaymentModal'
import LanguageSwitcher from './LanguageSwitcher'

import { useI18n } from '@/lib/i18n'

interface HeaderProps {
  onMenuClick: () => void
}

// Issue #2: Only EUR and USD
const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
]

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useI18n()
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // Issue #C: Wire currency select to localStorage
  const [currency, setCurrency] = useState('EUR')

  // Load persisted currency on mount
  useEffect(() => {
    const saved = localStorage.getItem('houman_currency')
    if (saved && CURRENCIES.find(c => c.code === saved)) {
      setCurrency(saved)
    }
  }, [])

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value
    setCurrency(newCurrency)
    localStorage.setItem('houman_currency', newCurrency)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/games?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background-secondary border-b border-background-elevated">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={onMenuClick}
                className="p-2 hover:bg-background-elevated rounded-md transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6 text-text-primary" />
              </button>

              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-accent-primary">
                  Shartbandee
                </span>
              </Link>
            </div>

            {/* Center Section */}
            <div className="hidden md:flex items-center gap-4 flex-1 max-w-2xl mx-8">
              <BCJetonCard />

              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search', 'Search games...')}
                  className="w-full pl-10 pr-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
                />
              </form>

              {/* Issue #2 + #C: Only EUR/USD, wired to localStorage */}
              <select
                value={currency}
                onChange={handleCurrencyChange}
                className="px-3 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary focus:outline-none focus:border-accent-primary"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>

              <button
                id="header-deposit-btn"
                onClick={() => setDepositModalOpen(true)}
                className="px-4 py-2 bg-accent-primary text-background-primary rounded-md font-medium hover:bg-accent-primary/90 transition-colors"
              >
                {t('nav.deposit', 'Deposit')}
              </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ProfileDropdown onOpenDeposit={() => setDepositModalOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Deposit Button (shown below header on small screens) */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <button
          id="mobile-deposit-btn"
          onClick={() => setDepositModalOpen(true)}
          className="px-6 py-3 bg-accent-primary text-background-primary rounded-full font-bold shadow-lg hover:bg-accent-primary/90 transition-colors"
          style={{ boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}
        >
          + {t('nav.deposit', 'Deposit')}
        </button>
      </div>

      {/* Crypto Payment Modal */}
      <CryptoPaymentModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />
    </>
  )
}
