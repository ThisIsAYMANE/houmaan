# Crypto Wallet Authentication Implementation

## Overview
This project now supports crypto wallet authentication alongside email/password authentication. Users can connect their wallets (MetaMask, WalletConnect, Coinbase, TrustWallet, etc.) to create accounts or log in.

## What Was Implemented

### 1. Database Changes
- **Migration File**: `sql/migrations/003_add_wallet_auth.sqlite.sql`
  - Added `wallet_address` column (unique) to `users` table
  - Added `nonce` column for signature verification
  - Added `nonce_expires_at` column for nonce expiration
  - Created index on `wallet_address` for faster lookups

**To apply the migration, run:**
```bash
npx tsx scripts/migrate.ts
```

### 2. Backend API Routes
- **`/api/auth/wallet/nonce`** (POST)
  - Generates a unique nonce for wallet signature
  - Accepts: `{ walletAddress: string }`
  - Returns: `{ nonce: string }`

- **`/api/auth/wallet/verify`** (POST)
  - Verifies wallet signature and creates/authenticates user
  - Accepts: `{ walletAddress: string, signature: string, nonce: string }`
  - Returns: `{ user: {...}, sessionToken: string, isNewUser: boolean }`

### 3. Frontend Components

#### Wallet Icons Component
- **`components/auth/WalletIcons.tsx`**
  - Provides wallet icons for different providers
  - Uses emoji-based icons for better compatibility

#### Wallet Connection Hook
- **`hooks/useWallet.ts`**
  - React hook for wallet connection
  - Functions:
    - `connectWallet()`: Connects to MetaMask/wallet
    - `signMessage(message)`: Signs a message with wallet
    - `disconnect()`: Disconnects wallet

#### Wallet Connect Button
- **`components/auth/WalletConnectButton.tsx`**
  - Reusable button component for wallet connection
  - Handles full authentication flow:
    1. Connect wallet
    2. Get nonce from server
    3. Sign message
    4. Verify signature
    5. Create/login user

### 4. Updated UI Components

#### Login Modal
- **`components/auth/LoginModal.tsx`**
  - Added wallet connection buttons
  - Shows 4 wallet options: MetaMask, WalletConnect, Coinbase, TrustWallet
  - Wallet buttons are functional and trigger authentication

#### Signup Form
- **`components/auth/SignupForm.tsx`**
  - Added wallet connection buttons
  - Same wallet options as login
  - Automatically creates account on first wallet connection

## How It Works

### Authentication Flow

1. **User clicks wallet button** (e.g., "MetaMask")
2. **Frontend connects to wallet** using `ethers.js`
3. **Backend generates nonce** - unique message for this session
4. **User signs message** - wallet prompts user to sign
5. **Backend verifies signature** - ensures wallet owns the address
6. **Account created/logged in** - user is authenticated

### Security Features

- **Nonce expiration**: Nonces expire after 10 minutes
- **Signature verification**: Uses cryptographic signature verification
- **Unique wallet addresses**: One wallet = one account
- **Session management**: Same session system as email/password auth

## Supported Wallets

Currently supports any wallet that implements the Ethereum Provider API (EIP-1193):
- ✅ MetaMask
- ✅ WalletConnect (via MetaMask)
- ✅ Coinbase Wallet
- ✅ TrustWallet
- ✅ Any EIP-1193 compatible wallet

## Usage Example

```tsx
import WalletConnectButton from '@/components/auth/WalletConnectButton'

<WalletConnectButton
  walletName="MetaMask"
  isLogin={true}
  onSuccess={() => {
    // User authenticated successfully
    router.push('/dashboard')
  }}
/>
```

## Dependencies Added

- `ethers` - Ethereum library for wallet interaction

## Notes

- Email is now optional for users (wallet-only accounts are supported)
- Users can link email to wallet accounts later
- Wallet addresses are stored in lowercase for consistency
- The same wallet can be used for both login and signup (auto-detects)

## Future Enhancements

- Link wallet to existing email accounts
- Support for multiple wallets per account
- Wallet balance display
- Support for other blockchains (Polygon, BSC, etc.)



