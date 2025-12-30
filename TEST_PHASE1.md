# Phase 1 Testing - Quick Start

## The Migration Issue

The migration is trying to create tables that already exist. The error shows:
```
❌ Migration failed: SqliteError: no such column: bitcoin_address
```

This is because `deposits` and `withdrawals` tables already exist from the initial schema, but with different columns.

## Solution

I've updated the migration to:
1. ✅ Only create NEW tables: `wallet_transactions`, `bonus_balances`, `transaction_reconciliation`
2. ✅ Skip recreating existing tables: `deposits`, `withdrawals` (they already exist)
3. ✅ These will be enhanced in Phase 2 for Bitcoin payments

## How to Test Phase 1

### Step 1: Run Migration (Fixed)
```bash
npx tsx scripts/migrate.ts
```

This should now work! It will only create the new tables.

### Step 2: Test Wallet Functions
```bash
npm run test:wallet
```

This tests:
- Wallet creation
- Balance management
- Transaction creation
- Balance locking/unlocking
- Transaction history
- Balance verification

### Step 3: Test API (Requires Server)
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test API
npm run test:api
```

## What Gets Created

The migration now creates:
- ✅ `wallet_transactions` - Main transaction tracking table
- ✅ `bonus_balances` - Bonus balance management
- ✅ `transaction_reconciliation` - Balance verification

It does NOT recreate:
- ❌ `deposits` - Already exists (will enhance in Phase 2)
- ❌ `withdrawals` - Already exists (will enhance in Phase 2)

## Testing Checklist

After migration succeeds:

- [ ] Migration runs without errors
- [ ] `wallet_transactions` table exists
- [ ] `bonus_balances` table exists
- [ ] `transaction_reconciliation` table exists
- [ ] Wallet functions work (`npm run test:wallet`)
- [ ] API endpoints work (`npm run test:api`)

## Next Steps

Once migration succeeds:
1. Run wallet tests: `npm run test:wallet`
2. Start server and test APIs: `npm run test:api`
3. Review test results
4. Proceed to Phase 2 when ready



