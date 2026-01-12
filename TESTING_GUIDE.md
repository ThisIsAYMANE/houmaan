# Testing Guide - Currency Fix

## Step-by-Step Testing Instructions

### Step 1: Update Environment Variables

1. **Open your `.env` file** (in the project root)
2. **Add or update** the currency setting:
   ```env
   CASINO_DEFAULT_CURRENCY=USD
   ```
   > **Note**: Use `USD`, `EUR`, `GBP`, or another currency that Slotegrator has enabled for your contract. Check with Slotegrator support if unsure.

3. **Save the file**

### Step 2: Restart Your Next.js Server

1. **Stop the current server** (if running):
   - Press `Ctrl + C` in the terminal where Next.js is running

2. **Start the server again**:
   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```

3. **Wait for the server to start** (you should see "Ready" message)

### Step 3: Update Existing Users (If You Have Any)

If you already have users in the database with `MAD` currency, update them:

**Option A: Using SQLite Command Line**
```bash
# Navigate to your project directory
cd "C:\Users\AYMANE MAALI\OneDrive\Bureau\bc.game-houman"

# Open SQLite database
sqlite3 data/bcgame.db

# Run these SQL commands:
UPDATE user_profiles SET currency = 'USD' WHERE currency = 'MAD';
UPDATE wallets SET currency = 'USD' WHERE currency = 'MAD';

# Verify the update
SELECT user_id, currency FROM user_profiles;
SELECT user_id, currency FROM wallets;

# Exit SQLite
.quit
```

**Option B: Create a Test Script**
Create a file `scripts/update-currency.ts`:
```typescript
import { query } from '../lib/db'

async function updateCurrency() {
  try {
    // Update user profiles
    await query(
      "UPDATE user_profiles SET currency = 'USD' WHERE currency = 'MAD'"
    )
    console.log('✅ Updated user_profiles currency to USD')
    
    // Update wallets
    await query(
      "UPDATE wallets SET currency = 'USD' WHERE currency = 'MAD'"
    )
    console.log('✅ Updated wallets currency to USD')
    
    // Verify
    const profiles = await query('SELECT user_id, currency FROM user_profiles')
    const wallets = await query('SELECT user_id, currency FROM wallets')
    
    console.log('\n📊 User Profiles:')
    console.table(profiles.rows)
    console.log('\n📊 Wallets:')
    console.table(wallets.rows)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateCurrency()
```

Then run:
```bash
npx tsx scripts/update-currency.ts
```

### Step 4: Test Game Launch

#### Option A: Test with New User (Recommended)

1. **Open your browser** and go to: `http://localhost:3000`

2. **Register a new account**:
   - Click "Inscrivez-vous" or go to `/register`
   - Fill in:
     - Email: `test@example.com`
     - Password: `Test123!`
     - Username: `testuser` (optional)
   - Click "S'inscrire"

3. **After registration**, you should be automatically logged in

4. **Go to the Casino page**: `http://localhost:3000/casino`

5. **Click on any game** to launch it

6. **Expected Result**:
   - ✅ Game should launch successfully
   - ✅ No "currency not enabled" error
   - ✅ Game iframe should load

#### Option B: Test with Existing User

1. **Login** with an existing account (if you have one)

2. **Go to Casino page**: `http://localhost:3000/casino`

3. **Click on any game**

4. **Expected Result**: Same as Option A

### Step 5: Verify in Browser Console

1. **Open Browser Developer Tools**:
   - Press `F12` or `Ctrl + Shift + I`
   - Go to the **Console** tab

2. **Look for**:
   - ✅ No error messages about currency
   - ✅ Game launch should show success
   - ✅ If there's an error, it should be different (not currency-related)

3. **Check Network Tab**:
   - Go to **Network** tab
   - Click on a game
   - Look for the `/api/games/[id]/launch` request
   - Check the response:
     - ✅ Status should be `200 OK` (not `500`)
     - ✅ Response should contain `gameUrl`

### Step 6: Verify in Server Console

1. **Check your terminal** where Next.js is running

2. **Look for**:
   - ✅ No errors about currency
   - ✅ Game session initialization should succeed
   - ✅ If there's an error, check the detailed error message

### Step 7: Test Different Scenarios

#### Test 1: New User Registration
- ✅ New user should get USD currency
- ✅ Wallet should be created with USD

#### Test 2: Game Launch
- ✅ Game should launch without currency error
- ✅ Game URL should be returned from Slotegrator

#### Test 3: Multiple Games
- ✅ Try launching different games
- ✅ All should work with USD currency

## Troubleshooting

### If You Still Get Currency Error

1. **Check environment variable**:
   ```bash
   # In your terminal, check if the variable is set
   echo $CASINO_DEFAULT_CURRENCY
   # Or in PowerShell:
   echo $env:CASINO_DEFAULT_CURRENCY
   ```

2. **Verify `.env` file**:
   - Make sure `CASINO_DEFAULT_CURRENCY=USD` is in your `.env` file
   - Make sure there are no spaces around the `=` sign
   - Make sure the file is saved

3. **Restart server**:
   - Stop the server completely
   - Start it again
   - Environment variables are loaded on server start

4. **Check user currency in database**:
   ```sql
   SELECT user_id, currency FROM user_profiles WHERE user_id = 'YOUR_USER_ID';
   SELECT user_id, currency FROM wallets WHERE user_id = 'YOUR_USER_ID';
   ```

5. **Check Slotegrator contract**:
   - Contact Slotegrator support
   - Ask which currencies are enabled for your contract
   - Use one of those currencies

### If You Get a Different Error

1. **Check browser console** for the error message
2. **Check server console** for detailed error logs
3. **Share the error message** so we can help debug

### Common Issues

**Issue**: "Currency still MAD in database"
- **Solution**: Run the SQL update commands (Step 3)

**Issue**: "Environment variable not loading"
- **Solution**: 
  - Make sure `.env` file is in the project root
  - Restart the server
  - Check for typos in variable name

**Issue**: "USD not enabled either"
- **Solution**: 
  - Contact Slotegrator to enable USD
  - Or use a different currency that is enabled (EUR, GBP, etc.)
  - Update `CASINO_DEFAULT_CURRENCY` in `.env`

## Success Criteria

✅ **Test is successful if**:
- No "currency not enabled" error
- Game launches successfully
- Game iframe loads
- No errors in browser console
- No errors in server console

## Quick Test Checklist

- [ ] Added `CASINO_DEFAULT_CURRENCY=USD` to `.env`
- [ ] Restarted Next.js server
- [ ] Updated existing users (if any) to USD
- [ ] Registered a new user or logged in
- [ ] Went to casino page
- [ ] Clicked on a game
- [ ] Game launched successfully
- [ ] No currency errors in console

## Next Steps After Successful Test

1. **Update production environment**:
   - Add `CASINO_DEFAULT_CURRENCY` to your production `.env`
   - Restart production server

2. **Update existing production users** (if needed):
   - Run the SQL update on production database

3. **Monitor for any issues**:
   - Check logs for currency-related errors
   - Verify game launches are working

