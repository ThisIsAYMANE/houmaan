'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Search } from 'lucide-react'
import { useI18n, SUPPORTED_LANGUAGES } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale, currentLang } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = SUPPORTED_LANGUAGES.filter(
    l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (code: string) => {
    setLocale(code)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background-elevated hover:bg-background-elevated/80 text-text-secondary hover:text-text-primary transition-all text-sm"
        title="Change language"
      >
        {/* Issue #10: Replace flag emoji with styled code badge */}
        <span className="w-6 h-6 rounded flex items-center justify-center bg-accent-primary/20 text-accent-primary text-xs font-bold uppercase">
          {currentLang.code.slice(0, 2)}
        </span>
        <span className="hidden sm:inline font-medium">{currentLang.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-background-secondary border border-background-elevated rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-background-elevated">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-background-elevated rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          {/* Language list */}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-sm ${
                  locale === lang.code
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-primary hover:bg-background-elevated'
                }`}
              >
                {/* Issue #10: Replace flag emoji with styled code badge */}
                <span className="w-7 h-7 rounded flex items-center justify-center bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase flex-shrink-0">
                  {lang.code.slice(0, 2)}
                </span>
                <span className="flex-1 font-medium">{lang.name}</span>
                {locale === lang.code && (
                  <span className="text-accent-primary text-xs">✓</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-text-secondary text-sm py-4">Aucun résultat</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
