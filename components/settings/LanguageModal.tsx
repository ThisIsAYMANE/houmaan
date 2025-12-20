'use client'

import { useState } from 'react'
import { X, Search, Globe } from 'lucide-react'

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
]

const currencies = [
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
]

interface LanguageModalProps {
  isOpen: boolean
  onClose: () => void
  currentLanguage?: string
  currentCurrency?: string
  onLanguageChange?: (language: string) => void
  onCurrencyChange?: (currency: string) => void
}

export default function LanguageModal({
  isOpen,
  onClose,
  currentLanguage = 'fr',
  currentCurrency = 'MAD',
  onLanguageChange,
  onCurrencyChange,
}: LanguageModalProps) {
  const [activeTab, setActiveTab] = useState<'language' | 'currency'>('language')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCurrencies = currencies.filter((curr) =>
    curr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    curr.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background-secondary rounded-lg shadow-xl w-full max-w-md mx-4 border border-background-elevated">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-background-elevated">
          <h2 className="text-2xl font-bold text-text-primary">Langue & Devise</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-elevated rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-background-elevated">
          <button
            onClick={() => {
              setActiveTab('language')
              setSearchQuery('')
            }}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'language'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Globe className="w-4 h-4" />
            Langue
          </button>
          <button
            onClick={() => {
              setActiveTab('currency')
              setSearchQuery('')
            }}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'currency'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Devise
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-background-elevated">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'language'
                  ? 'Rechercher une langue...'
                  : 'Rechercher une devise...'
              }
              className="w-full pl-10 pr-4 py-2 bg-background-elevated border border-transparent rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'language' ? (
            <div className="space-y-2">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange?.(lang.code)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    currentLanguage === lang.code
                      ? 'bg-accent-primary text-background-primary'
                      : 'bg-background-elevated text-text-primary hover:bg-background-primary'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="flex-1 text-left font-medium">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <span className="text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCurrencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => {
                    onCurrencyChange?.(curr.code)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    currentCurrency === curr.code
                      ? 'bg-accent-primary text-background-primary'
                      : 'bg-background-elevated text-text-primary hover:bg-background-primary'
                  }`}
                >
                  <span className="text-xl font-bold">{curr.symbol}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{curr.name}</p>
                    <p className="text-sm opacity-75">{curr.code}</p>
                  </div>
                  {currentCurrency === curr.code && (
                    <span className="text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

