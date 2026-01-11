# Casino API Documentation Summary

## ✅ What the Documentation Covers

### 1. **Accessing Games** ✅
**YES** - The documentation shows how to access games:

- **GET `/games`** - Retrieve Games List
  - Returns all available games for your Merchant ID
  - Supports pagination (50 games per page in production)
  - Returns game UUID, name, image, type, provider, etc.
  - **Location**: Lines 188-278

### 2. **Playing Games** ✅
**YES** - The documentation shows how to launch/play games:

#### Game Launch Flow (Lines 169-180):

**For Games Without Lobby:**
1. Call `POST /games/init` with:
   - `game_uuid` (from `/games`)
   - `player_id`
   - `player_name`
   - `currency`
   - `session_id`
   - Optional: `device`, `return_url`, `language`, `email`
2. Redirect player to the returned URL

**For Games With Lobby:**
1. Call `GET /games/lobby` with `game_uuid` and `currency`
2. Call `POST /games/init` with the `lobby_data` from step 1
3. Redirect player to the returned URL

**Endpoints:**
- **POST `/games/init`** - Initialize Game Session (Lines 369-395)
- **POST `/games/init-demo`** - Initialize Demo Game Session (Lines 397-412)
- **GET `/games/lobby`** - Get Lobby Tables (for live casino games) (Lines 317-365)

### 3. **Getting Bet Results** ✅
**YES** - The documentation shows a complete callback system for bet results:

#### Integrator Callbacks (Lines 720-936):

The Game Aggregator sends POST requests to your callback endpoint during game sessions.

**Callback Types:**

1. **Balance** (Lines 762-777)
   - Called to retrieve player's current balance
   - Returns: `{ "balance": 57.12 }`

2. **Bet** (Lines 779-815)
   - Called when player makes a bet
   - Parameters: `action`, `amount`, `currency`, `game_uuid`, `player_id`, `transaction_id`, `session_id`, `type`, etc.
   - Returns: `{ "balance": 27.18, "transaction_id": "abcd12345" }`
   - **Important**: Process each `transaction_id` only once (idempotent)

3. **Win** (Lines 817-863)
   - Called when player wins
   - Parameters: `action`, `amount`, `currency`, `game_uuid`, `player_id`, `transaction_id`, `session_id`, `type` (win, jackpot, freespin, bonus, etc.)
   - Returns: `{ "balance": 170.21, "transaction_id": "abcd12345" }`
   - **Important**: Process each `transaction_id` only once

4. **Refund** (Lines 865-897)
   - Called when bet needs to be refunded
   - Cancels bet transaction and returns funds
   - Returns: `{ "balance": 27.18, "transaction_id": "abcd12345" }`

5. **Rollback** (Lines 899-935)
   - Cancels whole round or part of session
   - Cancels bet, refund, and win transactions
   - Returns: `{ "balance": 27.18, "transaction_id": "12345", "rollback_transactions": ["12346", "12347"] }`

### 4. **Security** ✅
- All requests use X-Sign authentication (SHA1 HMAC)
- Callbacks must validate X-Sign
- Request timeout: 3 seconds
- Max retry count: 33

### 5. **Transaction Processing Rules** ✅
- All transactions are **idempotent** - process only once
- If transaction already processed, return success with existing transaction ID
- Response timeout: 3 seconds
- Max retry count: 33

---

## 📋 Summary

**YES**, the documentation covers:
- ✅ **Accessing games**: GET `/games`
- ✅ **Playing games**: POST `/games/init` or `/games/init-demo`
- ✅ **Getting bet results**: Callback system (bet, win, refund, rollback)
- ✅ **Balance management**: Balance callback
- ✅ **Security**: X-Sign authentication
- ✅ **Transaction handling**: Idempotent processing

---

## 🔧 What You Need to Implement

1. **Game Launch Endpoint**: Implement `POST /games/init` in your backend
2. **Callback Endpoint**: Implement callback handler at `/api/casino/callback` to receive:
   - Balance requests
   - Bet notifications
   - Win notifications
   - Refund notifications
   - Rollback notifications
3. **Transaction Storage**: Store all transactions with `transaction_id` to ensure idempotency
4. **Balance Management**: Update player balance on bet/win/refund/rollback

---

## 📍 Key Documentation Sections

- **Game Launch Flow**: Lines 169-180
- **GET `/games`**: Lines 188-278
- **POST `/games/init`**: Lines 369-395
- **GET `/games/lobby`**: Lines 317-365
- **Integrator Callbacks**: Lines 720-936
- **Bet Callback**: Lines 779-815
- **Win Callback**: Lines 817-863
- **Transaction Processing**: Lines 960-965

