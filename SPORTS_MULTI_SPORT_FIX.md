# Sports Page - Multiple Sports Fix

## Problem
The sports page was only showing matches from one sport (defaulting to NFL) instead of showing matches from multiple sports.

## Root Cause
The `/api/sports/matches` endpoint was only fetching from a single sport when no sport was specified, defaulting to the first popular sport found.

## Solution Applied

### 1. **Updated `/api/sports/matches` Route**
- **Before**: Fetched from only one sport (default: NFL)
- **After**: Fetches from multiple popular sports in parallel when no sport is selected
- **Sports Fetched**: Up to 5 popular sports:
  - NFL
  - NBA
  - EPL
  - La Liga
  - Serie A
  - Bundesliga
  - Ligue 1
  - NHL
  - NCAAB
  - NCAAF

### 2. **Created `/api/sports/sports-list` Route**
- New endpoint to fetch all available sports from Odds API
- Returns formatted sports list for frontend
- Groups sports by category
- Excludes outrights (championship winners)

### 3. **Updated Frontend Sports List**
- **Before**: Hardcoded sports list
- **After**: Fetches real sports from Odds API
- Shows all available sports in your subscription
- "Tous" (All) button shows matches from all sports

### 4. **Improved Odds Display**
- Updated `getMatchOdds` to use real odds from Odds API when available
- Falls back to default odds if API data not available
- Uses h2h (head-to-head) odds from match data

## How It Works Now

### When "Tous" (All) is Selected:
1. Fetches events from 5 popular sports in parallel
2. Combines all events into one list
3. Sorts: Live matches first, then by match time
4. Applies filters (live/upcoming/finished)
5. Returns up to 50 matches

### When Specific Sport is Selected:
1. Fetches events only from that sport
2. Applies filters
3. Returns matches for that sport

## API Changes

### GET `/api/sports/matches`
**Query Parameters:**
- `sport_id` (optional): Filter by specific sport
- `status` (optional): 'live', 'upcoming', 'finished'
- `is_live` (optional): 'true' for live matches
- `limit` (optional): Number of matches to return (default: 50)

**Response (when no sport specified):**
```json
{
  "matches": [...],
  "total": 45,
  "limit": 50,
  "offset": 0,
  "sportsFetched": ["americanfootball_nfl", "basketball_nba", "soccer_epl", ...]
}
```

### GET `/api/sports/sports-list`
**Response:**
```json
{
  "sports": [
    {
      "id": "americanfootball_nfl",
      "name": "NFL",
      "slug": "americanfootball-nfl",
      "group": "American Football",
      "key": "americanfootball_nfl"
    },
    ...
  ],
  "grouped": {
    "American Football": [...],
    "Basketball": [...],
    "Soccer": [...]
  },
  "total": 80
}
```

## Expected Behavior

✅ **"Tous" Selected**: Shows matches from multiple sports (NFL, NBA, EPL, etc.)  
✅ **Specific Sport Selected**: Shows matches only from that sport  
✅ **Live Tab**: Shows only live matches from all sports  
✅ **Program Tab**: Shows upcoming matches from all sports  
✅ **Sports List**: Dynamically loaded from Odds API  

## Testing

1. **Visit `/sports` page**
2. **Check "Tous" button**: Should show matches from multiple sports
3. **Select a sport**: Should filter to that sport only
4. **Check "En Live" section**: Should show live matches from various sports
5. **Check "Populaire" section**: Should show popular matches from various sports

## Performance

- **Parallel Fetching**: Fetches from multiple sports simultaneously
- **Caching**: Sports list cached for 1 hour, matches cached for 1 minute
- **Rate Limits**: Respects Odds API rate limits (500 requests/month free tier)
- **Error Handling**: If one sport fails, others still load

## Next Steps

1. **Restart server** to load new code
2. **Visit sports page** to see matches from multiple sports
3. **Test sport filtering** to verify it works correctly
4. **Check live matches** to see variety of sports

