# Odds API Integration Guide

## Overview

This integration connects your application to [The Odds API](https://the-odds-api.com/) to fetch real-time sports odds and events.

## Configuration

### Environment Variables

Add to your `.env` file:

```env
ODDS_API_KEY=e4c5acd4484304b5ab937d082ef111ab
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
```

## Available Sports

Your subscription includes the following sports:

- **American Football**: NFL, NCAAF, Super Bowl Winner
- **Basketball**: NBA, NCAAB, WNCAAB, Euroleague, NBL, Championship Winners
- **Baseball**: MLB World Series Winner
- **Soccer**: EPL, La Liga, Serie A, Bundesliga, Champions League, World Cup, and many more
- **Ice Hockey**: NHL, AHL, SHL, Liiga, Championship Winner
- **Tennis**: ATP/WTA Australian Open
- **Other**: Cricket, Rugby, Golf, MMA, Boxing, Politics, and more

See the full list in the sports array provided.

## API Endpoints

### 1. Get Available Sports

**GET** `/api/odds/sports`

Returns a list of all active sports in your subscription.

**Response:**
```json
{
  "sports": [
    {
      "key": "americanfootball_nfl",
      "group": "American Football",
      "title": "NFL",
      "description": "US Football",
      "active": true,
      "has_outrights": false
    }
  ],
  "total": 80
}
```

### 2. Get Odds for a Sport

**GET** `/api/odds/sports/:sportKey`

Get upcoming events and odds for a specific sport.

**Query Parameters:**
- `regions` (optional): Comma-separated regions (e.g., `us`, `eu`, `uk`). Default: `us`
- `markets` (optional): Comma-separated markets (e.g., `h2h`, `spreads`, `totals`). Default: `h2h,spreads,totals`
- `oddsFormat` (optional): `american` or `decimal`. Default: `american`

**Example:**
```
GET /api/odds/sports/americanfootball_nfl?regions=us&oddsFormat=american
```

**Response:**
```json
{
  "sportKey": "americanfootball_nfl",
  "events": [
    {
      "id": "bda33adca828c09dc3cac3a856aef176",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2021-09-10T00:20:00Z",
      "home_team": "Tampa Bay Buccaneers",
      "away_team": "Dallas Cowboys",
      "bookmakers": [
        {
          "key": "fanduel",
          "title": "FanDuel",
          "last_update": "2021-06-10T10:46:09Z",
          "markets": [
            {
              "key": "h2h",
              "outcomes": [
                {
                  "name": "Dallas Cowboys",
                  "price": 240
                },
                {
                  "name": "Tampa Bay Buccaneers",
                  "price": -303
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "total": 10,
  "regions": "us",
  "markets": "h2h,spreads,totals",
  "oddsFormat": "american"
}
```

### 3. Get Odds for a Specific Event

**GET** `/api/odds/events/:eventId`

Get odds for a specific event.

**Query Parameters:**
- `sportKey` (required): Sport key (e.g., `americanfootball_nfl`)
- `regions` (optional): Comma-separated regions. Default: `us`
- `markets` (optional): Comma-separated markets. Default: `h2h,spreads,totals`
- `oddsFormat` (optional): `american` or `decimal`. Default: `american`

**Example:**
```
GET /api/odds/events/bda33adca828c09dc3cac3a856aef176?sportKey=americanfootball_nfl&regions=us
```

## Market Types

Common market types available:

- **h2h** (Head-to-Head): Win/lose/draw odds
- **spreads**: Point spreads
- **totals**: Over/under totals
- **outrights**: Championship/winner odds (for sports with `has_outrights: true`)

## Odds Formats

### American Odds
- Positive odds (e.g., `+240`): Amount won on $100 bet
- Negative odds (e.g., `-303`): Amount needed to bet to win $100

### Decimal Odds
- Decimal format (e.g., `2.40`): Total return including stake

## Usage Examples

### Fetch NFL Odds

```typescript
// Frontend
const response = await fetch('/api/odds/sports/americanfootball_nfl?regions=us&oddsFormat=american')
const data = await response.json()
console.log(data.events)
```

### Fetch NBA Odds

```typescript
const response = await fetch('/api/odds/sports/basketball_nba?regions=us&markets=h2h,spreads&oddsFormat=decimal')
const data = await response.json()
```

### Get All Available Sports

```typescript
const response = await fetch('/api/odds/sports')
const data = await response.json()
const sports = data.sports
```

## Library Functions

You can also use the library directly in server-side code:

```typescript
import { getSports, getSportOdds, getEventOdds } from '@/lib/odds-api'

// Get all sports
const sports = await getSports()

// Get odds for a sport
const events = await getSportOdds('americanfootball_nfl', {
  regions: 'us',
  markets: 'h2h,spreads,totals',
  oddsFormat: 'american'
})

// Get odds for a specific event
const event = await getEventOdds('americanfootball_nfl', 'event-id', {
  regions: 'us',
  oddsFormat: 'decimal'
})
```

## Utility Functions

### Convert Odds Formats

```typescript
import { americanToDecimal, decimalToAmerican } from '@/lib/odds-api'

// Convert American to Decimal
const decimal = americanToDecimal(240) // Returns 3.40

// Convert Decimal to American
const american = decimalToAmerican(3.40) // Returns 240
```

### Get Best Odds

```typescript
import { getBestOdds } from '@/lib/odds-api'

// Find best odds from all bookmakers
const best = getBestOdds(event.bookmakers, 'h2h')
// Returns: { bestOdds: 240, bookmaker: 'FanDuel', outcome: {...} }
```

## Caching

- **Sports list**: Cached for 1 hour (doesn't change often)
- **Odds**: Cached for 1 minute (odds change frequently)
- **Event odds**: Cached for 30 seconds (most volatile)

## Error Handling

All endpoints return proper error responses:

```json
{
  "error": "Failed to fetch odds",
  "message": "Detailed error message",
  "sportKey": "americanfootball_nfl"
}
```

## Rate Limits

The Odds API has rate limits based on your subscription tier:
- **Free tier**: 500 requests/month
- **Paid tiers**: Higher limits

The integration uses caching to minimize API calls.

## Next Steps

1. **Add API key to `.env`**: Set `ODDS_API_KEY` with your key
2. **Test endpoints**: Try `/api/odds/sports` to see available sports
3. **Integrate with frontend**: Use the API routes in your sports betting UI
4. **Sync to database**: Optionally sync events/odds to your database for faster queries

## Integration with Existing Sports Structure

The Odds API can be integrated with your existing sports betting system:

1. **Fetch events** from Odds API
2. **Transform** to your match format
3. **Store** in database
4. **Update** odds periodically

See `lib/sports-sync.ts` for sync functionality.


