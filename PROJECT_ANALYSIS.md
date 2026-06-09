# Project Analysis: BC.GAME Clone

## Overview

This project is a Next.js 14 application that implements a BC.GAME-style casino and sports betting platform. It includes a public user-facing app, an admin dashboard, custom authentication, wallet/balance handling, sports betting, casino game launch flows, Slotegrator callback handling, Bitcoin deposits, notifications, and test/migration scripts.

The project is large and ambitious, but it is not currently in a clean production-ready state. The main architecture is understandable, but several parts are inconsistent: the environment files describe Postgres/Redis, while the runtime database layer uses SQLite; authentication is split between bearer tokens and cookies; and the TypeScript build currently fails because of missing dependencies, missing types, and component/API type mismatches.

## High-Level Technology Stack

- Framework: Next.js 14 with App Router
- UI: React 18, Tailwind CSS, lucide-react icons
- Language: TypeScript
- State management: Zustand
- Database runtime: SQLite through `better-sqlite3`
- Database scripts: custom migration and seed scripts using `tsx`
- Authentication: custom email/password and wallet auth, stored in local sessions table
- Password hashing: bcryptjs
- Casino provider: Slotegrator API
- Sports data: The Odds API
- Payments: Bitcoin deposit flow using generated addresses, QR codes, and blockchain monitoring
- Admin: separate `/admin` route group and admin session system
- Tests: Jest-style tests plus custom script-based tests

## Important Project Paths

- `app/`: Next.js pages and API routes.
- `components/`: React UI components for layout, casino, sports, auth, admin, settings, and home page.
- `lib/`: backend and shared business logic.
- `stores/`: Zustand stores.
- `hooks/`: frontend hooks.
- `types/`: shared TypeScript interfaces.
- `sql/migrations/`: SQLite and Postgres migration files.
- `scripts/`: migration, seed, admin creation, and validation scripts.
- `tests/`: custom/manual test scripts.
- `__tests__/`: Jest unit/integration/component/API tests.
- `data/bcgame.db`: local SQLite database.
- `README.md`: mostly design/spec documentation, not an engineering setup guide.
- `env.example`: environment variable sample, currently more Postgres-oriented than the actual runtime.

## Runtime Entry Points

The app starts at `app/layout.tsx`. This imports global CSS, sets metadata, and wraps pages in `ConditionalLayout`.

`components/layout/ConditionalLayout.tsx` checks the current path:

- Routes starting with `/admin` are rendered directly.
- All other routes are wrapped in `MainLayout`.

`components/layout/MainLayout.tsx` provides the public application shell:

- Header
- Sidebar
- Main content area
- Ad banner
- Footer

The public homepage is `app/page.tsx`. It is a client component that loads:

- game categories
- popular games
- BC/original games
- recent wins
- activity rows
- banner data

It calls several internal API routes but also contains mock fallbacks, so the homepage can still render even when provider/database data is unavailable.

## Public User Pages

The main public pages include:

- `/`: home/casino landing page
- `/casino`: casino browsing
- `/games/[id]`: individual casino game page
- `/sports`: sports betting interface
- `/sports/matches/[id]`: match detail page
- `/wallet`: wallet/deposit page
- `/bets`: user bets
- `/notifications`: notifications page
- `/profile`: user profile
- `/settings`: settings
- `/login`: login page
- `/register`: registration page

Most public pages use the shared main layout with the fixed header/sidebar structure.

## Admin Area

Admin pages live under `app/(admin)/admin`.

Key admin pages include:

- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/games`
- `/admin/bets`
- `/admin/payouts`
- `/admin/financial`
- `/admin/reports`
- `/admin/sports`
- `/admin/live-betting`
- `/admin/casino-analytics`
- `/admin/notifications`
- `/admin/settings`

Admin authentication is separate from normal user authentication. Admin sessions are stored in `admin_sessions`, and helper logic lives in `lib/admin-auth.ts` and `lib/admin-middleware.ts`.

Some admin API routes use bearer tokens, while some older code paths check cookies. This should be normalized.

## Database Architecture

The actual database runtime is `lib/db.ts`.

Despite the presence of `pg`, `docker-compose.yml`, and Postgres-oriented environment variables, the active database layer imports `better-sqlite3` and opens a local SQLite file:

```text
data/bcgame.db
```

The database helper exports:

- `db`: singleton SQLite connection
- `query()`: async wrapper around SQLite queries
- `queryOne()`: returns the first row
- `transaction()`: manual SQLite transaction wrapper
- `exec()`: executes raw SQL
- `close()`: closes the DB connection

`query()` accepts both SQLite-style `?` placeholders and Postgres-style `$1`, `$2` placeholders. It translates `$1` style placeholders into `?` before executing.

This compatibility layer makes the code easier to port from Postgres-style examples, but it also hides the fact that the runtime is SQLite.

## Database Schema

The initial SQLite schema is in:

```text
sql/migrations/001_initial_schema.sqlite.sql
```

Major tables:

- `users`
- `user_profiles`
- `sessions`
- `game_categories`
- `game_providers`
- `games`
- `promotional_banners`
- `sports`
- `leagues`
- `matches`
- `betting_markets`
- `odds`
- `user_favorites`
- `recent_games`
- `user_bets`
- `wallets`
- `transactions`
- `deposits`
- `withdrawals`
- `bonuses`
- `rollover_requirements`
- `vip_levels`
- `user_medals`
- `referrals`
- `notifications`

Later migrations add:

- admin roles and `admin_sessions`
- wallet auth columns
- `wallet_transactions`
- bonus balance support
- Bitcoin deposit/payment monitoring tables
- notification preferences
- `casino_transactions`
- `game_sessions`
- recent games FK adjustments

The migration runner is `scripts/migrate.ts`. It prefers `.sqlite.sql` files over generic `.sql` files.

## Authentication Flow

Normal user auth is implemented in `lib/auth.ts`.

Main functions:

- `hashPassword(password)`
- `verifyPassword(password, hashedPassword)`
- `createSession(userId)`
- `getSession(sessionToken)`
- `deleteSession(sessionToken)`
- `deleteUserSessions(userId)`
- `getUserByEmail(email)`
- `getUserById(userId)`
- `createUser(data)`
- `getUserProfile(userId)`

Login route:

```text
app/api/auth/login/route.ts
```

Register route:

```text
app/api/auth/register/route.ts
```

The login API validates input, checks password, creates a session, and returns:

```json
{
  "success": true,
  "data": {
    "user": "...",
    "sessionToken": "..."
  }
}
```

Client auth state is stored in:

```text
stores/auth-store.ts
```

It uses Zustand persist with the storage key `auth-storage`.

## Authentication Inconsistency

There is a major inconsistency in how authenticated routes identify users.

Some API routes expect:

```text
Authorization: Bearer <sessionToken>
```

Examples:

- wallet balance
- wallet transactions
- user profile
- payments/deposit
- auth/session
- auth/logout
- some admin routes

Other API routes still read:

```text
request.cookies.get('session')
```

Examples:

- `app/api/bets/route.ts`
- `app/api/notifications/route.ts`
- `app/api/games/favorites/route.ts`
- `app/api/games/recent/route.ts`
- several notification and cashout routes

There is also frontend code in `app/sports/page.tsx` that reads:

```text
localStorage.getItem('session_token')
```

But the main auth store persists the token inside the Zustand `auth-storage` object, not as a raw `session_token` key.

This means a user can be logged in according to one page and unauthenticated according to another. This should be one of the first things fixed.

## Wallet System

Wallet logic lives in:

```text
lib/wallet.ts
```

Main responsibilities:

- get or create a wallet
- get wallet balance
- create wallet transactions
- lock balance for active bets
- unlock balance
- list transaction history
- verify balance by summing completed transactions

Wallets are stored in the `wallets` table. Wallet transaction history is stored in `wallet_transactions`.

Balances use regular numeric/REAL values. For a gambling/payment app, this is risky because floating point math can drift. A safer production approach would store money in integer minor units or use decimal-safe arithmetic.

## Betting Flow

The main bet placement API is:

```text
app/api/bets/route.ts
```

The intended flow is:

1. Authenticate user.
2. Parse bet request.
3. Validate bet type and required fields.
4. Check user pending bet limit.
5. Validate odds if match/market data exists in the DB.
6. Validate bet limits.
7. Deduct wallet balance.
8. Insert a `user_bets` record.
9. Return bet ID, potential win, and new balance.

Supported bet types include:

- single
- accumulator
- system, partially present in advanced routes

Bet settlement is handled in:

```text
app/api/bets/[id]/settle/route.ts
```

The admin settlement flow:

1. Authenticate admin.
2. Load pending bet.
3. Calculate payout based on result.
4. Update bet status.
5. Credit wallet if payout is greater than zero.

There is also a PUT handler intended for auto-settlement by match result.

## Sports Data Flow

Sports API client:

```text
lib/odds-api.ts
```

Sports transformation logic:

```text
lib/odds-api-transform.ts
```

Sports matches route:

```text
app/api/sports/matches/route.ts
```

Sports page:

```text
app/sports/page.tsx
```

The sports page fetches sports and matches from internal API routes. Those routes call The Odds API when `ODDS_API_KEY` is configured.

`app/api/sports/matches/route.ts` can:

- fetch all active sports
- fetch a specific sport by Odds API key
- map friendly slugs like `football`, `basketball`, and `tennis`
- request `h2h`, `spreads`, and `totals` markets
- transform results into app match objects
- return live/upcoming/finished filtered results

The sports page builds a local bet slip and lets the user add odds selections. However, bet placement currently has an auth mismatch: the page reads `localStorage.session_token`, while the login flow stores the token in Zustand persistence.

## Casino Game Provider Flow

The casino provider integration is centered on Slotegrator.

Main client:

```text
lib/casino-api.ts
```

Main responsibilities:

- read Slotegrator config from env
- calculate outgoing `X-Sign`
- validate incoming callback `X-Sign`
- make authenticated Slotegrator requests
- call `/self-validate`
- fetch games
- fetch merchant limits
- determine enabled providers per currency
- fetch lobby data for lobby-based games
- initialize game sessions

Game listing route:

```text
app/api/games/route.ts
```

This route:

1. Reads query filters.
2. Fetches games from Slotegrator.
3. Fetches enabled providers for USD.
4. Filters games to enabled providers.
5. Maps Slotegrator fields to internal game shape.
6. Applies category/provider/limit filters.
7. Returns games to the frontend.

Game launch route:

```text
app/api/games/[id]/launch/route.ts
```

This route:

1. Authenticates user by bearer token or cookie.
2. Validates the game ID.
3. Confirms the user exists.
4. Reads user currency.
5. Checks provider availability for that currency.
6. Reads wallet balance and bonus balance.
7. Checks whether game requires lobby data.
8. Calls Slotegrator `/games/lobby` if needed.
9. Calls Slotegrator `/games/init`.
10. Creates a `game_sessions` record.
11. Updates `recent_games`.
12. Returns launch URL and session metadata.

## Slotegrator Callback Flow

The callback endpoint is:

```text
app/api/casino/callback/route.ts
```

It handles provider POST callbacks for:

- `balance`
- `bet`
- `win`
- `refund`
- `rollback`

The callback route:

1. Reads form-encoded provider data.
2. Captures `X-*` headers.
3. Validates `X-Sign`.
4. Dispatches to action-specific handlers.
5. Always returns HTTP 200 for provider errors, as Slotegrator expects errors inside the JSON body.

For regular users:

- `balance` returns wallet balance.
- `bet` deducts balance and records `wallet_transactions` plus `casino_transactions`.
- `win` credits balance and records transactions.
- `refund` may credit balance if refunding a bet.
- `rollback` reverses prior casino transactions.

There is also a special in-memory bot state path for Slotegrator self-validation. It tracks a test bot balance, transaction IDs, refunds, wins, bets, and rollbacks in module-level variables. This is useful for passing integration validation, but it is not durable across server restarts.

## Payment and Bitcoin Deposit Flow

Deposit API:

```text
app/api/payments/deposit/route.ts
```

Bitcoin address logic:

```text
lib/bitcoin-address.ts
lib/bitcoin-wallet.ts
lib/bitcoin-qr.ts
lib/payment-detection.ts
lib/bitcoin-api.ts
lib/exchange-rates.ts
```

The intended Bitcoin deposit flow:

1. Authenticated user posts deposit request.
2. Amount and network are validated.
3. Fiat amount is converted to BTC.
4. A new Bitcoin address is generated.
5. A `deposits` row is created.
6. A Bitcoin address row is associated with the deposit.
7. Payment monitoring is started.
8. A BIP21 payment URL and QR code are returned.
9. Monitoring checks blockchain transactions.
10. When confirmed, the wallet is credited through `createTransaction()`.

The implementation imports dependencies that are currently missing from `package.json`, including `bip32` and `qrcode`.

## Notifications

Notifications are handled by:

```text
app/api/notifications/route.ts
app/api/notifications/[id]/route.ts
app/api/notifications/mark-all-read/route.ts
lib/notifications.ts
components/layout/NotificationBell.tsx
```

The notification API supports:

- fetching notifications
- unread count
- creating notifications
- marking one/all as read

There is a schema concern: some routes use a `data` column in `notifications`, while the initial schema does not include that column. Later migrations may cover this, but it should be verified against a fresh migration run.

## Frontend Component Structure

Major UI component groups:

- `components/layout`: header, sidebar, footer, profile dropdown, notification bell.
- `components/home`: banners, search, categories, game activity table.
- `components/games`: game cards and carousels.
- `components/casino`: casino-specific sections, recent games, game launch/history.
- `components/sports`: match cards, carousels, bet slip, search, action bars.
- `components/auth`: login/signup/wallet connect/profile modals.
- `components/admin`: admin sidebar/header/modals.
- `components/settings`: theme and language controls.

The visual design is dark, green-accented, French-language, and heavily inspired by BC.GAME.

## Environment Variables

Important variables in `env.example`:

- `DATABASE_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `REDIS_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `SPORTS_API_KEY`
- `SPORTS_API_URL`
- `ODDS_API_KEY`
- `ODDS_API_BASE_URL`
- `CASINO_MERCHANT_ID`
- `CASINO_MERCHANT_KEY`
- `CASINO_API_BASE_URL`
- `CASINO_CALLBACK_URL`
- `CASINO_TEST_AREA_URL`
- `CASINO_DEFAULT_CURRENCY`

Important mismatch: `DATABASE_URL`, Postgres, and Redis settings do not match the current SQLite runtime in `lib/db.ts`.

## Available NPM Scripts

From `package.json`:

- `npm run dev`: start Next.js dev server
- `npm run dev:admin`: start dev server on port 3001
- `npm run build`: production build
- `npm run start`: start production app
- `npm run lint`: Next lint
- `npm run type-check`: TypeScript check
- `npm run db:migrate`: run SQLite migrations
- `npm run db:seed`: seed database
- `npm run db:reset`: reset database
- `npm run admin:create`: create admin
- `npm run test`: custom test runner
- `npm run test:unit`: Jest
- `npm run test:all`: unit tests plus phase 2 deposit test
- `npm run docker:up`: start Postgres/Redis containers
- `npm run docker:down`: stop containers

On Windows PowerShell, `npm` may fail because script execution is disabled. Use:

```powershell
npm.cmd run type-check
```

instead of:

```powershell
npm run type-check
```

## Current Verification Result

I ran:

```powershell
npm.cmd run type-check
```

It failed.

Major error categories:

- Jest globals such as `jest`, `describe`, `it`, and `expect` are not recognized in many test files.
- Missing modules or types:
  - `better-sqlite3`
  - `bip32`
  - `qrcode`
  - `ethers`
  - `@web3icons/react`
  - `react-icons/si`
  - `@testing-library/react`
  - `@jest/globals`
  - `uuid` types
- Component prop mismatches.
- Duplicate identifiers in `components/casino/TVGamesCarousel.tsx`.
- Recharts type errors.
- Zod errors passed into `ValidationError` where `Record<string, string>` is expected.
- Several `unknown`, nullable, and incompatible interface errors.
- `app/api/auth/wallet/verify/route.ts` imports `createSession` from `wallet-auth`, but that module does not export it.
- `lib/client-cache.ts` references an undefined `entry`.

The project should not be considered build-clean until these are fixed.

## Startup Attempt Log

### Issue: PowerShell `Start-Process` failed before starting Next.js

Observed while trying to start the dev server with `Start-Process -FilePath npm.cmd`.

Error:

```text
Start-Process : L'élément a déjà été ajouté. Clé du dictionnaire : 'Path' Clé ajoutée : 'PATH'
```

Cause:

On this Windows/PowerShell environment, the process environment appears to contain both `Path` and `PATH`. `Start-Process` tries to build an environment dictionary with case-insensitive keys, so the duplicate path variables collide before `npm.cmd` starts.

Solution:

Avoid this specific `Start-Process npm.cmd` path in this shell. Use `npm.cmd` directly for foreground checks, or launch through an invocation that does not trigger the duplicate environment dictionary issue. Also prefer `npm.cmd` over `npm` on this machine because PowerShell script execution policy blocks `npm.ps1`.

### Issue: Foreground dev server starts correctly but is killed by command timeout

Observed while running:

```powershell
npm.cmd run dev
```

Result:

```text
Next.js 14.2.35
Local: http://localhost:3000
Starting...
Ready in 3.7s
```

The command itself did not fail. The shell tool timed out after 30 seconds because a dev server is a long-running foreground process, and that timeout terminated the server. A later port check showed that `localhost:3000` was no longer listening.

Solution:

For verification, `npm.cmd run dev` is the correct command and the app can reach the Next.js ready state. For a persistent background server in this Windows environment, use a detached process launcher that avoids PowerShell `Start-Process`, such as `Win32_Process.Create`, and redirect logs to a file.

### Issue: PowerShell environment provider also fails because of duplicate `Path`/`PATH`

Observed while trying to inspect environment variables:

```powershell
Get-ChildItem Env:
```

Error:

```text
Get-ChildItem : Un élément avec la même clé a déjà été ajouté.
```

Cause:

Same duplicate environment variable collision as the `Start-Process` issue.

Solution:

Do not rely on `Get-ChildItem Env:` or `Start-Process` in this shell until the duplicate environment key is cleaned up. Use direct command execution or a lower-level process creation method.

### Issue: Homepage returns HTTP 500 because `@web3icons/react` is missing

Observed after the dev server reached the ready state and `http://localhost:3000` was requested.

Error:

```text
Module not found: Can't resolve '@web3icons/react'
Import trace:
./components/auth/WalletConnectButton.tsx
./components/auth/LoginModal.tsx
./components/layout/ProfileDropdown.tsx
./components/layout/Header.tsx
./components/layout/MainLayout.tsx
./components/layout/ConditionalLayout.tsx
```

Failing file:

```text
components/auth/WalletIcons.tsx
```

Cause:

`WalletIcons.tsx` imports wallet icons from `@web3icons/react`, but that package is not declared in `package.json` and is not installed in `node_modules`.

Solution:

Either install and declare the missing icon dependency, or remove the dependency and replace those wallet icons with an existing installed icon set such as `lucide-react`. Since this project already uses `lucide-react`, replacing the wallet icon wrapper with local/lucide icons is the lower-risk fix if exact branded wallet icons are not required.

Applied fix:

`components/auth/WalletIcons.tsx` was rewritten to use only `lucide-react`, removing imports from both `@web3icons/react` and `react-icons/si`.

### Issue: Homepage returns HTTP 500 because `ethers` is missing in the client wallet hook

Observed after fixing wallet icons and requesting `http://localhost:3000` again.

Error:

```text
Module not found: Can't resolve 'ethers'
Failing file: hooks/useWallet.ts
Import trace:
./components/auth/WalletConnectButton.tsx
./components/auth/LoginModal.tsx
./components/layout/ProfileDropdown.tsx
./components/layout/Header.tsx
./components/layout/MainLayout.tsx
./components/layout/ConditionalLayout.tsx
```

Cause:

`hooks/useWallet.ts` imports `ethers`, but `ethers` is not declared in `package.json` and is not installed.

Solution:

For the client-side wallet connection hook, `ethers` is not strictly required. The browser wallet provider can be used directly through the EIP-1193 `window.ethereum.request()` API for `eth_accounts`, `eth_requestAccounts`, and `personal_sign`. This removes a startup-blocking dependency from the public layout.

Applied fix:

`hooks/useWallet.ts` was rewritten to use `window.ethereum` directly instead of importing `ethers`. Note that `lib/wallet-auth.ts` still imports `ethers` for server-side signature verification, so wallet-login API verification still needs either the `ethers` dependency installed or a server-side replacement implementation before that specific feature works.

### Issue: In-app browser verification failed because the browser automation runtime cannot access `AppData`

Observed while trying to open `http://localhost:3000` through the Codex in-app browser after the homepage started returning HTTP 200.

Error summary:

```text
EPERM: operation not permitted, lstat 'C:\Users\LENOVO\AppData'
node_repl kernel exited unexpectedly
```

Cause:

The browser automation runtime attempted to resolve or inspect a path under `C:\Users\LENOVO\AppData`, which is outside the current writable workspace/sandbox permissions.

Solution:

Continue verification with direct HTTP checks such as `Invoke-WebRequest` and `curl.exe`, or run browser automation with permissions that allow the browser runtime to access its required app data paths. This is a tooling/sandbox issue, not an application code issue.

### Issue: Homepage API requests return HTTP 500 because `better-sqlite3` is missing

Observed after the homepage itself returned HTTP 200 and the data endpoints were checked directly.

Failing endpoints:

```text
/api/games/categories
/api/games/popular?limit=10
/api/games/recent-wins?limit=10
/api/games?category=bc-originaux&limit=10
```

Error:

```text
Module not found: Can't resolve 'better-sqlite3'
Failing file: lib/db.ts
```

Cause:

The project runtime database layer imports `better-sqlite3`, but `better-sqlite3` is not listed in `package.json` and is not installed in `node_modules`.

Solution:

Install and declare the missing runtime dependency:

```powershell
npm.cmd install better-sqlite3
```

For TypeScript, also install types if needed:

```powershell
npm.cmd install -D @types/better-sqlite3
```

Because `better-sqlite3` is a native module, installation may require a prebuilt binary compatible with the local Node version or local build tools.

Applied fix:

The first install attempt timed out under the default sandbox. Re-running with network permission succeeded:

```powershell
npm.cmd install better-sqlite3 @types/better-sqlite3 --save
```

Then `@types/better-sqlite3` was moved to `devDependencies` with:

```powershell
npm.cmd install -D @types/better-sqlite3
```

NPM reported 18 vulnerabilities after install. This does not block local startup, but should be reviewed with `npm audit` before production use.

### Issue: Internal navigation links show Next.js 404 pages

Observed after startup when navigating through the UI. The core top-level pages such as `/`, `/casino`, `/sports`, `/wallet`, `/login`, `/register`, `/bets`, `/profile`, `/settings`, and `/notifications` return HTTP 200, but many links in the sidebar, footer, homepage category cards, and carousel "view all" buttons point to routes that do not have page files.

Examples:

```text
/casino/recent
/casino/favorites
/casino/slots
/sports/football
/sports/my-bets
/lottery
/promotions
/vip
/terms
/privacy
/games?search=...
```

Cause:

The design/navigation was built ahead of route implementation. Next.js correctly returns 404 for routes that do not exist.

Solution:

Add route coverage for planned navigation targets:

- Redirect `/casino/[category]` to `/casino?category=[category]`.
- Redirect `/sports/[sport]` to `/sports?sport=[sport]`, with `/sports/my-bets` going to `/bets`.
- Redirect `/games?...` list/search URLs to `/casino?...` because the app currently has only `/games/[id]` for individual games.
- Add a top-level fallback page for planned marketing/info pages such as `/lottery`, `/promotions`, `/vip`, `/terms`, and `/privacy` so users stay inside the app instead of seeing Next's default 404.

## Main Architectural Risks

### 1. Auth Is Split Across Multiple Mechanisms

The app uses bearer tokens, cookies, Zustand persistence, raw localStorage, and separate admin sessions. This creates inconsistent behavior.

Recommended fix:

- Pick one normal user auth transport.
- Update all user APIs to use it.
- Update all frontend calls to read the token from the same source.
- Do the same separately for admin auth.

### 2. Database Runtime Does Not Match Config

The project describes Postgres/Redis but runs SQLite.

Recommended fix:

- Either fully commit to SQLite and update docs/env/scripts accordingly.
- Or replace `lib/db.ts` with a Postgres implementation and update migrations.

### 3. Money Updates Are Not Fully Transactional

Wallet updates and transaction inserts should be atomic. Some flows update balances and then insert records separately.

Recommended fix:

- Wrap bet placement, bet settlement, casino callbacks, and deposits in DB transactions.
- Store money in integer minor units or precise decimal values.

### 4. Missing Dependencies

Several imported packages are not declared in `package.json`.

Recommended fix:

- Add required dependencies and type packages.
- Or remove unused modules if they are experimental.

### 5. Provider Callback Logic Is Complex and Fragile

The Slotegrator callback route is very large and contains production logic plus special bot validation logic in one file.

Recommended fix:

- Split callback parsing/signature verification from action handlers.
- Move bot validation into a dedicated module.
- Add tests for duplicate bet/win/refund/rollback behavior.

### 6. Tests Are Present But Not Type-Integrated

There are many tests, but TypeScript cannot recognize Jest globals.

Recommended fix:

- Add `types: ["jest", "node"]` or a dedicated test tsconfig.
- Ensure testing dependencies are installed.
- Decide whether `__tests__` should be included in normal `tsc --noEmit`.

## Recommended Stabilization Order

1. Fix `package.json` dependencies and missing type packages.
2. Normalize authentication.
3. Decide and document SQLite vs Postgres.
4. Make `npm.cmd run type-check` pass for app code.
5. Make tests compile and run.
6. Wrap all balance-changing flows in real transactions.
7. Clean up Slotegrator callback structure.
8. Verify fresh database migration from empty DB.
9. Run end-to-end flows:
   - register/login
   - wallet balance
   - deposit creation
   - sports bet placement
   - admin bet settlement
   - casino game launch
   - casino callback bet/win/refund/rollback

## Practical Mental Model

Think of this app as five connected systems:

1. Shell/UI system: Next.js pages and React components render the BC.GAME-like interface.
2. Identity system: custom users, sessions, profiles, and admin sessions.
3. Wallet system: user balances and transaction history.
4. Betting/casino system: sports bets plus Slotegrator game sessions/callbacks.
5. External integration system: Odds API, Slotegrator, Bitcoin APIs.

The wallet is the central shared dependency. Sports betting, casino callbacks, and deposits all eventually read or mutate wallet balance. Because of that, wallet correctness and transaction safety are the most important backend concerns.

## Bottom Line

The project has a strong feature map and a recognizable product structure. It already contains most of the pieces needed for a casino/sports betting prototype: UI, auth, wallet, casino provider calls, sports odds, admin panels, and payment flows.

However, it needs a stabilization pass before serious feature work:

- make dependencies match imports
- make TypeScript pass
- normalize auth
- align database strategy
- make money operations transactional
- verify migrations from scratch

Once those foundations are clean, the project will be much easier to extend safely.
