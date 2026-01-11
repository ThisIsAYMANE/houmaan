# Self-Validation and Games Access - Step by Step Guide

## Prerequisites Checklist

Before starting, make sure you have:

- [x] ngrok running (you confirmed this works!)
- [ ] **Merchant ID** from Slotegrator (you still need this!)
- [x] Merchant Key: `b83d51ea35e2620a4e29913a9059e8e5038caa64`
- [x] API Base URL: `https://staging.slotegrator.com/api/index.php/v1`
- [x] Callback URL: `https://bozcallback.ngrok.app/api/casino/callback`
- [x] Next.js app running on port 3000

## Step 1: Get Your Merchant ID

**IMPORTANT:** You need to contact Slotegrator to get your **Merchant ID**. This is different from the Merchant Key.

1. Contact your Slotegrator integration manager
2. Ask for your **Merchant ID** (not the key, the ID)
3. It should look something like: `12345` or `merchant_abc123`

## Step 2: Configure Environment Variables

1. **Create/Update your `.env` file:**
   ```bash
   # Copy from example if you haven't already
   cp env.example .env
   ```

2. **Edit `.env` and add your Merchant ID:**
   ```env
   CASINO_MERCHANT_ID=YOUR_MERCHANT_ID_HERE
   CASINO_MERCHANT_KEY=b83d51ea35e2620a4e29913a9059e8e5038caa64
   CASINO_API_BASE_URL=https://staging.slotegrator.com/api/index.php/v1
   CASINO_CALLBACK_URL=https://bozcallback.ngrok.app/api/casino/callback
   CASINO_TEST_AREA_URL=https://boztestarea.ngrok.app
   ```

3. **Restart your Next.js server** after updating `.env`:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

## Step 3: Check Readiness

Before running self-validation, check if everything is configured:

```bash
# Using curl
curl http://localhost:3000/api/casino/self-validate

# Or visit in browser
http://localhost:3000/api/casino/self-validate
```

**Expected Response:**
```json
{
  "ready": false,
  "hasActiveSession": false,
  "isConfigured": true,
  "activeSession": null,
  "requirements": {
    "activeGameSession": "A game session opened within the last 15 minutes",
    "casinoApiCredentials": "CASINO_MERCHANT_ID, CASINO_MERCHANT_KEY, and CASINO_API_BASE_URL must be set"
  }
}
```

If `isConfigured` is `false`, check your `.env` file.

## Step 4: Launch a Game (Create Active Session)

Self-validation requires an active game session. However, to launch a game, we first need to implement the full game initialization. For now, let's test the self-validation endpoint directly.

**Note:** The self-validation endpoint from Slotegrator might work without an active session in staging, or it might require one. Let's try it:

```bash
# Try self-validation
curl -X POST http://localhost:3000/api/casino/self-validate
```

**If you get "No active game session found":**

We need to create a game session first. This requires implementing the full game initialization flow. For now, you can:

1. **Skip self-validation temporarily** and test fetching games directly
2. **Or implement game initialization** (see Step 6)

## Step 5: Fetch Games from Slotegrator API

Once your Merchant ID is configured, you can fetch games:

```bash
# Fetch games list
curl http://localhost:3000/api/casino/games

# Or with expansions
curl "http://localhost:3000/api/casino/games?expand=tags,parameters,images"
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

## Step 6: Run Self-Validation (After Game Session)

Once you have an active game session (or if Slotegrator allows it without one):

```bash
# Run self-validation
curl -X POST http://localhost:3000/api/casino/self-validate
```

**Success Response:**
```json
{
  "success": true,
  "log": [
    "Active session found: session_123",
    "Game ID: game_456",
    "Session started: 2025-01-27T10:00:00Z",
    "Validation check 1: Passed",
    "Validation check 2: Passed"
  ]
}
```

## Step 7: Test in Browser

You can also test these endpoints in your browser:

1. **Check readiness:**
   - http://localhost:3000/api/casino/self-validate

2. **Fetch games:**
   - http://localhost:3000/api/casino/games
   - http://localhost:3000/api/casino/games?expand=tags,images

## Troubleshooting

### Error: "Casino API configuration missing"

**Solution:**
- Check your `.env` file exists
- Verify all variables are set (especially `CASINO_MERCHANT_ID`)
- Restart your Next.js server

### Error: "Casino API request failed: 401 Unauthorized"

**Possible causes:**
- Wrong Merchant ID
- Wrong Merchant Key
- Incorrect X-Sign calculation

**Solution:**
1. Double-check your Merchant ID and Key
2. Verify they match what Slotegrator provided
3. Check the error logs for more details

### Error: "Casino API request failed: 400 Bad Request"

**Possible causes:**
- Invalid API URL format
- Missing required parameters

**Solution:**
1. Verify `CASINO_API_BASE_URL` is correct
2. Check that it doesn't have a trailing slash (code handles this)
3. Review the API documentation

### Error: "No active game session found"

**Solution:**
- This is expected if you haven't launched a game yet
- Self-validation requires an active session (opened within 15 minutes)
- You can still test fetching games without self-validation

## Next Steps After Self-Validation

Once self-validation passes:

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

## Quick Test Commands

```bash
# 1. Check configuration
curl http://localhost:3000/api/casino/self-validate

# 2. Fetch games (once Merchant ID is set)
curl http://localhost:3000/api/casino/games

# 3. Run self-validation
curl -X POST http://localhost:3000/api/casino/self-validate

# 4. Test with expansions
curl "http://localhost:3000/api/casino/games?expand=tags,images,parameters"
```

## Summary

1. ✅ ngrok is working
2. ⏳ Get Merchant ID from Slotegrator
3. ⏳ Add Merchant ID to `.env`
4. ⏳ Restart Next.js server
5. ⏳ Test fetching games: `GET /api/casino/games`
6. ⏳ Run self-validation: `POST /api/casino/self-validate`
7. ⏳ Implement callback endpoint
8. ⏳ Complete game initialization

**Current Status:** Waiting for Merchant ID to proceed with testing!

