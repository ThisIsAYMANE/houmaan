# Casino API Self-Validation Implementation Guide

## Overview

This guide explains how to use the self-validation feature for the Slotegrator Casino API integration. Self-validation allows you to verify that your implementation is correct and that all components are working properly.

## What is Self-Validation?

According to the Casino API documentation, self-validation:
- Allows integrator to check if implementation is correct
- Requires an active game session (opened within 15 minutes)
- Returns validation results with success status and log messages

## Implementation Details

### 1. X-Sign Authentication

The implementation includes a complete X-Sign authentication mechanism:

**Location:** `lib/casino-api.ts`

**Key Functions:**
- `calculateXSign()` - Generates X-Sign for outgoing requests
- `validateXSign()` - Validates X-Sign for incoming requests
- `generateAuthHeaders()` - Creates all required authorization headers

**Algorithm:**
1. Merge request parameters with authorization headers
2. Sort resulting array by key (ascending)
3. Generate URL-encoded query string
4. Use SHA1 HMAC with Merchant Key for signing

### 2. Self-Validation Function

**Location:** `lib/casino-api.ts`

**Function:** `selfValidate()`

This function:
- Makes an authenticated POST request to `/self-validate`
- Uses X-Sign authentication
- Returns `{ success: boolean, log: string[] }`

### 3. API Route

**Location:** `app/api/casino/self-validate/route.ts`

**Endpoints:**
- `POST /api/casino/self-validate` - Run self-validation
- `GET /api/casino/self-validate` - Check validation readiness

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file (see `env.example` for reference):

```env
CASINO_MERCHANT_ID=your-merchant-id
CASINO_MERCHANT_KEY=your-merchant-key
CASINO_API_BASE_URL=https://api.slotegrator.com/api/v1
CASINO_CALLBACK_URL=https://yourdomain.com/api/casino/callback
```

**Where to get credentials:**
- Contact your Slotegrator integration manager
- They will provide:
  1. Merchant ID
  2. Merchant Key
  3. Base API URL

### 2. Database Requirements

Ensure the `game_sessions` table exists with at least these columns:
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT)
- `game_id` (TEXT)
- `session_token` (TEXT)
- `started_at` (TIMESTAMP)

The table should be created when you launch a game via `/api/games/[id]/launch`.

## Usage

### Check Readiness (GET)

Before running validation, check if everything is ready:

```bash
curl http://localhost:3000/api/casino/self-validate
```

**Response:**
```json
{
  "ready": true,
  "hasActiveSession": true,
  "isConfigured": true,
  "activeSession": {
    "id": "session_123",
    "gameId": "game_456",
    "startedAt": "2025-01-27T10:00:00Z"
  },
  "requirements": {
    "activeGameSession": "A game session opened within the last 15 minutes",
    "casinoApiCredentials": "CASINO_MERCHANT_ID, CASINO_MERCHANT_KEY, and CASINO_API_BASE_URL must be set"
  }
}
```

### Run Self-Validation (POST)

**Prerequisites:**
1. Launch a game first via `POST /api/games/[id]/launch`
2. Ensure the session was created within the last 15 minutes
3. Have Casino API credentials configured

**Request:**
```bash
curl -X POST http://localhost:3000/api/casino/self-validate
```

**Success Response:**
```json
{
  "success": true,
  "log": [
    "Active session found: session_123",
    "Game ID: game_456",
    "Session started: 2025-01-27T10:00:00Z",
    "Validation check 1: Passed",
    "Validation check 2: Passed"
  ]
}
```

**Error Response (No Active Session):**
```json
{
  "success": false,
  "log": [
    "No active game session found",
    "Please launch a game first and ensure the session was opened within the last 15 minutes"
  ]
}
```

**Error Response (API Error):**
```json
{
  "success": false,
  "log": [
    "Active session found: session_123",
    "Game ID: game_456",
    "Session started: 2025-01-27T10:00:00Z",
    "Self-validation failed: Casino API request failed: 401 Unauthorized",
    "Please check your Casino API credentials and configuration"
  ]
}
```

## How It Works

### Flow Diagram

```
1. User launches game
   ↓
2. POST /api/games/[id]/launch creates game_sessions record
   ↓
3. User calls POST /api/casino/self-validate
   ↓
4. Route checks for active session (within 15 minutes)
   ↓
5. Route calls selfValidate() from casino-api.ts
   ↓
6. casino-api.ts makes authenticated request to Casino API
   ↓
7. Casino API validates implementation
   ↓
8. Results returned with log messages
```

### Authentication Flow

When making requests to the Casino API:

1. **Generate Headers:**
   - `X-Merchant-Id`: Your merchant ID
   - `X-Timestamp`: Current Unix timestamp
   - `X-Nonce`: Random hex string
   - `X-Sign`: SHA1 HMAC signature

2. **Calculate X-Sign:**
   ```typescript
   // Merge params and headers
   const merged = { ...params, ...headers }
   
   // Sort by key
   const sorted = Object.keys(merged).sort()
   
   // Build query string
   const queryString = sorted.map(k => `${k}=${merged[k]}`).join('&')
   
   // Generate HMAC
   const signature = crypto.createHmac('sha1', merchantKey)
     .update(queryString)
     .digest('hex')
   ```

3. **Send Request:**
   - Include all headers in request
   - Use `application/x-www-form-urlencoded` for POST body
   - Accept `application/json` response

## Troubleshooting

### "No active game session found"

**Solution:**
1. Launch a game via `POST /api/games/[id]/launch`
2. Wait for the session to be created
3. Run self-validation within 15 minutes

### "Casino API request failed: 401 Unauthorized"

**Possible Causes:**
- Invalid Merchant ID
- Invalid Merchant Key
- Incorrect X-Sign calculation
- Expired timestamp (>30 seconds old)

**Solution:**
1. Verify environment variables are set correctly
2. Check that Merchant ID and Key match what Slotegrator provided
3. Ensure system clock is synchronized
4. Check that X-Sign calculation matches the documentation

### "Casino API request failed: 400 Bad Request"

**Possible Causes:**
- Missing required parameters
- Invalid parameter format
- Base URL incorrect

**Solution:**
1. Verify `CASINO_API_BASE_URL` is correct
2. Check that all required parameters are included
3. Review Casino API documentation for parameter requirements

### "Failed to get self-validation information"

**Possible Causes:**
- Database connection issue
- Missing `game_sessions` table

**Solution:**
1. Check database connection
2. Ensure `game_sessions` table exists
3. Verify database migrations have been run

## Testing

### Manual Testing Steps

1. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your Casino API credentials
   ```

2. **Launch a game:**
   ```bash
   curl -X POST http://localhost:3000/api/games/[game-id]/launch \
     -H "Cookie: session=your-session-token"
   ```

3. **Check readiness:**
   ```bash
   curl http://localhost:3000/api/casino/self-validate
   ```

4. **Run validation:**
   ```bash
   curl -X POST http://localhost:3000/api/casino/self-validate
   ```

### Expected Behavior

- ✅ If session exists and API is configured: Returns validation results
- ❌ If no session: Returns error with instructions
- ❌ If API not configured: Returns error about missing credentials
- ❌ If API call fails: Returns error with details

## Next Steps

After successful self-validation:

1. **Implement Callback Endpoints:**
   - Create `/api/casino/callback` route
   - Handle `balance`, `bet`, `win`, `refund`, `rollback` actions
   - Implement idempotency handling

2. **Complete Game Initialization:**
   - Implement full `initializeGameSession()` function
   - Call `POST /games/init` with proper parameters
   - Handle games with and without lobby

3. **Add Transaction Tracking:**
   - Create `casino_transactions` table
   - Track all transactions for idempotency
   - Implement proper error handling

## References

- **Casino API Documentation:** `CASINO_API_DOCUMENTATION.md`
- **Readiness Analysis:** `CASINO_API_READINESS_ANALYSIS.md`
- **API Client:** `lib/casino-api.ts`
- **Self-Validation Route:** `app/api/casino/self-validate/route.ts`

## Support

For issues with:
- **Casino API credentials:** Contact your Slotegrator integration manager
- **Implementation questions:** Review `CASINO_API_DOCUMENTATION.md`
- **Code issues:** Check error logs and database state

