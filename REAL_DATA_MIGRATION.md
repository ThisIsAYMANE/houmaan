# Real Data Migration - Sports Betting

## Overview

The sports betting section has been migrated from mock data to real data from The Odds API.

## Changes Made

### 1. **API Routes Updated**

#### `/api/sports/matches` (GET)
- **Before**: Queried database for matches
- **After**: Fetches real-time events from The Odds API
- **Features**:
  - Fetches events for specified sport
  - Filters by status (live, upcoming, finished)
  - Transforms Odds API format to our match format
  - Caches results for 1 minute

#### `/api/sports/matches/:id` (GET)
- **Before**: Queried database for specific match
- **After**: Fetches specific event from The Odds API
- **Features**:
  - Accepts `sportKey` query parameter
  - Searches across popular sports if sportKey not provided
  - Returns transformed match data

#### `/api/sports/matches/:id/odds` (GET)
- **Before**: Queried database for odds
- **After**: Fetches real-time odds from The Odds API
- **Features**:
  - Requires `sportKey` query parameter
  - Returns markets: h2h, spreads, totals
  - Converts American odds to decimal format
  - Includes bookmaker information

### 2. **Data Transformation**

Created `lib/odds-api-transform.ts` to transform Odds API data to our internal format:

- **Event → Match**: Transforms Odds API events to our match structure
- **Sport Mapping**: Maps Odds API sport keys to our sport slugs/names
- **Status Detection**: Determines match status (upcoming/live/finished) from commence_time
- **Odds Conversion**: Converts American odds to decimal format

### 3. **Frontend Updates**

#### `app/sports/page.tsx`
- **Removed**: Mock data imports and fallbacks
- **Updated**: Now shows empty state if no matches found
- **Behavior**: Fetches real data from `/api/sports/matches`

#### `app/sports/matches/[id]/page.tsx`
- **Removed**: Mock data imports
- **Updated**: Fetches match from `/api/sports/matches/:id`
- **Behavior**: Shows error if match not found

## API Usage

### Fetching Matches

```typescript
// Get all matches (defaults to popular sport)
GET /api/sports/matches

// Get matches for specific sport
GET /api/sports/matches?sport_id=americanfootball_nfl

// Get live matches
GET /api/sports/matches?is_live=true

// Get upcoming matches
GET /api/sports/matches?status=upcoming
```

### Fetching Specific Match

```typescript
// Get match details
GET /api/sports/matches/:id?sportKey=americanfootball_nfl
```

### Fetching Odds

```typescript
// Get odds for a match
GET /api/sports/matches/:id/odds?sportKey=americanfootball_nfl
```

## Data Format

### Match Format

```typescript
{
  id: string                    // Odds API event ID
  sport_id: string              // Odds API sport key
  sport_name: string            // Display name (e.g., "American Football")
  sport_slug: string            // URL-friendly slug
  league_id: string             // Same as sport_key
  league_name: string           // League name (e.g., "NFL")
  home_team: string
  away_team: string
  status: 'upcoming' | 'live' | 'finished'
  match_time: string            // ISO 8601 timestamp
  is_live: boolean
  odds?: {
    h2h?: {
      home: number              // Decimal odds
      draw?: number
      away: number
    }
  }
}
```

### Odds Format

```typescript
{
  matchId: string
  markets: [
    {
      id: string                // Market key (h2h, spreads, totals)
      name: string               // Display name
      slug: string
      type: string
      odds: [
        {
          id: string
          selection: string      // Team name or outcome
          odds: number           // Decimal odds
          point?: number         // For spreads/totals
          bookmaker: string      // Bookmaker name
        }
      ]
    }
  ]
}
```

## Sport Key Mapping

The system maps between Odds API sport keys and our internal format:

| Odds API Key | Our Slug | Display Name |
|-------------|----------|--------------|
| `americanfootball_nfl` | `american-football` | American Football |
| `basketball_nba` | `basketball` | Basketball |
| `soccer_epl` | `football` | Football |
| `icehockey_nhl` | `ice-hockey` | Ice Hockey |
| `baseball_mlb` | `baseball` | Baseball |

## Configuration

Make sure your `.env` file includes:

```env
ODDS_API_KEY=e4c5acd4484304b5ab937d082ef111ab
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
```

## Caching

- **Matches list**: Cached for 1 minute (odds change frequently)
- **Match details**: Cached for 30 seconds
- **Odds**: Cached for 30 seconds
- **Sports list**: Cached for 1 hour (doesn't change often)

## Error Handling

- If Odds API is not configured, endpoints return 500 with helpful message
- If match/event not found, returns 404
- Frontend shows empty state instead of mock data on errors
- All errors are logged for debugging

## Next Steps

1. **Test the integration**: Visit `/sports` page and verify real data loads
2. **Check sport filtering**: Test filtering by different sports
3. **Verify odds display**: Check that odds are displayed correctly
4. **Monitor API usage**: Keep track of API calls to stay within rate limits

## Benefits

✅ **Real-time data**: Always up-to-date matches and odds  
✅ **No mock data**: Production-ready with real sports data  
✅ **Multiple sports**: Access to 80+ sports from your subscription  
✅ **Live updates**: Odds refresh automatically  
✅ **Better UX**: Users see actual upcoming matches and live events  

