/**
 * Unit Tests - lib/odds-api-transform.ts
 * Tests: transformOddsApiEventToMatch, transformOddsApiEventsToMatches, status logic
 */
import {
  transformOddsApiEventToMatch,
  transformOddsApiEventsToMatches,
} from '@/lib/odds-api-transform'
import type { Event } from '@/lib/odds-api'

// Helper to build a mock Odds API event
function mockEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    sport_key: 'soccer_epl',
    sport_title: 'English Premier League',
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    commence_time: new Date(Date.now() + 3600 * 1000).toISOString(), // starts in 1 hour
    bookmakers: [],
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────
// transformOddsApiEventToMatch (single event)
// ─────────────────────────────────────────────────────
describe('transformOddsApiEventToMatch', () => {
  it('returns a TransformedMatch with correct team names', () => {
    const result = transformOddsApiEventToMatch(mockEvent())
    expect(result.home_team).toBe('Arsenal')
    expect(result.away_team).toBe('Chelsea')
    expect(result.sport_key).toBe('soccer_epl')
    expect(result.id).toBe('evt-1')
  })

  it('marks a future match as upcoming and not live', () => {
    const futureEvent = mockEvent({
      commence_time: new Date(Date.now() + 7200 * 1000).toISOString(),
    })
    const match = transformOddsApiEventToMatch(futureEvent)
    expect(match.status).toBe('upcoming')
    expect(match.is_live).toBe(false)
  })

  it('marks a match started 30 minutes ago as live', () => {
    const liveEvent = mockEvent({
      commence_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    })
    const match = transformOddsApiEventToMatch(liveEvent)
    expect(match.is_live).toBe(true)
    expect(match.status).toBe('live')
  })

  it('extracts h2h odds correctly from bookmakers', () => {
    const eventWithOdds = mockEvent({
      bookmakers: [
        {
          key: 'betfair',
          title: 'Betfair',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Arsenal', price: 1.80 },
                { name: 'The Draw', price: 3.50 },
                { name: 'Chelsea', price: 4.20 },
              ],
            },
          ],
        },
      ],
    })
    const match = transformOddsApiEventToMatch(eventWithOdds)
    expect(match.odds?.h2h?.home).toBeCloseTo(1.80)
    expect(match.odds?.h2h?.away).toBeCloseTo(4.20)
    expect(match.odds?.h2h?.draw).toBeCloseTo(3.50)
  })

  it('handles empty bookmakers gracefully (no crash, no odds)', () => {
    const match = transformOddsApiEventToMatch(mockEvent({ bookmakers: [] }))
    expect(match).toBeDefined()
    expect(match.home_team).toBe('Arsenal')
    expect(match.odds).toBeUndefined()
  })

  it('maps soccer sport_key to football sport_slug', () => {
    const match = transformOddsApiEventToMatch(mockEvent({ sport_key: 'soccer_epl' }))
    expect(match.sport_slug).toBe('football')
  })

  it('maps americanfootball sport_key to american-football sport_slug', () => {
    const match = transformOddsApiEventToMatch(mockEvent({ sport_key: 'americanfootball_nfl' }))
    expect(match.sport_slug).toBe('american-football')
  })
})

// ─────────────────────────────────────────────────────
// transformOddsApiEventsToMatches (array)
// ─────────────────────────────────────────────────────
describe('transformOddsApiEventsToMatches', () => {
  it('returns empty array for empty input', () => {
    expect(transformOddsApiEventsToMatches([])).toEqual([])
  })

  it('processes multiple events and preserves order', () => {
    const events = [
      mockEvent({ id: 'evt-1', home_team: 'Man City', away_team: 'Liverpool' }),
      mockEvent({ id: 'evt-2', home_team: 'Barca', away_team: 'Madrid' }),
    ]
    const result = transformOddsApiEventsToMatches(events)
    expect(result).toHaveLength(2)
    expect(result[0].home_team).toBe('Man City')
    expect(result[1].home_team).toBe('Barca')
  })
})
