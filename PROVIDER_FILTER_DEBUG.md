# Provider Filter Debugging Guide

## Problem
Games from disabled providers are still appearing and causing "This provider is not enabled for your contract" errors.

## Fixes Applied

### 1. **Enhanced Provider Filtering** (`lib/casino-api.ts`)
- ✅ Added detailed logging to see what providers are enabled
- ✅ Case-insensitive provider name matching
- ✅ Fallback to check all currencies if specific currency has no providers
- ✅ Better error handling

### 2. **Improved Game Filtering** (`app/api/games/route.ts`)
- ✅ Case-insensitive provider matching when filtering games
- ✅ Detailed logging of filtered games
- ✅ Warning if enabled providers can't be determined

### 3. **Search Endpoint Filtering** (`app/api/games/search/route.ts`)
- ✅ Applied same provider filtering to search results
- ✅ Prevents disabled provider games from appearing in search

### 4. **Launch Endpoint Protection** (`app/api/games/[id]/launch/route.ts`)
- ✅ **NEW**: Checks game provider before attempting launch
- ✅ Blocks launch if provider is not enabled (returns 403)
- ✅ Prevents Slotegrator errors by catching it early

## Debugging Steps

### Step 1: Check Server Logs
Look for these log messages when fetching games:

```
[Provider Filter] Fetching enabled providers for currency: USD
[Provider Filter] Limits response: [...]
[Provider Filter] Found X enabled providers: [...]
[Provider Filter] Filtered out X games from disabled providers...
```

**If you see:**
- `WARNING: Could not determine enabled providers` → The `/limits` endpoint is not working
- `No providers found for currency USD` → Your contract might not have USD limits configured
- Empty providers list → Check if `/limits` endpoint is accessible

### Step 2: Test `/limits` Endpoint
Check if the limits endpoint is working:

```bash
# In your terminal, test the endpoint
curl -X GET "https://staging.slotegrator.com/api/index.php/v1/limits" \
  -H "X-Merchant-Id: YOUR_MERCHANT_ID" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Nonce: $(openssl rand -hex 16)" \
  -H "X-Sign: ..." # You'll need to calculate this
```

Or check your server logs when games are fetched - you should see the limits response logged.

### Step 3: Clear Cache
The enabled providers are cached for 1 hour. To force refresh:

1. **Restart your Next.js server** - this clears the in-memory cache
2. Or wait 1 hour for cache to expire

### Step 4: Check Currency Configuration
The filter uses `USD` by default. If your contract uses a different currency:

1. Check your `CASINO_DEFAULT_CURRENCY` environment variable
2. The code currently hardcodes `USD` - we may need to use the user's currency instead

### Step 5: Verify Provider Names Match
Provider names must match exactly (case-insensitive). Check:

1. What provider names are in `/limits` response
2. What provider names are in `/games` response
3. They should match (case-insensitive)

## Expected Behavior After Fix

### ✅ Working Correctly:
- Only games from enabled providers are shown
- Launch endpoint blocks disabled provider games before calling Slotegrator
- Server logs show filtering statistics
- No "provider not enabled" errors

### ❌ Still Not Working:
- Check server logs for `[Provider Filter]` messages
- Verify `/limits` endpoint is accessible
- Check if provider names match between `/limits` and `/games`
- Clear cache and restart server

## Next Steps If Still Failing

1. **Check Server Logs**: Look for `[Provider Filter]` messages to see what's happening
2. **Verify Limits Endpoint**: Make sure `/limits` is returning data
3. **Check Provider Names**: Ensure names match between endpoints
4. **Test Manually**: Try calling `/limits` endpoint directly to see response
5. **Contact Slotegrator**: If `/limits` is not working, contact them to enable it for your contract

## Code Changes Summary

1. **`lib/casino-api.ts`**: Enhanced `getEnabledProviders()` with logging and case-insensitive matching
2. **`app/api/games/route.ts`**: Improved filtering with case-insensitive matching and logging
3. **`app/api/games/search/route.ts`**: Added provider filtering to search
4. **`app/api/games/[id]/launch/route.ts`**: Added pre-launch provider check to block disabled providers

## Testing

After restarting your server:

1. **Check server logs** when loading casino page - should see provider filtering messages
2. **Try launching a game** - should be blocked if provider is disabled (403 error)
3. **Check browser console** - should see user-friendly error message
4. **Verify games list** - should only show games from enabled providers

