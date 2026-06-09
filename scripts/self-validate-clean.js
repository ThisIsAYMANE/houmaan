/**
 * CLEAN Slotegrator Self-Validation Script
 * 
 * Based strictly on self_validation_infos.txt:
 * Step 1: Launch the game via POST /games/init
 * Step 2: Do NOT interact with the game
 * Step 3: Send POST /self-validate
 *
 * Key details:
 * - Player ID must be the Slotegrator bot: 5fbW-EgviQlSB0qgLmM0Z
 * - Currency must match enabled limits (EUR)
 * - X-Sign must be correct HMAC SHA1 over sorted merged params+headers
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ─── Load .env ───────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const MERCHANT_ID  = process.env.CASINO_MERCHANT_ID;
const MERCHANT_KEY = process.env.CASINO_MERCHANT_KEY;
const BASE_URL     = (process.env.CASINO_API_BASE_URL || 'https://staging.slotegrator.com/api/index.php/v1').replace(/\/$/, '');
const RETURN_URL   = process.env.CASINO_TEST_AREA_URL || 'https://boztestarea.ngrok.app';
const CURRENCY     = 'EUR'; // confirmed enabled

if (!MERCHANT_ID || !MERCHANT_KEY) {
  console.error('❌ Missing CASINO_MERCHANT_ID or CASINO_MERCHANT_KEY in .env');
  process.exit(1);
}

console.log('Config:');
console.log('  Merchant ID :', MERCHANT_ID);
console.log('  Base URL    :', BASE_URL);
console.log('  Return URL  :', RETURN_URL);
console.log('  Currency    :', CURRENCY);
console.log('');

// ─── X-Sign ──────────────────────────────────────────────────────────────────

function calculateXSign(params, headers) {
  // Filter out X-Sign from headers
  const filtered = Object.fromEntries(
    Object.entries(headers).filter(([k]) => k.toLowerCase() !== 'x-sign')
  );
  const merged = { ...params, ...filtered };
  const sorted = Object.keys(merged).sort();
  const qs = sorted.map(k => {
    const v = String(merged[k]);
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&');
  console.log('  [XSign] Query string:', qs);
  return crypto.createHmac('sha1', MERCHANT_KEY).update(qs).digest('hex');
}

function buildAuthHeaders(params = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const headers = {
    'X-Merchant-Id': MERCHANT_ID,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
  };
  headers['X-Sign'] = calculateXSign(params, headers);
  return headers;
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

function post(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const authHeaders = buildAuthHeaders(params);
    const form = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();

    const reqHeaders = {
      ...authHeaders,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(form).toString(),
      'Accept': 'application/json',
    };

    const url = new URL(BASE_URL + endpoint);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: reqHeaders,
    };

    console.log(`\n→ POST ${BASE_URL + endpoint}`);
    console.log('  Body params:', JSON.stringify(params, null, 2));
    console.log('  X-Sign:', reqHeaders['X-Sign']);

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`← HTTP ${res.statusCode}`);
        console.log('  Raw body:', data);
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    req.write(form);
    req.end();
  });
}

function get(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const authHeaders = buildAuthHeaders(params);
    const url = new URL(BASE_URL + endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));

    const reqHeaders = {
      ...authHeaders,
      'Accept': 'application/json',
    };

    console.log(`\n→ GET ${url.toString()}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: reqHeaders,
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`← HTTP ${res.statusCode}`);
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  SLOTEGRATOR SELF-VALIDATION (CLEAN RUN)');
  console.log('='.repeat(60));

  // STEP 1 — Find a valid game from an enabled EUR provider
  console.log('\n[STEP 1] Fetching /limits to find EUR-enabled providers...');
  const limitsRes = await get('/limits');
  const eurLimit = Array.isArray(limitsRes.body)
    ? limitsRes.body.find(l => l.currency === 'EUR')
    : null;
  const enabledProviders = eurLimit?.providers || [];
  console.log(`  Enabled EUR providers: ${enabledProviders.length}`);
  console.log(`  Providers: ${enabledProviders.slice(0, 10).join(', ')}`);

  console.log('\n[STEP 1b] Fetching game list (pages 1–5) to find eligible game...');
  let gameUuid = null, gameName = null, gameProvider = null, gameHasLobby = false;

  outer:
  for (let page = 1; page <= 5; page++) {
    const gamesRes = await get('/games', { page });
    const items = gamesRes.body?.items || [];
    if (items.length === 0) break;
    console.log(`  Page ${page}: ${items.length} games`);
    for (const g of items) {
      if (enabledProviders.length > 0 && !enabledProviders.includes(g.provider)) continue;
      // Prefer non-lobby games for simplicity
      if (g.has_lobby === 0) {
        gameUuid = g.uuid;
        gameName = g.name;
        gameProvider = g.provider;
        gameHasLobby = false;
        break outer;
      }
    }
  }

  if (!gameUuid) {
    console.error('❌ No eligible game found');
    process.exit(1);
  }
  console.log(`\n  ✅ Selected: "${gameName}" (${gameProvider})`);
  console.log(`     UUID: ${gameUuid}`);
  console.log(`     Has lobby: ${gameHasLobby}`);

  // STEP 2 — POST /games/init with the Slotegrator bot player
  console.log('\n[STEP 2] Calling POST /games/init...');

  const BOT_PLAYER_ID = '5fbW-EgviQlSB0qgLmM0Z';
  const sessionId = `sv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const initParams = {
    game_uuid: gameUuid,
    player_id: BOT_PLAYER_ID,
    player_name: 'Test',
    currency: CURRENCY,
    session_id: sessionId,
    device: 'desktop',
    return_url: RETURN_URL,
    language: 'en',
    email: 'test@example.com',
  };

  const initRes = await post('/games/init', initParams);

  if (initRes.status !== 200 || !initRes.body?.url) {
    console.error('❌ /games/init failed!');
    console.error('  Response:', JSON.stringify(initRes.body, null, 2));
    process.exit(1);
  }

  console.log(`\n  ✅ Game session created!`);
  console.log(`     Session ID : ${sessionId}`);
  console.log(`     Game URL   : ${initRes.body.url}`);

  // STEP 3 — Wait, do NOT interact
  const waitSecs = 10;
  console.log(`\n[STEP 3] Waiting ${waitSecs}s (do NOT interact with game)...`);
  for (let i = waitSecs; i > 0; i--) {
    process.stdout.write(`  ${i}...\r`);
    await sleep(1000);
  }
  console.log('  Done waiting!');

  // STEP 4 — POST /self-validate
  console.log('\n[STEP 4] Calling POST /self-validate...');

  const validateParams = {
    session_id: sessionId,
    player_id: BOT_PLAYER_ID,
    currency: CURRENCY,
  };

  const validateRes = await post('/self-validate', validateParams);

  // ─── Results ────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  RESULTS');
  console.log('='.repeat(60));

  const result = validateRes.body;

  if (result?.success === true || result?.status === 1) {
    console.log('\n✅ SELF-VALIDATION PASSED!\n');
  } else {
    console.log('\n❌ SELF-VALIDATION FAILED\n');
  }

  if (result?.log) {
    const lines = Array.isArray(result.log) ? result.log : [result.log];
    console.log('Validation log:');
    lines.forEach((line, i) => {
      const failed = String(line).toLowerCase().includes('failed');
      console.log(`  ${failed ? '❌' : '  '} [${i+1}] ${line}`);
    });
  }

  // Save to file
  const outFile = path.join(__dirname, '..', 'self_validate_result.json');
  fs.writeFileSync(outFile, JSON.stringify({ sessionId, gameUuid, gameName, gameProvider, result }, null, 2));
  console.log(`\nFull result saved to: self_validate_result.json`);
  console.log('\nFull JSON:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
