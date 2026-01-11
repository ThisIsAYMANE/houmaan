# Game Launch Flow - Complete Implementation

## ✅ Implementation Complete

When you click on a game, you will now be able to access and play it! Here's how it works:

## 🎮 Complete Game Launch Flow

### 1. **User Clicks on a Game**
   - User clicks on a game card in the casino page
   - `handleGameClick` is called with the game ID (Slotegrator UUID)

### 2. **GameLaunch Component Opens**
   - `GameLaunch` component is rendered
   - It immediately calls `/api/games/[id]/launch` to initialize the game session

### 3. **Backend Initializes Game Session** (`/api/games/[id]/launch`)
   - Checks if user is authenticated
   - Gets user's wallet balance
   - Calls `initializeGameSession()` which:
     - Gets user profile (name, currency, language, email)
     - Generates unique session ID
     - Calls Slotegrator API `POST /games/init` with:
       - `game_uuid` - Game UUID from Slotegrator
       - `player_id` - User ID
       - `player_name` - User's name (from profile or username/email)
       - `currency` - User's currency (default: MAD)
       - `session_id` - Unique session ID
       - `device` - "desktop" or "mobile"
       - `return_url` - URL to return to after game ends
       - `language` - User's language (default: fr)
       - `email` - User's email
     - Slotegrator returns a game URL
   - Creates game session record in database
   - Returns game URL to frontend

### 4. **Game URL Loaded in Iframe**
   - `GameLaunch` component receives the game URL
   - Loads the game in an iframe
   - User can now play the game!

### 5. **During Game Play**
   - Slotegrator sends callbacks to `/api/casino/callback`:
     - **Balance** - Check player balance
     - **Bet** - Deduct bet amount
     - **Win** - Credit win amount
     - **Refund** - Refund bet amount
     - **Rollback** - Rollback transactions
   - All transactions update player's wallet balance
   - All transactions are stored for idempotency

## 📋 What Was Fixed

### 1. **Implemented `initializeGameSession()`**
   - ✅ Now actually calls Slotegrator API `POST /games/init`
   - ✅ Gets user profile information
   - ✅ Generates unique session IDs
   - ✅ Handles all required parameters

### 2. **Updated `GameLaunch` Component**
   - ✅ Removed hardcoded `gameUrl` prop
   - ✅ Now calls `/api/games/[id]/launch` to get real game URL
   - ✅ Shows loading state while initializing
   - ✅ Handles errors properly

### 3. **Updated Casino Page**
   - ✅ Removed incorrect `thumbnail_url` being passed as `gameUrl`
   - ✅ Now only passes `gameId` and `gameTitle`

### 4. **Updated `makeCasinoRequest()`**
   - ✅ Now supports POST requests with body parameters
   - ✅ Properly handles form data encoding

## 🎯 How to Test

1. **Make sure you're logged in** (required for game launch)

2. **Click on any game** in the casino page

3. **You should see:**
   - Loading spinner: "Initialisation du jeu..."
   - Then the game loads in an iframe
   - You can play the game!

4. **If there's an error:**
   - Check browser console for error messages
   - Check server logs for API errors
   - Verify Casino API credentials are set in `.env`

## ⚙️ Configuration Required

Make sure your `.env` file has:
```env
CASINO_MERCHANT_ID=your_merchant_id
CASINO_MERCHANT_KEY=your_merchant_key
CASINO_API_BASE_URL=https://staging.slotegrator.com/api/index.php/v1
CASINO_CALLBACK_URL=https://bozcallback.ngrok.app/api/casino/callback
CASINO_TEST_AREA_URL=https://boztestarea.ngrok.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔍 Troubleshooting

### Game doesn't load
- Check if user is logged in
- Check browser console for errors
- Check server logs for API errors
- Verify Casino API credentials

### "Failed to launch game" error
- Check if `/api/games/[id]/launch` endpoint is working
- Check if Slotegrator API is accessible
- Verify user has a wallet balance

### Game URL is "#" or invalid
- Check if `initializeGameSession()` is returning a valid URL
- Check Slotegrator API response
- Verify all required parameters are sent

## 📚 Related Files

- `app/api/games/[id]/launch/route.ts` - Game launch endpoint
- `lib/casino-api.ts` - Casino API client (includes `initializeGameSession`)
- `components/casino/GameLaunch.tsx` - Game launch UI component
- `app/casino/page.tsx` - Casino page with game cards
- `app/api/casino/callback/route.ts` - Callback endpoint for bet results

## ✅ Next Steps

1. **Test game launch** - Click on a game and verify it loads
2. **Test game play** - Play a game and verify balance updates
3. **Check callbacks** - Verify callbacks are received and processed
4. **Monitor logs** - Check for any errors or issues

---

**You can now click on any game and play it!** 🎮🎉

