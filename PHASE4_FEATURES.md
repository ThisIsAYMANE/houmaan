# Phase 4: Core Features Implementation

## Overview
All missing core features for Phase 4 have been implemented. This document describes the new features and how to use them.

---

## 1. Betting Limits ✅

### Configuration
Located in `app/api/bets/route.ts`:

```typescript
const BETTING_LIMITS = {
  MIN_BET: 1,              // Minimum bet amount in MAD
  MAX_BET: 100000,         // Maximum bet amount in MAD
  MAX_PAYOUT: 1000000,     // Maximum potential payout in MAD
  USER_MAX_PENDING: 50     // Maximum pending bets per user
}
```

### Features
- ✅ Minimum bet validation
- ✅ Maximum bet validation
- ✅ Maximum payout validation
- ✅ Per-user pending bet limit

---

## 2. Wallet Balance Deduction ✅

### How It Works
1. User places bet
2. System checks wallet balance
3. Amount is deducted immediately
4. If bet placement fails, amount is refunded (rollback)
5. On win, payout is credited back

### API Response
```json
{
  "betId": "abc123",
  "message": "Bet placed successfully",
  "status": "pending",
  "odds": 2.5,
  "potentialWin": 250,
  "newBalance": 750
}
```

---

## 3. Accumulator/Parlay Bets ✅

### How to Place Accumulator Bet

**Request:**
```javascript
POST /api/bets

{
  "betType": "accumulator",
  "amount": 100,
  "currency": "MAD",
  "selections": [
    {
      "matchId": "match1",
      "marketId": "market1",
      "selection": "Real Madrid",
      "odds": 1.5
    },
    {
      "matchId": "match2",
      "marketId": "market2",
      "selection": "Barcelona",
      "odds": 1.8
    }
  ]
}
```

### Odds Calculation
- Single bet: `amount × odds`
- Accumulator: `amount × (odds1 × odds2 × odds3...)`
- Example: 100 MAD × (1.5 × 1.8) = 270 MAD potential win

### Features
- ✅ Minimum 2 selections required
- ✅ Automatic odds multiplication
- ✅ Validates all selections
- ✅ Checks all markets are available

---

## 4. Bet Validation ✅

### Odds Validation
- Checks if odds have changed since user selected them
- Allows 5% tolerance (configurable)
- Returns current odds if changed
- User must accept new odds

**Example:**
```javascript
// User selects odds: 2.0
// Current odds: 2.1 (5% change)
// ✅ Accepted

// User selects odds: 2.0
// Current odds: 2.15 (7.5% change)
// ❌ Rejected - returns new odds
```

### Market Validation
- Checks if market is still active
- Checks if match hasn't started (for pre-match)
- Validates selection exists

---

## 5. Payout Processing System ✅

### Manual Settlement (Admin)

**Settle a bet manually:**
```javascript
POST /api/bets/[betId]/settle

{
  "result": "won",  // won | lost | void | cancelled
  "reason": "Full time score: 2-1"
}
```

### Auto-Settlement

**Settle all bets for a match:**
```javascript
PUT /api/bets/[matchId]/settle

{
  "homeScore": 2,
  "awayScore": 1,
  "status": "finished"
}
```

### Payout Rules
- **Won**: User receives potential_win amount
- **Lost**: User receives nothing (amount already deducted)
- **Void/Cancelled**: User receives original bet amount (refund)

---

## 6. Live Score Updates ✅

### Using the React Hook

```javascript
import { useLiveMatchUpdates } from '@/hooks/useLiveMatchUpdates'

function MatchPage() {
  const { matches, loading, error, refetch } = useLiveMatchUpdates({
    matchIds: ['match1', 'match2'],  // Optional: specific matches
    enabled: true,                    // Optional: enable/disable polling
    pollInterval: 10000               // Optional: polling interval (ms)
  })

  return (
    <div>
      {matches.map(match => (
        <div key={match.id}>
          {match.home_score} - {match.away_score}
          {match.is_live && <span>LIVE {match.match_minute}'</span>}
        </div>
      ))}
    </div>
  )
}
```

### Polling All Live Matches

```javascript
// Don't provide matchIds to get all live matches
const { matches } = useLiveMatchUpdates({
  enabled: true,
  pollInterval: 10000  // Poll every 10 seconds
})
```

### Manual API Call

```javascript
// Get specific matches
GET /api/sports/matches/live-updates?match_ids=match1,match2

// Get all live matches
GET /api/sports/matches/live-updates

// Response:
{
  "matches": [
    {
      "id": "match1",
      "home_score": 2,
      "away_score": 1,
      "match_minute": 67,
      "status": "live",
      "is_live": true,
      "current_score": "2-1",
      "updated_at": "2026-01-02T12:30:45Z"
    }
  ],
  "timestamp": "2026-01-02T12:30:50Z"
}
```

---

## API Usage Examples

### Place Single Bet

```javascript
POST /api/bets

{
  "betType": "single",
  "matchId": "match123",
  "marketId": "market456",
  "marketType": "1x2",
  "selection": "Real Madrid",
  "odds": 1.85,
  "amount": 100,
  "currency": "MAD"
}
```

### Place Accumulator Bet

```javascript
POST /api/bets

{
  "betType": "accumulator",
  "amount": 50,
  "currency": "MAD",
  "selections": [
    {
      "matchId": "match1",
      "marketId": "1x2_market1",
      "selection": "Real Madrid",
      "odds": 1.5
    },
    {
      "matchId": "match2",
      "marketId": "1x2_market2",
      "selection": "Barcelona",
      "odds": 1.8
    },
    {
      "matchId": "match3",
      "marketId": "1x2_market3",
      "selection": "Bayern Munich",
      "odds": 1.4
    }
  ]
}
// Total odds: 1.5 × 1.8 × 1.4 = 3.78
// Potential win: 50 × 3.78 = 189 MAD
```

### Get Betting History

```javascript
// All bets
GET /api/bets

// Only pending bets
GET /api/bets?status=pending

// With pagination
GET /api/bets?limit=20&offset=0
```

---

## Error Handling

### Common Error Responses

**Insufficient Balance:**
```json
{
  "error": "Insufficient balance"
}
```

**Odds Changed:**
```json
{
  "error": "Odds have changed",
  "currentOdds": 2.1,
  "selection": "Real Madrid"
}
```

**Bet Limit Exceeded:**
```json
{
  "error": "Maximum bet is 100000 MAD"
}
```

**Too Many Pending Bets:**
```json
{
  "error": "You have reached the maximum of 50 pending bets"
}
```

---

## Testing Checklist

### Betting Limits
- [ ] Test minimum bet validation
- [ ] Test maximum bet validation
- [ ] Test maximum payout validation
- [ ] Test pending bets limit

### Wallet Integration
- [ ] Test insufficient balance rejection
- [ ] Test successful balance deduction
- [ ] Test rollback on bet failure
- [ ] Test payout credit on win

### Accumulator Bets
- [ ] Test with 2 selections
- [ ] Test with 5+ selections
- [ ] Test odds calculation
- [ ] Test selection validation

### Bet Validation
- [ ] Test odds validation within tolerance
- [ ] Test odds validation exceeding tolerance
- [ ] Test market availability check

### Payout Processing
- [ ] Test manual settlement (won)
- [ ] Test manual settlement (lost)
- [ ] Test manual settlement (void)
- [ ] Test auto-settlement

### Live Updates
- [ ] Test polling for specific matches
- [ ] Test polling for all live matches
- [ ] Test React hook integration
- [ ] Test manual API calls

---

## Phase 4 Status

### ✅ Completed (100%)

1. ✅ Live Betting Interface
2. ✅ Pre-Match Betting
3. ✅ Bet Types (Single + Accumulator)
4. ✅ Odds Management (Basic + Validation)
5. ✅ Betting History
6. ✅ Betting Limits
7. ✅ Wallet Integration
8. ✅ Bet Validation
9. ✅ Payout Processing
10. ✅ Live Score Updates

---

## Next Steps

### Optional Enhancements (Future Phases)
- WebSocket for real-time updates (instead of polling)
- System bets (advanced combinations)
- Cash-out feature
- Bet builder (custom markets)
- Live streaming integration

### Move to Phase 5
Phase 4 is now **100% complete**. You can now move to Phase 5 (Casino Features) or continue with Phase 6 (Sports Betting Advanced Features).

---

## Support

For issues or questions about these features, check:
1. This documentation
2. Code comments in the implementation files
3. API error messages (they're descriptive)

