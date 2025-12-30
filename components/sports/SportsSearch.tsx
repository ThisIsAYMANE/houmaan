'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'

interface SportsSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export default function SportsSearch({
  onSearch,
  placeholder = 'Rechercher un match, une équipe, une ligue...'
}: SportsSearchProps) {
  const [query, setQuery] = useState('')
  const [isActive, setIsActive] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  const handleClear = () => {
    setQuery('')
    onSearch?.('')
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center bg-bg-secondary border-2 rounded-lg transition-colors ${
            isActive
              ? 'border-accent-primary'
              : 'border-border-primary'
          }`}
        >
          <Search className="absolute left-4 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 bg-transparent text-text-primary placeholder-text-secondary focus:outline-none"
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
      </form>

      {!query && (
        <div className="mt-4 text-center text-text-secondary text-sm">
          <p className="mb-2">Recherchez un match, une équipe ou une ligue</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Football</span>
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Basketball</span>
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Tennis</span>
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Hockey</span>
          </div>
        </div>
      )}
    </div>
  )
}






import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'

interface SportsSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export default function SportsSearch({
  onSearch,
  placeholder = 'Rechercher un match, une équipe, une ligue...'
}: SportsSearchProps) {
  const [query, setQuery] = useState('')
  const [isActive, setIsActive] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  const handleClear = () => {
    setQuery('')
    onSearch?.('')
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center bg-bg-secondary border-2 rounded-lg transition-colors ${
            isActive
              ? 'border-accent-primary'
              : 'border-border-primary'
          }`}
        >
          <Search className="absolute left-4 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 bg-transparent text-text-primary placeholder-text-secondary focus:outline-none"
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
      </form>

      {!query && (
        <div className="mt-4 text-center text-text-secondary text-sm">
          <p className="mb-2">Recherchez un match, une équipe ou une ligue</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Football</span>
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Basketball</span>
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Tennis</span>
            <span className="px-3 py-1 bg-bg-tertiary rounded-lg text-xs">Hockey</span>
          </div>
        </div>
      )}
    </div>
  )
}






