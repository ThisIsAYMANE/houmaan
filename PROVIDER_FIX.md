# Provider Not Enabled Fix

## Problem Analysis

**Error**: "This provider is not enabled for your contract"

### Root Cause
1. The `/games` endpoint returns **ALL games** from Slotegrator, including games from providers that aren't enabled in your contract
2. When you try to launch a game from a disabled provider, Slotegrator returns this error
3. The application was showing all games without filtering by enabled providers

### Solution Applied

#### 1. **Fetch Enabled Providers** (`lib/casino-api.ts`)
- Added `getMerchantLimits()` function to fetch merchant limits from `/limits` endpoint
- Added `getEnabledProviders()` function to extract enabled providers for a currency
- Uses `/limits` endpoint which returns providers enabled for each currency

#### 2. **Filter Games by Enabled Providers** (`app/api/games/route.ts`)
- Games are now filtered to only show games from enabled providers
- Uses cached enabled providers list (1 hour TTL)
- Falls back to showing all games if we can't determine enabled providers
- Logs how many games were filtered out

#### 3. **Improved Error Handling** (`components/casino/GameLaunch.tsx`)
- Better error messages for provider/currency errors
- User-friendly French message: "Ce jeu n'est pas disponible actuellement. Veuillez essayer un autre jeu."
- Still shows detailed errors in console for debugging

#### 4. **Reduced Console Noise** (`app/casino/page.tsx`)
- Changed `console.warn` to `console.debug` for duplicate category warnings
- Only logs in development mode to reduce production noise

## How It Works

1. **On Game Fetch**:
   - Fetches enabled providers from `/limits` endpoint (cached for 1 hour)
   - Filters games to only include games from enabled providers
   - Logs filtering statistics

2. **On Game Launch**:
   - If a game still fails (edge case), shows user-friendly error message
   - Detailed error still logged in console for debugging

## Testing

### Expected Behavior
- ✅ Only games from enabled providers are shown
- ✅ No "provider not enabled" errors when launching games
- ✅ Reduced console warnings
- ✅ Better error messages for users

### If Issues Persist

1. **Check Server Logs**:
   - Look for "Filtered out X games from disabled providers" message
   - Check if enabled providers are being fetched correctly

2. **Verify Limits Endpoint**:
   - The `/limits` endpoint should return providers for your currency
   - Check if the endpoint is accessible and returns data

3. **Check Currency**:
   - Currently using USD as default currency
   - If your contract uses a different currency, we may need to adjust

## Next Steps

1. **Restart your server** to load the new code
2. **Clear cache** (optional): The enabled providers are cached for 1 hour
3. **Test game launch**: Should now only show games from enabled providers

## Notes

- The `/limits` endpoint shows providers enabled per currency
- Currently using USD currency - if you need a different currency, we can update the code
- If `/limits` endpoint fails, the app falls back to showing all games (to prevent breaking the app)
- Games are filtered server-side, so disabled provider games won't appear in the UI

