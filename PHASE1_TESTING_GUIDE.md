# Phase 1 Testing Guide

This guide will walk you through testing all Phase 1 components.

## Prerequisites

1. **Run the migration first**:
   ```bash
   npx tsx scripts/migrate.ts
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

## Testing Steps

### Step 1: Test Database Migration

Verify the migration ran successfully:

```bash
# Check if migration was applied
npx tsx scripts/migrate.ts
```

You should see:
```
✅ Applied 004_wallet_system.sqlite.sql
```

### Step 2: Test Wallet System (Manual API Testing)

#### 2.1 Create a Test User

First, register a test user:
- Go to `http://localhost:3000/register`
- Create an account with email: `test@example.com`
- Password: `TestPassword123!`

Or use the API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "username": "testuser"
  }'
```

#### 2.2 Login to Get Session Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

Save the `sessionToken` from the response.

#### 2.3 Test Wallet Balance API

```bash
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "balance": 0,
    "bonusBalance": 0,
    "lockedBalance": 0,
    "currency": "MAD"
  }
}
```

#### 2.4 Test Transaction History API

```bash
curl -X GET "http://localhost:3000/api/wallet/transactions?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [],
    "total": 0
  }
}
```

### Step 3: Test Wallet Functions (Programmatic)

Create a test script to test wallet functions directly:

```bash
npx tsx tests/test-wallet-manual.ts
```

### Step 4: Test Security Features

#### 4.1 Test Rate Limiting

Try making more than 100 requests in a minute:

```bash
# Run this script multiple times quickly
for i in {1..110}; do
  curl -X GET http://localhost:3000/api/wallet/balance \
    -H "Authorization: Bearer YOUR_SESSION_TOKEN"
  echo "Request $i"
done
```

After 100 requests, you should get a `429 Too Many Requests` response.

#### 4.2 Test Security Headers

```bash
curl -I http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Check for these headers**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: ...`

### Step 5: Test Transaction Creation

We'll create a test script that creates transactions programmatically.

## Test Checklist

- [ ] Migration runs successfully
- [ ] Wallet balance API returns correct initial balance (0)
- [ ] Transaction history API returns empty array initially
- [ ] Rate limiting works (429 after limit)
- [ ] Security headers are present
- [ ] Authentication required (401 without token)
- [ ] Invalid token rejected (401)
- [ ] Wallet created automatically on first access
- [ ] Transactions can be created (via test script)
- [ ] Balance updates after transactions
- [ ] Transaction history shows created transactions

## Automated Test Script

Run the automated test script:

```bash
npm run test:phase1
```

This will test all Phase 1 functionality automatically.

