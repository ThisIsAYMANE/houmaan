# How Bitcoin Payments Work Without Smart Contracts

## Overview
This document explains how the system tracks payments, detects amounts, and processes withdrawals **without smart contracts**.

---

## 1. How We Know Money Was Sent

### Method: Blockchain Monitoring (Blockstream API)

We **monitor the Bitcoin blockchain** in real-time to detect when payments are sent to our addresses.

#### Step-by-Step Process:

1. **Generate Unique Address**:
   ```typescript
   // When user creates deposit
   address = "tb1abc123..." // Unique Bitcoin address
   ```

2. **Monitor Address**:
   ```typescript
   // Our system checks Blockstream API every few minutes
   const paymentInfo = await bitcoinAPI.checkAddressForPayments(address)
   ```

3. **Detect Transaction**:
   - Blockstream API tells us: "This address received X satoshis"
   - We get the transaction hash (TX ID)
   - We get the amount sent

4. **Track Confirmations**:
   - We monitor how many blocks have confirmed the transaction
   - Testnet: 1 confirmation = payment confirmed
   - Mainnet: 6 confirmations = payment confirmed

#### Example Flow:
```
User sends 0.001 BTC → Address tb1abc123...
         ↓
Blockstream API detects transaction
         ↓
Our system checks: "Did address tb1abc123... receive payment?"
         ↓
YES! Received 0.001 BTC (100,000 satoshis)
         ↓
Transaction hash: abc123def456...
         ↓
Wait for confirmations (1 for testnet, 6 for mainnet)
         ↓
Payment confirmed → Credit user's wallet
```

---

## 2. How We Know How Much Was Sent

### Transaction Data from Blockstream API

When we check an address, Blockstream API returns:

```json
{
  "chain_stats": {
    "funded_txo_sum": 100000  // Total received in satoshis
  },
  "mempool_stats": {
    "funded_txo_sum": 0  // Pending transactions
  }
}
```

**We calculate:**
```typescript
const totalReceived = chain_stats.funded_txo_sum + mempool_stats.funded_txo_sum
const btcAmount = totalReceived / 100000000  // Convert satoshis to BTC
```

### Real Example:
```typescript
// User sends 0.001 BTC to address
// Blockstream API returns: funded_txo_sum = 100000 satoshis
// We calculate: 100000 / 100000000 = 0.001 BTC
// We credit user's wallet with 0.001 BTC (or converted to their currency)
```

---

## 3. Where Money Is Sent (Deposits)

### Our Bitcoin Wallet

When users deposit:
1. **We generate a unique address** for each deposit
2. **User sends Bitcoin to that address**
3. **Bitcoin goes to OUR wallet** (we control the private keys)
4. **We track which address = which user** in our database

```
User Deposit Flow:
User → Sends BTC → Our Address (tb1abc123...) → Our Wallet
                                              ↓
                                    Tracked in Database:
                                    - Address: tb1abc123...
                                    - User ID: user123
                                    - Amount: 0.001 BTC
                                    - Status: pending → confirmed
```

### Database Tracking:
```sql
-- bitcoin_addresses table
address: "tb1abc123..."
user_id: "user123"
deposit_id: "deposit456"

-- deposits table
id: "deposit456"
user_id: "user123"
address: "tb1abc123..."
btc_amount: 0.001
status: "completed"
```

---

## 4. How Users Cash Out (Withdrawals)

### We Send Bitcoin FROM Our Wallet

When users withdraw:
1. **User requests withdrawal** (e.g., 0.001 BTC to their address)
2. **We verify** they have enough balance
3. **We send Bitcoin** from our wallet to their address
4. **We track the transaction** hash

### Withdrawal Process:

```typescript
// 1. User requests withdrawal
POST /api/payments/withdraw
{
  "amount": 0.001,
  "currency": "BTC",
  "address": "user_wallet_address"
}

// 2. We verify balance
const balance = await getWalletBalance(userId)
if (balance < 0.001) {
  return error("Insufficient balance")
}

// 3. We send Bitcoin from our wallet
const txHash = await sendBitcoin(
  fromAddress: "our_wallet_address",
  toAddress: "user_wallet_address",
  amount: 0.001
)

// 4. We record the transaction
await createWithdrawal({
  userId,
  amount: 0.001,
  address: "user_wallet_address",
  txHash: txHash,
  status: "processing"
})

// 5. Update user's wallet balance
await updateWalletBalance(userId, -0.001)
```

### Withdrawal Flow:
```
User requests withdrawal
         ↓
Verify balance (user has 0.001 BTC in wallet)
         ↓
Send Bitcoin from OUR wallet to USER's address
         ↓
Get transaction hash from Bitcoin network
         ↓
Update withdrawal status: processing → completed
         ↓
Deduct from user's wallet balance
```

---

## 5. Our Bitcoin Wallet Management

### We Need a Bitcoin Wallet

To send withdrawals, we need:
1. **Bitcoin Wallet** (software or service)
2. **Private Keys** (to sign transactions)
3. **Bitcoin Balance** (to send to users)

### Options for Wallet Management:

#### Option 1: Bitcoin Core (Full Node)
- Run your own Bitcoin node
- Full control, but requires significant resources
- Best for high-volume operations

#### Option 2: Bitcoin Wallet Service
- Use services like:
  - **BlockCypher** (API for wallet management)
  - **BitGo** (Enterprise wallet)
  - **Coinbase Commerce** (Payment processing)
- Easier to implement, but less control

#### Option 3: HD Wallet (Hierarchical Deterministic)
- Generate addresses from a master seed
- Use libraries like `bitcoinjs-lib`
- Good balance of control and ease

### Current Implementation Status:

**✅ What We Have:**
- Address generation (placeholder - needs real wallet)
- Payment detection (Blockstream API)
- Transaction monitoring
- Confirmation tracking

**❌ What We Need (For Withdrawals):**
- Real Bitcoin wallet integration
- Private key management
- Transaction signing
- Sending Bitcoin to user addresses

---

## 6. Complete Payment Flow

### Deposit Flow:
```
1. User creates deposit request
   → We generate unique address: tb1abc123...
   → User sees QR code with address

2. User sends Bitcoin
   → Sends 0.001 BTC to tb1abc123...
   → Transaction broadcast to Bitcoin network

3. Our system detects payment
   → Blockstream API: "Address tb1abc123... received 100000 satoshis"
   → We calculate: 0.001 BTC
   → Status: pending → processing

4. Wait for confirmations
   → Testnet: 1 confirmation
   → Mainnet: 6 confirmations

5. Credit user's wallet
   → Update database: user balance += 0.001 BTC
   → Create wallet transaction record
   → Status: completed
```

### Withdrawal Flow:
```
1. User requests withdrawal
   → Amount: 0.001 BTC
   → Their address: user_wallet_address

2. Verify balance
   → Check: user has >= 0.001 BTC
   → If yes, proceed

3. Send Bitcoin from our wallet
   → Sign transaction with our private key
   → Broadcast to Bitcoin network
   → Get transaction hash

4. Update records
   → Create withdrawal record
   → Deduct from user balance
   → Status: processing → completed

5. User receives Bitcoin
   → Bitcoin appears in their wallet
   → Transaction confirmed on blockchain
```

---

## 7. Security Considerations

### Deposits (Incoming):
- ✅ **No private keys needed** - we just monitor addresses
- ✅ **Blockchain is public** - anyone can verify transactions
- ✅ **Immutable** - once confirmed, can't be reversed

### Withdrawals (Outgoing):
- ⚠️ **Private keys required** - we need to sign transactions
- ⚠️ **Wallet security critical** - must protect private keys
- ⚠️ **Hot vs Cold wallet** - consider using cold storage for large amounts

### Best Practices:
1. **Hot Wallet**: Small amount for daily withdrawals
2. **Cold Wallet**: Large amount stored offline
3. **Multi-signature**: Require multiple keys for large withdrawals
4. **Rate Limiting**: Limit withdrawal amounts/frequency
5. **KYC/AML**: Verify user identity for large withdrawals

---

## 8. Database Schema

### How We Track Everything:

```sql
-- Deposits (Incoming)
deposits:
  - address: "tb1abc123..." (where user sent Bitcoin)
  - btc_amount: 0.001 (how much they sent)
  - tx_hash: "abc123..." (transaction ID)
  - status: "completed"
  - user_id: "user123" (who sent it)

-- Withdrawals (Outgoing)
withdrawals:
  - address: "user_wallet_address" (where we send Bitcoin)
  - amount: 0.001 (how much we send)
  - tx_hash: "def456..." (our transaction ID)
  - status: "completed"
  - user_id: "user123" (who requested it)

-- Wallet Balance (Internal)
wallets:
  - user_id: "user123"
  - balance: 0.001 (their current balance)
  - currency: "BTC"
```

---

## 9. Summary

### Deposits (How We Receive Money):
1. ✅ Generate unique address per deposit
2. ✅ Monitor blockchain via Blockstream API
3. ✅ Detect when Bitcoin arrives
4. ✅ Calculate amount from transaction data
5. ✅ Wait for confirmations
6. ✅ Credit user's wallet

### Withdrawals (How Users Cash Out):
1. ⚠️ User requests withdrawal
2. ⚠️ Verify they have balance
3. ⚠️ Send Bitcoin from OUR wallet to THEIR address
4. ⚠️ Track transaction hash
5. ⚠️ Deduct from user balance

### Key Points:
- **No smart contracts needed** - we use blockchain monitoring
- **Blockchain is public** - we can see all transactions
- **We control our wallet** - we send Bitcoin for withdrawals
- **Database tracks everything** - addresses, amounts, users

---

## 10. Next Steps for Withdrawals

To implement withdrawals, you need:

1. **Bitcoin Wallet Integration**:
   - Choose wallet solution (Bitcoin Core, BlockCypher, etc.)
   - Set up private key management
   - Implement transaction signing

2. **Withdrawal API**:
   - Create `/api/payments/withdraw` endpoint
   - Verify user balance
   - Send Bitcoin to user address
   - Track transaction

3. **Security**:
   - Secure private key storage
   - Rate limiting on withdrawals
   - KYC/AML verification
   - Hot/cold wallet separation

4. **Monitoring**:
   - Track withdrawal transactions
   - Monitor wallet balance
   - Alert on failed transactions

---

## Questions?

- **Q: How do we know the exact amount?**  
  A: Blockstream API tells us how many satoshis were sent to each address.

- **Q: What if user sends wrong amount?**  
  A: We credit exactly what they sent. If it's less than requested, deposit stays "pending" until they send more.

- **Q: Can users withdraw to any address?**  
  A: Yes, as long as they have balance. You can add KYC/AML checks for security.

- **Q: What if our wallet runs out of Bitcoin?**  
  A: Withdrawals would fail. You need to maintain sufficient balance in your wallet.

- **Q: How do we prevent double-spending?**  
  A: Bitcoin network prevents this. Once a transaction is confirmed, it can't be reversed.

