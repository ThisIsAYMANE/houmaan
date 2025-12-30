# Wallet Authentication Fix

## Issue
Getting 500 error when trying to sign up with MetaMask:
```
POST http://localhost:3000/api/auth/wallet/nonce 500 (Internal Server Error)
```

## Root Cause
The `users` table has `email TEXT UNIQUE NOT NULL`, which means we can't create a user without an email. When generating a nonce for a new wallet user, we need to provide a temporary email.

## Fix Applied

1. **Updated `generateNonce()` function** in `lib/wallet-auth.ts`:
   - Now creates a temporary email for wallet-only users
   - Format: `wallet_{address}_{timestamp}@wallet.temp`
   - Handles email conflicts gracefully
   - Better error messages if migration not run

2. **Improved error handling** in `/api/auth/wallet/nonce`:
   - Better error messages
   - Checks if wallet_address column exists

## Solution

The code now:
- Creates a temporary email for wallet-only accounts
- Users can update their email later if they want
- Handles edge cases (email conflicts, missing columns)

## Testing

Try connecting with MetaMask again. It should work now!

If you still get errors, check:
1. Migration 003 was applied: `npx tsx scripts/migrate.ts`
2. Server logs for specific error messages
3. Browser console for detailed error info


