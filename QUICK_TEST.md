# Quick Testing Guide - Phase 1

## Fastest Way to Test Phase 1

### Step 1: Run Migration
```bash
npx tsx scripts/migrate.ts
```

### Step 2: Start Server
```bash
npm run dev
```

### Step 3: Run Automated Tests

**Option A: Test Wallet Functions (Direct)**
```bash
npm run test:wallet
```

**Option B: Test API Endpoints**
```bash
npm run test:api
```

**Option C: Test Everything**
```bash
npm run test:phase1
```

## Manual Testing (Browser/Postman)

### 1. Register & Login
1. Go to `http://localhost:3000/register`
2. Create account
3. Login at `http://localhost:3000/login`
4. Copy your session token from browser dev tools (Network tab)

### 2. Test Wallet Balance API
```bash
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Transaction History API
```bash
curl "http://localhost:3000/api/wallet/transactions?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Expected Results

✅ **Wallet Balance**: Should return `{"balance": 0, "bonusBalance": 0, "lockedBalance": 0, "currency": "MAD"}`

✅ **Transaction History**: Should return `{"transactions": [], "total": 0}` for new users

✅ **Security Headers**: Check response headers for `X-Content-Type-Options`, `X-Frame-Options`, etc.

✅ **Rate Limiting**: Make 100+ requests quickly, should get 429 after limit

✅ **Authentication**: Request without token should return 401

## Troubleshooting

**Migration fails?**
- Check if database file exists: `data/bcgame.db`
- Check migration logs for errors

**API returns 401?**
- Make sure you're logged in
- Check token is valid
- Token format: `Bearer <token>`

**Rate limit not working?**
- Wait 1 minute for rate limit window to reset
- Check server logs for rate limit messages

