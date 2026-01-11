# Casino Callback Implementation

## ✅ Implementation Complete

The callback endpoint has been implemented at `/api/casino/callback` to handle all Slotegrator Game Aggregator callbacks.

## 📋 What Was Implemented

### 1. **Callback Endpoint** (`/api/casino/callback`)
   - Handles all callback types: `balance`, `bet`, `win`, `refund`, `rollback`
   - Validates X-Sign authentication
   - Processes transactions idempotently
   - Updates wallet balance
   - Stores transactions in database
   - Returns proper JSON responses

### 2. **Database Migration** (`009_casino_transactions.sqlite.sql`)
   - Creates `casino_transactions` table
   - Tracks all casino transactions for idempotency
   - Stores transaction metadata
   - Indexes for performance

### 3. **Callback Handlers**

#### **Balance Handler**
- Returns current player balance
- Used by Slotegrator to check player funds

#### **Bet Handler**
- Deducts bet amount from player balance
- Checks for sufficient funds
- Stores transaction for idempotency
- Creates wallet transaction record

#### **Win Handler**
- Credits win amount to player balance
- Stores transaction for idempotency
- Creates wallet transaction record

#### **Refund Handler**
- Refunds bet amount to player balance
- Handles bet transaction references
- Stores transaction for idempotency

#### **Rollback Handler**
- Rolls back multiple transactions (bet, win, refund)
- Processes rollback_transactions array
- Updates wallet balance accordingly
- Marks original transactions as reversed

## 🔒 Security Features

1. **X-Sign Validation**
   - All requests validated using SHA1 HMAC
   - Invalid signatures rejected with 401 error

2. **Idempotency**
   - All transactions checked by `transaction_id`
   - Duplicate transactions return existing result
   - Prevents double processing

3. **Error Handling**
   - Proper error codes (`INSUFFICIENT_FUNDS`, `INTERNAL_ERROR`)
   - Timeout awareness (3 seconds max)
   - Comprehensive logging

## 📊 Database Schema

### `casino_transactions` Table
- `id` - Primary key
- `transaction_id` - Slotegrator transaction ID (unique, for idempotency)
- `user_id` - Player ID
- `session_id` - Game session ID
- `game_uuid` - Game UUID
- `action` - Transaction action (balance, bet, win, refund, rollback)
- `type` - Transaction type (bet, tip, freespin, win, jackpot, etc.)
- `amount` - Transaction amount
- `currency` - Currency code
- `balance_before` - Balance before transaction
- `balance_after` - Balance after transaction
- `round_id` - Round ID (optional)
- `finished` - Is round finished
- `freespin_id` - Freespin campaign ID (if applicable)
- `quantity` - Freespin rounds left (if applicable)
- `bet_transaction_id` - Bet transaction ID to refund (for refunds)
- `rollback_transactions` - JSON array of rolled back transaction IDs
- `status` - Transaction status (pending, completed, failed, reversed)
- `metadata` - JSON metadata
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp
- `processed_at` - Processing timestamp

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
# The migration file is at:
# sql/migrations/009_casino_transactions.sqlite.sql

# Run it using your database migration tool or manually
```

### 2. Configure Callback URL

Ensure your `.env` file has:
```env
CASINO_CALLBACK_URL=https://bozcallback.ngrok.app/api/casino/callback
```

### 3. Test the Endpoint

The callback endpoint is now ready to receive requests from Slotegrator.

## 📝 API Response Format

### Success Responses

**Balance:**
```json
{
  "balance": 57.12
}
```

**Bet/Win/Refund:**
```json
{
  "balance": 27.18,
  "transaction_id": "abcd12345"
}
```

**Rollback:**
```json
{
  "balance": 27.18,
  "transaction_id": "12345",
  "rollback_transactions": ["12346", "12347"]
}
```

### Error Responses

```json
{
  "error_code": "INSUFFICIENT_FUNDS",
  "error_description": "Insufficient funds"
}
```

or

```json
{
  "error_code": "INTERNAL_ERROR",
  "error_description": "Error message"
}
```

## ⚠️ Important Notes

1. **Response Timeout**: Slotegrator waits max 3 seconds for response
2. **Idempotency**: All transactions must be processed only once
3. **Transaction IDs**: Always check `transaction_id` before processing
4. **Balance Updates**: Wallet balance updated atomically
5. **Error Handling**: Return proper error codes for Slotegrator

## 🔍 Testing

To test the callback endpoint:

1. **Start ngrok** (if not already running):
   ```bash
   ngrok http 3000
   ```

2. **Update callback URL** in Slotegrator dashboard to:
   ```
   https://bozcallback.ngrok.app/api/casino/callback
   ```

3. **Launch a game** and play to trigger callbacks

4. **Check logs** for callback requests and responses

## 📚 Related Files

- `app/api/casino/callback/route.ts` - Callback endpoint implementation
- `sql/migrations/009_casino_transactions.sqlite.sql` - Database migration
- `lib/casino-api.ts` - Casino API utilities (X-Sign validation)
- `CASINO_API_DOCUMENTATION.md` - Full API documentation

## ✅ Next Steps

1. Run the database migration
2. Test with a real game session
3. Monitor logs for any issues
4. Verify balance updates are correct
5. Check transaction idempotency

