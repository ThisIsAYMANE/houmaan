'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface OddsUpdate {
  matchId: string
  marketId: string
  oddsId: string
  selection: string
  oldOdds: number
  newOdds: number
  timestamp: string
}

interface MarketSuspension {
  matchId: string
  marketId: string
  suspended: boolean
  reason?: string
  timestamp: string
}

interface MatchUpdate {
  matchId: string
  status: string
  homeScore?: number
  awayScore?: number
  matchMinute?: number
  isLive: boolean
  timestamp: string
}

interface UseOddsUpdatesOptions {
  matchId?: string
  matchIds?: string[]
  subscribeLive?: boolean
  enabled?: boolean
}

export function useOddsUpdates(options: UseOddsUpdatesOptions = {}) {
  const {
    matchId,
    matchIds = [],
    subscribeLive = false,
    enabled = true
  } = options

  const [odds, setOdds] = useState<Map<string, any>>(new Map())
  const [suspendedMarkets, setSuspendedMarkets] = useState<Set<string>>(new Set())
  const [matches, setMatches] = useState<Map<string, any>>(new Map())
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return

    const socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      setConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err)
      setError(err.message)
      setConnected(false)
    })

    // Handle odds updates
    socket.on('odds:update', (update: OddsUpdate) => {
      console.log('📊 Odds update received:', update)
      
      setOdds(prev => {
        const updated = new Map(prev)
        const key = `${update.marketId}-${update.oddsId}`
        updated.set(key, {
          selection: update.selection,
          odds: update.newOdds,
          previousOdds: update.oldOdds,
          change: update.newOdds > update.oldOdds ? 'up' : 'down',
          timestamp: update.timestamp
        })
        return updated
      })
    })

    // Handle market suspensions
    socket.on('market:suspension', (suspension: MarketSuspension) => {
      console.log('⏸️ Market suspension received:', suspension)
      
      setSuspendedMarkets(prev => {
        const updated = new Set(prev)
        if (suspension.suspended) {
          updated.add(suspension.marketId)
        } else {
          updated.delete(suspension.marketId)
        }
        return updated
      })
    })

    // Handle match updates
    socket.on('match:update', (update: MatchUpdate) => {
      console.log('⚽ Match update received:', update)
      
      setMatches(prev => {
        const updated = new Map(prev)
        updated.set(update.matchId, {
          status: update.status,
          homeScore: update.homeScore,
          awayScore: update.awayScore,
          matchMinute: update.matchMinute,
          isLive: update.isLive,
          timestamp: update.timestamp
        })
        return updated
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled])

  // Subscribe to specific matches
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !connected) return

    const allMatchIds = [
      ...(matchId ? [matchId] : []),
      ...matchIds
    ]

    allMatchIds.forEach(id => {
      socket.emit('subscribe:match', id)
    })

    return () => {
      allMatchIds.forEach(id => {
        socket.emit('unsubscribe:match', id)
      })
    }
  }, [connected, matchId, matchIds])

  // Subscribe to all live matches
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !connected || !subscribeLive) return

    socket.emit('subscribe:live')

    return () => {
      socket.emit('unsubscribe:live')
    }
  }, [connected, subscribeLive])

  // Subscribe to user-specific updates
  const subscribeToUser = useCallback((userId: string) => {
    const socket = socketRef.current
    if (!socket || !connected) return

    socket.emit('subscribe:user', userId)

    return () => {
      socket.emit('unsubscribe:user', userId)
    }
  }, [connected])

  return {
    odds,
    suspendedMarkets,
    matches,
    connected,
    error,
    subscribeToUser,
    socket: socketRef.current
  }
}


