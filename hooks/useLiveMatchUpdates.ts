import { useState, useEffect, useRef } from 'react'

export interface LiveMatch {
  id: string
  home_score: number
  away_score: number
  match_minute?: number
  status: string
  is_live: boolean
  current_score: string
  updated_at: string
}

interface UseLiveMatchUpdatesOptions {
  matchIds?: string[]
  enabled?: boolean
  pollInterval?: number // in milliseconds, default 10000 (10 seconds)
}

export function useLiveMatchUpdates(options: UseLiveMatchUpdatesOptions = {}) {
  const {
    matchIds = [],
    enabled = true,
    pollInterval = 10000
  } = options

  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUpdates = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (matchIds.length > 0) {
        params.append('match_ids', matchIds.join(','))
      }

      const response = await fetch(`/api/sports/matches/live-updates?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setMatches(data.matches || [])
      } else {
        setError(data.error || 'Failed to fetch updates')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch updates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Fetch immediately
    fetchUpdates()

    // Set up polling
    intervalRef.current = setInterval(fetchUpdates, pollInterval)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, matchIds.join(','), pollInterval])

  return {
    matches,
    loading,
    error,
    refetch: fetchUpdates
  }
}





