'use client'

/**
 * Client-side i18n system for Shartbandee
 * Uses a simple React Context + localStorage + browser detection approach
 * so we don't need to restructure Next.js routes for next-intl middleware.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '', dir: 'rtl' },
  { code: 'zh', name: '中文', flag: '', dir: 'ltr' },
  { code: 'ja', name: '日本語', flag: '', dir: 'ltr' },
  { code: 'ko', name: '한국어', flag: '', dir: 'ltr' },
  { code: 'ru', name: 'Русский', flag: '', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', flag: '', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', flag: '', dir: 'ltr' },
  { code: 'bn', name: 'বাংলা', flag: '', dir: 'ltr' },
  { code: 'vi', name: 'Tiếng Việt', flag: '', dir: 'ltr' },
  { code: 'th', name: 'ภาษาไทย', flag: '', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', flag: '', dir: 'ltr' },
  { code: 'pl', name: 'Polski', flag: '', dir: 'ltr' },
  { code: 'uk', name: 'Українська', flag: '', dir: 'ltr' },
  { code: 'fa', name: 'فارسی', flag: '', dir: 'rtl' },
]

type Translations = Record<string, Record<string, string>>

interface I18nContextType {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string, fallback?: string) => string
  dir: string
  currentLang: typeof SUPPORTED_LANGUAGES[0]
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => key,
  dir: 'ltr',
  currentLang: SUPPORTED_LANGUAGES[0],
})

/**
 * Detects the best locale from browser / localStorage
 */
function detectLocale(): string {
  if (typeof window === 'undefined') return 'fr'

  // 1. User preference persisted
  const saved = localStorage.getItem('houman_locale')
  if (saved && SUPPORTED_LANGUAGES.find(l => l.code === saved)) return saved

  // 2. Browser language
  const browserLang = navigator.language?.split('-')[0]?.toLowerCase()
  if (browserLang && SUPPORTED_LANGUAGES.find(l => l.code === browserLang)) return browserLang

  // 3. Default
  return 'fr'
}

/**
 * Flattens nested JSON: { nav: { home: "Home" } } → { "nav.home": "Home" }
 */
function flattenTranslations(obj: any, prefix = ''): Record<string, string> {
  return Object.entries(obj).reduce((acc: Record<string, string>, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      Object.assign(acc, flattenTranslations(value, fullKey))
    } else {
      acc[fullKey] = String(value)
    }
    return acc
  }, {})
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>('fr')
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [fallbackTranslations, setFallbackTranslations] = useState<Record<string, string>>({})

  // Load fallback (French) translations once
  useEffect(() => {
    fetch('/messages/fr.json')
      .then(r => r.json())
      .then(data => setFallbackTranslations(flattenTranslations(data)))
      .catch(() => {})
  }, [])

  // Detect locale on mount
  useEffect(() => {
    const detected = detectLocale()
    setLocaleState(detected)
  }, [])

  // Load translations when locale changes
  useEffect(() => {
    if (!locale) return
    fetch(`/messages/${locale}.json`)
      .then(r => r.json())
      .then(data => setTranslations(flattenTranslations(data)))
      .catch(() => {
        // If locale file fails, fall back to French
        setTranslations({})
      })
  }, [locale])

  // Apply RTL direction to document
  useEffect(() => {
    const langDef = SUPPORTED_LANGUAGES.find(l => l.code === locale)
    const dir = langDef?.dir ?? 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale)
    localStorage.setItem('houman_locale', newLocale)
  }, [])

  const t = useCallback((key: string, fallback?: string): string => {
    return translations[key] ?? fallbackTranslations[key] ?? fallback ?? key
  }, [translations, fallbackTranslations])

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === locale) ?? SUPPORTED_LANGUAGES[0]

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir: currentLang.dir, currentLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
