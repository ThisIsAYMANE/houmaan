# Troubleshooting 500 Error on Self-Validation Endpoint

## The Problem

You're getting a 500 Internal Server Error when accessing:
```
http://localhost:3000/api/casino/self-validate
```

## Common Causes

### 1. Missing `.env` File or Variables

**Check:**
```powershell
# Check if .env exists
Test-Path .env

# Check if CASINO variables are set
Get-Content .env | Select-String -Pattern "CASINO"
```

**Solution:**
1. Create `.env` file if it doesn't exist:
   ```powershell
   Copy-Item env.example .env
   ```

2. Make sure these variables are set:
   ```env
   CASINO_MERCHANT_ID=your-merchant-id
   CASINO_MERCHANT_KEY=b83d51ea35e2620a4e29913a9059e8e5038caa64
   CASINO_API_BASE_URL=https://staging.slotegrator.com/api/index.php/v1
   ```

3. **Restart your Next.js server** after updating `.env`

### 2. Database Table Missing

The `game_sessions` table might not exist.

**Check:**
```powershell
# Check if database file exists
Test-Path data\bcgame.db
```

**Solution:**
- The endpoint now handles missing tables gracefully
- If you get an error, you may need to create the table
- Or the endpoint will work without it (just won't find active sessions)

### 3. Server Not Restarted After .env Changes

**Solution:**
1. Stop your Next.js server (Ctrl+C)
2. Start it again:
   ```powershell
   npm run dev
   ```

### 4. Environment Variables Not Loading

Next.js should load `.env` automatically, but sometimes you need to:
- Make sure `.env` is in the project root (same folder as `package.json`)
- Restart the server
- Check for typos in variable names

## Quick Fix Steps

1. **Verify .env file exists:**
   ```powershell
   Test-Path .env
   ```

2. **If missing, create it:**
   ```powershell
   Copy-Item env.example .env
   ```

3. **Edit .env and set at minimum:**
   ```env
   CASINO_MERCHANT_ID=your-merchant-id
   CASINO_MERCHANT_KEY=b83d51ea35e2620a4e29913a9059e8e5038caa64
   CASINO_API_BASE_URL=https://staging.slotegrator.com/api/index.php/v1
   ```

4. **Restart Next.js:**
   ```powershell
   # Stop current server (Ctrl+C)
   npm run dev
   ```

5. **Test again:**
   ```powershell
   curl http://localhost:3000/api/casino/self-validate
   ```

## Expected Response (After Fix)

Once fixed, you should get:

```json
{
  "ready": false,
  "hasActiveSession": false,
  "isConfigured": true,
  "hasRealMerchantId": false,
  "configuration": {
    "merchantId": "⚠️ placeholder value",
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

## Still Getting 500?

1. **Check server logs** - Look at the terminal where `npm run dev` is running
2. **Check browser console** - Open DevTools (F12) and check for errors
3. **Try a simple endpoint** - Test if the server is working:
   ```powershell
   curl http://localhost:3000/api/games
   ```

## Next Steps

Once the endpoint works:
1. Get your Merchant ID from Slotegrator
2. Update `.env` with the real Merchant ID
3. Restart server
4. Test fetching games: `GET /api/casino/games`
5. Run self-validation: `POST /api/casino/self-validate`

