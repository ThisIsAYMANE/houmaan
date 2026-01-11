# Testing Casino API - Quick Guide

## ✅ Your Configuration is Ready!

You now have:
- ✅ Merchant ID: `dbb46701285c1a2e24a0bf92f00501e5`
- ✅ Merchant Key: `b83d51ea35e2620a4e29913a9059e8e5038caa64`
- ✅ API Base URL: `https://staging.slotegrator.com/api/index.php/v1`
- ✅ Callback URL: `https://bozcallback.ngrok.app/api/casino/callback`
- ✅ ngrok running

## Step 1: Restart Next.js Server

**IMPORTANT:** After updating `.env`, you MUST restart your server:

1. **Stop the current server:**
   - Go to the terminal where `npm run dev` is running
   - Press `Ctrl+C` to stop it

2. **Start it again:**
   ```powershell
   npm run dev
   ```

3. **Wait for it to start** (you should see "Ready" message)

## Step 2: Test Readiness Endpoint

```powershell
# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/self-validate" -Method GET | Select-Object -ExpandProperty Content

# Or using curl (if available)
curl http://localhost:3000/api/casino/self-validate

# Or just open in browser
# http://localhost:3000/api/casino/self-validate
```

**Expected Response:**
```json
{
  "ready": false,
  "hasActiveSession": false,
  "isConfigured": true,
  "hasRealMerchantId": true,
  "configuration": {
    "merchantId": "***configured***",
    "merchantKey": "***configured***",
    "baseUrl": "***configured***"
  },
  "activeSession": null,
  "requirements": {
    "activeGameSession": "A game session opened within the last 15 minutes",
    "casinoApiCredentials": "CASINO_MERCHANT_ID, CASINO_MERCHANT_KEY, and CASINO_API_BASE_URL must be set",
    "merchantId": "You need to replace 'your-merchant-id' with your actual Merchant ID from Slotegrator"
  }
}
```

## Step 3: Fetch Games from Slotegrator

Once the server is restarted, test fetching games:

```powershell
# Fetch games list
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/games" -Method GET | Select-Object -ExpandProperty Content

# Or with curl
curl http://localhost:3000/api/casino/games

# Or in browser
# http://localhost:3000/api/casino/games
```

**Expected Response:**
```json
{
  "success": true,
  "games": [
    {
      "uuid": "game-uuid-123",
      "name": "Game Name",
      "image": "https://...",
      "type": "Slots",
      "provider": "Provider Name",
      "provider_id": 123,
      "technology": "html5",
      "has_lobby": 0,
      "is_mobile": 1,
      "has_freespins": 1
    }
  ],
  "total": 100
}
```

## Step 4: Run Self-Validation

Self-validation requires an active game session. For now, you can test if the endpoint works:

```powershell
# Run self-validation
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/self-validate" -Method POST | Select-Object -ExpandProperty Content

# Or with curl
curl -X POST http://localhost:3000/api/casino/self-validate
```

**If you get "No active game session found":**
- This is expected if you haven't launched a game yet
- Self-validation requires an active session (opened within 15 minutes)
- You can still fetch games without it

**If you get a Casino API error:**
- Check that your Merchant ID and Key are correct
- Verify the API URL is correct
- Check server logs for detailed error messages

## Step 5: Test with Expansions

Fetch games with additional data:

```powershell
# With tags and images
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/games?expand=tags,images,parameters" -Method GET | Select-Object -ExpandProperty Content
```

## Troubleshooting

### Still Getting 500 Error?

1. **Make sure server is restarted:**
   - Stop it completely (Ctrl+C)
   - Start again: `npm run dev`

2. **Check server logs:**
   - Look at the terminal where `npm run dev` is running
   - Check for any error messages

3. **Verify .env file:**
   - Make sure it's in the project root
   - Check that there are no extra spaces or quotes
   - Variables should be: `KEY=value` (no spaces around `=`)

4. **Test a simple endpoint:**
   ```powershell
   curl http://localhost:3000/api/games
   ```
   If this works, the server is running. If not, there's a server issue.

### "Casino API request failed: 401 Unauthorized"

- Double-check your Merchant ID and Key
- Make sure they match what Slotegrator provided
- Verify there are no extra spaces in `.env`

### "Casino API request failed: 400 Bad Request"

- Check the API URL format
- Verify it doesn't have a trailing slash (code handles this)
- Check server logs for more details

## Next Steps After Testing

Once everything works:

1. **Implement Callback Endpoint:**
   - Create `/app/api/casino/callback/route.ts`
   - Handle balance, bet, win, refund, rollback actions

2. **Complete Game Initialization:**
   - Implement full `initializeGameSession()` in `lib/casino-api.ts`
   - Call `POST /games/init` with proper parameters

3. **Sync Games to Database:**
   - Create a sync script to import games from Slotegrator
   - Update your games table with real game data

4. **Test Full Flow:**
   - Launch a game
   - Make a bet
   - Receive callbacks
   - Process transactions

## Quick Test Commands Summary

```powershell
# 1. Check readiness
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/self-validate" -Method GET

# 2. Fetch games
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/games" -Method GET

# 3. Fetch games with expansions
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/games?expand=tags,images" -Method GET

# 4. Run self-validation
Invoke-WebRequest -Uri "http://localhost:3000/api/casino/self-validate" -Method POST
```

## Success Indicators

✅ **Readiness endpoint returns 200** with `isConfigured: true`  
✅ **Games endpoint returns games list** from Slotegrator  
✅ **No 500 errors** in server logs  
✅ **Self-validation endpoint responds** (even if no active session)

Good luck! 🎰

