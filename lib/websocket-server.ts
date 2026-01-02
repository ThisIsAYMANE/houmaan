/**
 * WebSocket Server for Real-Time Updates
 * 
 * Provides real-time updates for:
 * - Live odds changes
 * - Match status updates
 * - Bet settlement notifications
 * - Market suspensions
 */

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export interface OddsUpdate {
  matchId: string
  marketId: string
  oddsId: string
  selection: string
  oldOdds: number
  newOdds: number
  timestamp: string
}

export interface MarketSuspension {
  matchId: string
  marketId: string
  suspended: boolean
  reason?: string
  timestamp: string
}

export interface MatchUpdate {
  matchId: string
  status: string
  homeScore?: number
  awayScore?: number
  matchMinute?: number
  isLive: boolean
  timestamp: string
}

export interface BetSettlement {
  betId: string
  userId: string
  status: 'won' | 'lost' | 'void' | 'cashout'
  payout?: number
  timestamp: string
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  if (io) {
    console.log('⚠️ WebSocket server already initialized')
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/'
  })

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    // Handle match subscription
    socket.on('subscribe:match', (matchId: string) => {
      socket.join(`match:${matchId}`)
      console.log(`📡 Client ${socket.id} subscribed to match ${matchId}`)
    })

    // Handle match unsubscription
    socket.on('unsubscribe:match', (matchId: string) => {
      socket.leave(`match:${matchId}`)
      console.log(`📴 Client ${socket.id} unsubscribed from match ${matchId}`)
    })

    // Handle user-specific subscriptions
    socket.on('subscribe:user', (userId: string) => {
      socket.join(`user:${userId}`)
      console.log(`👤 Client ${socket.id} subscribed to user ${userId} updates`)
    })

    socket.on('unsubscribe:user', (userId: string) => {
      socket.leave(`user:${userId}`)
      console.log(`👤 Client ${socket.id} unsubscribed from user ${userId} updates`)
    })

    // Handle live matches subscription (all live)
    socket.on('subscribe:live', () => {
      socket.join('live:all')
      console.log(`🔴 Client ${socket.id} subscribed to all live matches`)
    })

    socket.on('unsubscribe:live', () => {
      socket.leave('live:all')
      console.log(`🔴 Client ${socket.id} unsubscribed from all live matches`)
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })
  })

  console.log('🚀 WebSocket server initialized')
  return io
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io
}

/**
 * Broadcast odds update to subscribers
 */
export function broadcastOddsUpdate(update: OddsUpdate) {
  if (!io) {
    console.warn('⚠️ WebSocket server not initialized')
    return
  }

  // Broadcast to match subscribers
  io.to(`match:${update.matchId}`).emit('odds:update', update)
  
  // Also broadcast to all live matches subscribers if match is live
  io.to('live:all').emit('odds:update', update)

  console.log(`📊 Odds update broadcasted for match ${update.matchId}`)
}

/**
 * Broadcast market suspension
 */
export function broadcastMarketSuspension(suspension: MarketSuspension) {
  if (!io) return

  io.to(`match:${suspension.matchId}`).emit('market:suspension', suspension)
  io.to('live:all').emit('market:suspension', suspension)

  console.log(`⏸️ Market suspension broadcasted: ${suspension.marketId}`)
}

/**
 * Broadcast match update (score, status, etc.)
 */
export function broadcastMatchUpdate(update: MatchUpdate) {
  if (!io) return

  io.to(`match:${update.matchId}`).emit('match:update', update)
  io.to('live:all').emit('match:update', update)

  console.log(`⚽ Match update broadcasted: ${update.matchId}`)
}

/**
 * Notify user about bet settlement
 */
export function notifyBetSettlement(settlement: BetSettlement) {
  if (!io) return

  io.to(`user:${settlement.userId}`).emit('bet:settlement', settlement)

  console.log(`💰 Bet settlement notification sent to user ${settlement.userId}`)
}

/**
 * Broadcast to all connected clients
 */
export function broadcastGlobal(event: string, data: any) {
  if (!io) return

  io.emit(event, data)
  console.log(`📢 Global broadcast: ${event}`)
}

/**
 * Get connection statistics
 */
export function getConnectionStats() {
  if (!io) {
    return {
      connected: 0,
      rooms: {}
    }
  }

  const sockets = io.sockets.sockets
  const rooms = io.sockets.adapter.rooms

  return {
    connected: sockets.size,
    rooms: Array.from(rooms.keys()).filter(room => !sockets.has(room))
  }
}

