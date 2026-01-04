import { NextRequest, NextResponse } from 'next/server'
import { getMatchUpdates, getLiveMatches } from '@/lib/match-updates'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const matchIdsParam = searchParams.get('match_ids')
    
    let matches

    if (matchIdsParam) {
      // Get specific matches
      const matchIds = matchIdsParam.split(',')
      matches = await getMatchUpdates(matchIds)
    } else {
      // Get all live matches
      matches = await getLiveMatches()
    }

    return NextResponse.json({
      matches,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching live match updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live updates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin only: Manual score update
    const body = await request.json()
    const { matchId, homeScore, awayScore, matchMinute, status } = body

    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { updateMatchScore } = await import('@/lib/match-updates')
    const result = await updateMatchScore(matchId, homeScore, awayScore, matchMinute, status)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Match score updated successfully',
      matchId,
      score: `${homeScore}-${awayScore}`
    })
  } catch (error) {
    console.error('Error updating match score:', error)
    return NextResponse.json(
      { error: 'Failed to update match score' },
      { status: 500 }
    )
  }
}



