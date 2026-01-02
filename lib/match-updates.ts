/**
 * Match Updates Service
 * 
 * Provides real-time match updates through polling
 * Can be upgraded to WebSocket for true real-time updates
 */

import { query } from './db'

export interface MatchUpdate {
  id: string
  home_score: number
  away_score: number
  match_minute?: number
  status: string
  is_live: boolean
  current_score: string
  updated_at: string
}

/**
 * Poll for match updates
 * Call this from the frontend every 10-30 seconds for live matches
 */
export async function getMatchUpdates(matchIds: string[]): Promise<MatchUpdate[]> {
  if (matchIds.length === 0) {
    return []
  }

  const placeholders = matchIds.map(() => '?').join(',')
  
  const result = await query(
    `SELECT 
      id,
      home_score,
      away_score,
      match_minute,
      status,
      is_live,
      current_score,
      updated_at
    FROM matches
    WHERE id IN (${placeholders})
    ORDER BY updated_at DESC`,
    matchIds
  )

  return result.rows as MatchUpdate[]
}

/**
 * Get all live matches for real-time updates
 */
export async function getLiveMatches(): Promise<MatchUpdate[]> {
  const result = await query(
    `SELECT 
      id,
      home_score,
      away_score,
      match_minute,
      status,
      is_live,
      current_score,
      updated_at
    FROM matches
    WHERE is_live = 1
    ORDER BY updated_at DESC`
  )

  return result.rows as MatchUpdate[]
}

/**
 * Update match score (can be called by external webhook or manual admin update)
 */
export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  matchMinute?: number,
  status?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isLive = status === 'live' ? 1 : 0
    const currentScore = `${homeScore}-${awayScore}`
    
    await query(
      `UPDATE matches 
       SET home_score = ?,
           away_score = ?,
           current_score = ?,
           match_minute = ?,
           status = ?,
           is_live = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [homeScore, awayScore, currentScore, matchMinute || null, status || 'live', isLive, matchId]
    )

    return { success: true }
  } catch (error) {
    console.error('Error updating match score:', error)
    return { success: false, error: 'Failed to update match score' }
  }
}

/**
 * Simulate live score updates (for testing)
 * In production, this would be replaced by actual API updates
 */
export async function simulateLiveUpdates(matchId: string): Promise<void> {
  const match = await query('SELECT * FROM matches WHERE id = ?', [matchId])
  
  if (match.rows.length === 0) return

  const currentMatch = match.rows[0] as any
  let minute = currentMatch.match_minute || 0
  let homeScore = currentMatch.home_score || 0
  let awayScore = currentMatch.away_score || 0

  // Simulate a goal every 15 minutes
  if (minute % 15 === 0 && Math.random() > 0.7) {
    if (Math.random() > 0.5) {
      homeScore++
    } else {
      awayScore++
    }
  }

  // Increment minute
  minute++

  // Check if match should end
  if (minute >= 90) {
    await query(
      `UPDATE matches 
       SET status = 'finished', is_live = 0, home_score = ?, away_score = ?, match_minute = 90
       WHERE id = ?`,
      [homeScore, awayScore, matchId]
    )
  } else {
    await updateMatchScore(matchId, homeScore, awayScore, minute, 'live')
  }
}

