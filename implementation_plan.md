# Shartbandee Comprehensive Testing Plan

## 1. Automated Testing Strategy

### Unit Tests (Jest / React Testing Library)
- **What to test**: Core logic, isolated functions, and individual React components.
- **Tools**: Jest (already installed) and React Testing Library.
- **Coverage areas**:
  - `lib/wallet.ts`: Balance calculations, locking/unlocking funds.
  - `lib/auth.ts`: Session validation, JWT token decoding.
  - `components/wallet/CryptoPaymentModal.tsx`: Render states, tab switching, form validation.
  - API utilities: `lib/api-response.ts`, `lib/errors.ts`.

### Integration Tests (Jest / TSX Scripts)
- **What to test**: Interaction between API routes, Database, and external services.
- **Tools**: Existing `tsx` scripts (e.g. `test:phase2`, `test:usdt`) and Jest.
- **Coverage areas**:
  - **Database Integration**: Seed a test DB, hit `/api/wallet/transactions`, verify DB updates.
  - **Crypto Deposits**: Run `test:usdt-integration.ts` to mock blockchain callbacks and ensure user balances update.
  - **Withdrawals**: Call `/api/wallet/withdraw` and verify `withdrawals` table inserts and wallet deducts.
  - **Admin Actions**: Hit protected `/api/admin/*` endpoints and verify unauthorized users are rejected.

### End-to-End (E2E) Tests (Playwright / Cypress)
- **What to test**: Complete user journeys in a real browser.
- **Tools**: Recommend installing **Playwright** (`npm create playwright`).
- **Coverage areas**:
  - **User Onboarding**: Register → Verify email (mock) → Login.
  - **Deposit Flow**: Open Deposit Modal → Select USDT → Verify QR Code renders → Connect Wallet (using mock extension) → Submit mock transaction.
  - **Casino Gameplay**: Load a game → Place a bet → Verify balance deducts → Mock win → Verify balance increases.
  - **Sports Betting**: Add selections to BetSlip → Place bet → Mock match settlement → Verify payout.

## 2. Manual Testing Strategy

### Environment Setup
- Run `npm run db:reset` and `npm run db:seed` to prepare a fresh local database.
- Use multiple browsers (Chrome, Safari, Mobile viewports) to test responsive design.

### Feature Verification List

#### A. Authentication & User Profile
- [ ] Sign up with a new email/password.
- [ ] Log out and log back in.
- [ ] View profile and verify medals and stats load correctly.

#### B. UI & Design (Aesthetics)
- [ ] Verify "Shartbandee" branding is consistent (Header, Footer, Sidebar).
- [ ] Check dark mode glassmorphism effects on modals (especially `CryptoPaymentModal`).
- [ ] Verify animations and transitions are smooth.
- [ ] Ensure all top navigation links work (or correctly open modals).

#### C. Crypto Payments (Deposits)
- [ ] Click Deposit → Select **BTC**. Ensure Copy/Paste and QR code render.
- [ ] Select **ETH** or **USDT**. Ensure all 3 tabs work.
- [ ] Test the **Web3 Connect Wallet** button using the MetaMask browser extension on a testnet (e.g., Sepolia or BSC Testnet).
- [ ] Manually simulate a successful blockchain deposit by triggering the webhook/callback API locally via Postman or `curl`. Verify balance increases.

#### D. Withdrawals
- [ ] Open Deposit Modal → Withdraw Tab.
- [ ] Enter a valid destination address and amount.
- [ ] Attempt to withdraw more than the available balance (should error).
- [ ] Submit valid withdrawal. Verify the success message and check the `withdrawals` database table to ensure it is marked as 'pending'.

#### E. Game & Sports Betting
- [ ] Place a test bet on a mock sports match. Ensure `locked_balance` updates correctly.
- [ ] Launch a casino game (if available locally) and verify the wallet integration works correctly.

> [!WARNING]
> **Important Note for Manual Crypto Testing:** When testing crypto flows, make sure you are pointed to a testnet (e.g., Sepolia) or mock the blockchain RPC calls so you do not accidentally spend real funds.

## Open Questions
- Do you want me to set up **Playwright** right now to start writing automated E2E tests for the core flows?
- Should I create a mock blockchain webhook script so you can easily simulate deposits during manual testing?

## User Review Required
Please review this testing strategy. Once approved, I can start implementing the automated tests (like setting up Playwright or expanding the Jest unit tests) or provide you with specific `curl` commands for manual testing.
