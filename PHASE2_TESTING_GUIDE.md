# Phase 2: Bitcoin Payment System - Testing Guide

## Overview
This guide will help you test all Phase 2 Bitcoin payment features.

## Prerequisites

1. **Testnet Bitcoin Wallet** (for sending test payments):
   - Install a Bitcoin testnet wallet (e.g., Electrum, BlueWallet)
   - Get testnet Bitcoin from a faucet: https://testnet-faucet.mempool.co/

2. **API Testing Tool**:
   - Postman, Insomnia, or curl
   - Or use the provided test scripts

3. **User Account**:
   - Register/login to get a session token
   - You'll need this for authenticated API calls

## Testing Steps

### Step 1: Get Authentication Token

First, you need to authenticate and get a session token.

**Register a new user** (if needed):
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123456",
  "username": "testuser"
}
```

**Login**:
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123456"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "sessionToken": "your-session-token-here"
  }
}
```

Save the `sessionToken` for subsequent requests.

---

### Step 2: Create a Bitcoin Deposit

**Request**:
```bash
POST http://localhost:3000/api/payments/deposit
Authorization: Bearer YOUR_SESSION_TOKEN
Content-Type: application/json

{
  "amount": 100,
  "currency": "MAD",
  "network": "testnet"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "depositId": "abc123...",
    "address": "tb1...",
    "amount": 100,
    "currency": "MAD",
    "btcAmount": 0.00123456,
    "paymentURL": "bitcoin:tb1...?amount=0.00123456&label=Deposit%20100%20MAD",
    "qrCode": "data:image/png;base64,...",
    "expiresAt": "2024-01-01T12:30:00Z",
    "requiredConfirmations": 1,
    "network": "testnet"
  }
}
```

**What to Check**:
- ✅ Deposit ID is returned
- ✅ Bitcoin address is generated (starts with `tb1` for testnet)
- ✅ BTC amount is calculated correctly
- ✅ QR code is generated (base64 image)
- ✅ Payment URL is in BIP21 format
- ✅ Expiration is 30 minutes from now

**Save the `address` and `depositId` for next steps.**

---

### Step 3: Get Deposit Status (Before Payment)

**Request**:
```bash
GET http://localhost:3000/api/payments/deposit?depositId=YOUR_DEPOSIT_ID
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "depositId": "abc123...",
    "amount": 100,
    "currency": "MAD",
    "btcAmount": 0.00123456,
    "address": "tb1...",
    "txHash": null,
    "status": "pending",
    "confirmations": 0,
    "requiredConfirmations": 1,
    "expiresAt": "2024-01-01T12:30:00Z",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**What to Check**:
- ✅ Status is "pending"
- ✅ No transaction hash yet
- ✅ Confirmations are 0

---

### Step 4: Send Testnet Bitcoin Payment

**Using a Testnet Wallet**:

1. Open your testnet Bitcoin wallet (Electrum, BlueWallet, etc.)
2. Send Bitcoin to the address from Step 2
3. Send the exact amount (or more) shown in `btcAmount`
4. Wait for the transaction to be broadcast

**Testnet Faucets**:
- https://testnet-faucet.mempool.co/
- https://bitcoinfaucet.uo1.net/

**Note**: Send a small amount (0.001 BTC or less) for testing.

---

### Step 5: Check Payment Status (After Sending)

**Request**:
```bash
POST http://localhost:3000/api/payments/status
Authorization: Bearer YOUR_SESSION_TOKEN
Content-Type: application/json

{
  "depositId": "YOUR_DEPOSIT_ID"
}
```

**Expected Response** (if payment detected):
```json
{
  "success": true,
  "data": {
    "depositId": "abc123...",
    "hasPayment": true,
    "confirmed": false,
    "confirmations": 0,
    "txHash": "abc123...",
    "amount": 0.00123456
  }
}
```

**What to Check**:
- ✅ `hasPayment` is `true`
- ✅ Transaction hash is returned
- ✅ Amount matches what you sent
- ✅ Status updates to "processing" (check GET deposit endpoint)

**Wait a few minutes and check again** - confirmations should increase:
```json
{
  "hasPayment": true,
  "confirmed": true,
  "confirmations": 1,
  ...
}
```

---

### Step 6: Verify Wallet Balance

After payment is confirmed, check if wallet was credited:

**Request**:
```bash
GET http://localhost:3000/api/wallet/balance
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "balance": 100,
    "bonusBalance": 0,
    "lockedBalance": 0,
    "currency": "MAD"
  }
}
```

**What to Check**:
- ✅ Balance increased by deposit amount (100 MAD)
- ✅ Transaction appears in transaction history

---

### Step 7: Check Transaction History

**Request**:
```bash
GET http://localhost:3000/api/wallet/transactions?limit=10
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "...",
        "type": "deposit",
        "amount": 100,
        "balanceBefore": 0,
        "balanceAfter": 100,
        "status": "completed",
        "description": "Bitcoin deposit - abc123...",
        "createdAt": "2024-01-01T12:05:00Z"
      }
    ],
    "total": 1
  }
}
```

**What to Check**:
- ✅ Deposit transaction appears in history
- ✅ Transaction type is "deposit"
- ✅ Status is "completed"
- ✅ Description includes transaction hash

---

### Step 8: Test Payment Expiration

1. Create a new deposit (Step 2)
2. **Don't send payment**
3. Wait 30 minutes (or manually expire in database)
4. Check deposit status

**Expected**:
- Status should be "expired"
- Address can be reused for new deposits

---

### Step 9: Test Exchange Rate Conversion

Test different currency conversions:

**Test 1: USD to BTC**
```bash
POST http://localhost:3000/api/payments/deposit
Authorization: Bearer YOUR_SESSION_TOKEN
Content-Type: application/json

{
  "amount": 50,
  "currency": "USD",
  "network": "testnet"
}
```

**Test 2: BTC to BTC** (direct)
```bash
POST http://localhost:3000/api/payments/deposit
Authorization: Bearer YOUR_SESSION_TOKEN
Content-Type: application/json

{
  "amount": 0.001,
  "currency": "BTC",
  "network": "testnet"
}
```

**What to Check**:
- ✅ BTC amount calculated correctly
- ✅ Exchange rates are reasonable
- ✅ Rates are cached (check database `exchange_rates` table)

---

### Step 10: Test Multiple Concurrent Deposits

1. Create 3-5 deposits simultaneously
2. Send payments to different addresses
3. Verify all are tracked independently
4. Check all payments are detected

**What to Check**:
- ✅ Each deposit has unique address
- ✅ All payments detected correctly
- ✅ No address reuse
- ✅ All deposits credited correctly

---

## Automated Testing Scripts

Run the provided test scripts:

```bash
# Test deposit creation
npx tsx tests/test-phase2-deposit.ts

# Test payment detection
npx tsx tests/test-phase2-payment.ts

# Test full payment flow
npx tsx tests/test-phase2-full.ts
```

---

## Database Verification

Check database directly:

```sql
-- Check deposits
SELECT * FROM deposits ORDER BY created_at DESC LIMIT 5;

-- Check addresses
SELECT * FROM bitcoin_addresses ORDER BY created_at DESC LIMIT 5;

-- Check payment monitoring
SELECT * FROM payment_monitoring WHERE status = 'active';

-- Check exchange rates
SELECT * FROM exchange_rates ORDER BY cached_at DESC LIMIT 5;

-- Check wallet transactions
SELECT * FROM wallet_transactions WHERE transaction_type = 'deposit' ORDER BY created_at DESC LIMIT 5;
```

---

## Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution**: Make sure you're including the `Authorization: Bearer YOUR_SESSION_TOKEN` header

### Issue: Payment Not Detected
**Solution**: 
- Wait a few minutes (Blockstream API may have delay)
- Check if address is correct
- Verify transaction is confirmed on testnet
- Check payment monitoring status in database

### Issue: Exchange Rate Error
**Solution**:
- Check internet connection
- CoinGecko API may be rate-limited
- Check `exchange_rates` table for cached rates

### Issue: Address Generation Error
**Solution**:
- Currently using placeholder addresses
- For production, integrate real Bitcoin wallet
- Testnet addresses should start with `tb1` or `m/n`

---

## Testing Checklist

- [ ] Create deposit successfully
- [ ] QR code generated correctly
- [ ] Payment URL is valid BIP21 format
- [ ] Deposit status endpoint works
- [ ] Payment detection works (after sending Bitcoin)
- [ ] Confirmations tracked correctly
- [ ] Wallet credited after confirmation
- [ ] Transaction appears in history
- [ ] Payment expiration works (30 minutes)
- [ ] Exchange rate conversion accurate
- [ ] Multiple concurrent deposits work
- [ ] Address reuse prevention works
- [ ] Error handling works (invalid requests)

---

## Next Steps After Testing

1. **UI Components**: Create deposit modal with QR code display
2. **Background Worker**: Set up cron job for payment monitoring
3. **Real Wallet Integration**: Replace placeholder address generation
4. **Notifications**: Add email/SMS notifications for payment confirmations
5. **Mainnet**: Switch to mainnet when ready for production

---

## Support

If you encounter issues:
1. Check server logs for errors
2. Verify database migrations ran successfully
3. Check Blockstream API status
4. Verify testnet Bitcoin was sent correctly
5. Check payment monitoring table in database

