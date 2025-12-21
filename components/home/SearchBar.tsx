'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  minLength?: number
}

export default function SearchBar({
  onSearch,
  placeholder = 'Rechercher un jeu...',
  minLength = 3
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length > 0 && query.length < minLength) {
      setError(`Minimum ${minLength} caractères requis`)
    } else {
      setError('')
    }
  }, [query, minLength])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (query.length < minLength) {
      setError(`Minimum ${minLength} caractères requis`)
      return
    }

    if (onSearch) {
      onSearch(query)
    } else {
      router.push(`/games?search=${encodeURIComponent(query)}`)
    }
  }

  const handleClear = () => {
    setQuery('')
    setError('')
    inputRef.current?.focus()
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center bg-bg-secondary border-2 rounded-lg transition-colors ${
            isActive
              ? 'border-accent-primary'
              : error
              ? 'border-red-500'
              : 'border-border-primary'
          }`}
        >
          <Search className="absolute left-4 w-5 h-5 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 bg-transparent text-text-primary placeholder-text-secondary focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 p-1 hover:bg-bg-tertiary rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}

        {query.length >= minLength && !error && (
          <p className="mt-2 text-sm text-text-secondary">
            Appuyez sur Entrée pour rechercher
          </p>
        )}
      </form>
    </div>
  )
}



