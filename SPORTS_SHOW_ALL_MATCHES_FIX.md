# Sports Page - Show All Matches Fix

## Problem Analysis
The sports page was not showing all matches from the API due to multiple limiting factors:

### Issues Found:

1. **API Route Limits** (`app/api/sports/matches/route.ts`):
   - Line 53: Default limit was 50 matches
   - Line 127: Only fetched from first 5 sports when "Tous" was selected
   - Line 100-111: Only used hardcoded list of 10 popular sports
   - Line 162 & 197: Applied `.slice(0, limit)` to restrict results

2. **Frontend Limits** (`app/sports/page.tsx`):
   - Line 158: Requested only 50 matches (`limit: '50'`)
   - Line 260: Only showed first 6 matches in popular section (`.slice(0, 6)`)
   - Line 353: Only showed first 6 live matches (`.slice(0, 6)`)

3. **Missing Sports**:
   - Only fetched from 10 hardcoded popular sports
   - User has 80+ sports in subscription, but only 10 were being fetched

## Solution Applied

### 1. **Removed API Limit Restrictions**
- Changed default limit from `50` to `10000` (effectively unlimited)
- Removed `.slice(0, 5)` restriction on sports to fetch
- Now fetches from ALL active sports, not just 10 popular ones

### 2. **Fetch from ALL Active Sports**
- **Before**: Only fetched from hardcoded list of 10 popular sports
- **After**: Fetches from ALL active sports in user's subscription
- Uses `availableSports.filter(s => s.active && !s.has_outrights)` to get all active sports

### 3. **Removed Frontend Slice Limits**
- **Before**: `popularMatches.slice(0, 6)` - only showed 6 matches
- **After**: `popularMatches` - shows ALL matches
- **Before**: `liveMatches.slice(0, 6)` - only showed 6 live matches
- **After**: `liveMatches` - shows ALL live matches

### 4. **Increased Frontend Request Limit**
- Changed from `limit: '50'` to `limit: '10000'`
- Ensures all matches are requested from API

## Code Changes

### `app/api/sports/matches/route.ts`:

```typescript
// BEFORE:
const limit = parseInt(searchParams.get('limit') || '50')
const sportsToFetch = activePopularSports.slice(0, 5) // Only 5 sports
const limitedMatches = matches.slice(0, limit) // Limit to 50

// AFTER:
const limit = parseInt(searchParams.get('limit') || '10000') // Effectively unlimited
const sportsToFetch = allActiveSports // ALL active sports
// No slice limit - returns all matches
```

### `app/sports/page.tsx`:

```typescript
// BEFORE:
params.append('limit', '50')
const popularMatches = matches.slice(0, 6)
matches={liveMatches.slice(0, 6)}

// AFTER:
params.append('limit', '10000')
const popularMatches = matches // ALL matches
matches={liveMatches} // ALL live matches
```

## Expected Behavior

✅ **"Tous" Selected**: Fetches from ALL 80+ active sports in subscription  
✅ **All Matches Displayed**: Shows every single match returned by API  
✅ **No Limits**: No artificial limits on number of matches shown  
✅ **Live Matches**: Shows all live matches, not just 6  
✅ **Popular Section**: Shows all matches, not just 6  

## Performance Considerations

- **API Calls**: Fetches from all active sports in parallel
- **Rate Limits**: Odds API free tier allows 500 requests/month
- **Caching**: Results are cached for 60 seconds to reduce API calls
- **Error Handling**: If one sport fails, others still load

## Testing

1. **Visit `/sports` page**
2. **Check "Tous" filter**: Should show matches from ALL sports
3. **Check match count**: Should see many more matches than before
4. **Check live matches**: Should show all live matches, not just 6
5. **Check popular section**: Should show all matches, not just 6
6. **Select specific sport**: Should show all matches for that sport

## Result

The sports page now shows **every single match** returned by the Odds API from **all active sports** in the user's subscription, with no artificial limits.

