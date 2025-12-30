# Quick Test Guide - Phase 2

## Quick Start

### 1. Start the Server
```bash
npm run dev
```

### 2. Run Automated Tests

**Test Deposit Creation:**
```bash
npm run test:phase2:deposit
```

**Test Payment Detection** (after sending Bitcoin):
```bash
npm run test:phase2:payment <depositId>
```

**Test Full Flow** (creates deposit, waits for payment):
```bash
npm run test:phase2:full
```

---

## Manual Testing with curl

### 1. Register/Login
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","username":"testuser"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

**Save the `sessionToken` from response**

### 2. Create Deposit
```bash
curl -X POST http://localhost:3000/api/payments/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"amount":100,"currency":"MAD","network":"testnet"}'
```

**Save the `address` and `depositId` from response**

### 3. Send Testnet Bitcoin
- Go to: https://testnet-faucet.mempool.co/
- Get testnet Bitcoin
- Send to the address from step 2

### 4. Check Payment Status
```bash
curl -X POST http://localhost:3000/api/payments/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"depositId":"YOUR_DEPOSIT_ID"}'
```

### 5. Check Wallet Balance
```bash
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## Expected Results

✅ **Deposit Created:**
- Address generated (starts with `tb1`)
- QR code generated
- BTC amount calculated

✅ **Payment Detected:**
- `hasPayment: true`
- Transaction hash returned
- Confirmations tracked

✅ **Payment Confirmed:**
- `confirmed: true`
- Wallet balance increased
- Transaction in history

---

## Troubleshooting

**"Unauthorized" Error:**
- Make sure you're using the correct session token
- Token might have expired, login again

**Payment Not Detected:**
- Wait 1-2 minutes (Blockstream API delay)
- Verify Bitcoin was sent to correct address
- Check testnet transaction on: https://blockstream.info/testnet/

**Exchange Rate Error:**
- Check internet connection
- CoinGecko API might be rate-limited
- Check cached rates in database

---

## Test Checklist

- [ ] Deposit creation works
- [ ] QR code generated
- [ ] Payment detected after sending Bitcoin
- [ ] Confirmations tracked
- [ ] Wallet credited after confirmation
- [ ] Transaction appears in history

