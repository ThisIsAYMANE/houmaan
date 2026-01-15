/**
 * Script to find a game that can be launched without errors
 * 
 * Usage: node scripts/find-working-game.js [currency]
 * Example: node scripts/find-working-game.js EUR
 */

const https = require('https');
const crypto = require('crypto');

// Configuration - update these from your .env file
const MERCHANT_ID = process.env.CASINO_MERCHANT_ID || 'dbb46701285c1a2e24a0bf92f00501e5';
const MERCHANT_KEY = process.env.CASINO_MERCHANT_KEY || '';
const BASE_URL = process.env.CASINO_API_BASE_URL || 'https://staging.slotegrator.com/api/index.php/v1';
const CURRENCY = process.argv[2] || 'EUR'; // Default to EUR since that's what's enabled

function calculateXSign(params, headers, merchantKey) {
  const mergedParams = { ...params, ...headers };
  const sortedKeys = Object.keys(mergedParams).sort();
  const queryString = sortedKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(mergedParams[key]))}`)
    .join('&');
  return crypto.createHmac('sha1', merchantKey).update(queryString).digest('hex');
}

function generateAuthHeaders(merchantId, merchantKey, params = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const headers = {
    'X-Merchant-Id': merchantId,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
  };
  const xSign = calculateXSign(params, headers, merchantKey);
  headers['X-Sign'] = xSign;
  return headers;
}

function makeRequest(endpoint, method = 'GET', params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (method === 'GET' && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const authHeaders = generateAuthHeaders(MERCHANT_ID, MERCHANT_KEY, params);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (method === 'POST' && Object.keys(params).length > 0) {
      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      req.write(formData.toString());
    }

    req.end();
  });
}

async function findWorkingGame() {
  console.log(`\n🔍 Finding a working game for currency: ${CURRENCY}\n`);

  try {
    // Step 1: Get enabled providers for the currency
    console.log('1️⃣ Fetching enabled providers...');
    const limitsResponse = await makeRequest('/limits');
    
    if (limitsResponse.status !== 200) {
      console.error('❌ Failed to fetch limits:', limitsResponse.data);
      return;
    }

    const limits = Array.isArray(limitsResponse.data) ? limitsResponse.data : [];
    const currencyLimit = limits.find(l => l.currency === CURRENCY);
    
    if (!currencyLimit) {
      console.error(`❌ No limits found for currency ${CURRENCY}`);
      console.log(`Available currencies: ${limits.map(l => l.currency).join(', ')}`);
      return;
    }

    const enabledProviders = currencyLimit.providers || [];
    console.log(`✅ Found ${enabledProviders.length} enabled providers for ${CURRENCY}:`);
    console.log(`   ${enabledProviders.slice(0, 5).join(', ')}${enabledProviders.length > 5 ? '...' : ''}\n`);

    // Step 2: Get games from enabled providers
    console.log('2️⃣ Fetching games...');
    const gamesResponse = await makeRequest('/games', 'GET', { page: 1 });
    
    if (gamesResponse.status !== 200) {
      console.error('❌ Failed to fetch games:', gamesResponse.data);
      return;
    }

    const games = gamesResponse.data.items || [];
    console.log(`✅ Found ${games.length} games on first page\n`);

    // Step 3: Find a game from an enabled provider
    const workingGames = games.filter(game => 
      enabledProviders.includes(game.provider) && 
      game.has_lobby === 0 // Prefer games without lobby for simplicity
    );

    if (workingGames.length === 0) {
      console.log('⚠️  No games found from enabled providers on first page. Checking more pages...');
      // Try a few more pages
      for (let page = 2; page <= 5; page++) {
        const pageResponse = await makeRequest('/games', 'GET', { page });
        if (pageResponse.status === 200 && pageResponse.data.items) {
          const pageGames = pageResponse.data.items.filter(game => 
            enabledProviders.includes(game.provider) && game.has_lobby === 0
          );
          if (pageGames.length > 0) {
            workingGames.push(...pageGames);
            break;
          }
        }
      }
    }

    if (workingGames.length === 0) {
      console.error('❌ No working games found from enabled providers');
      return;
    }

    // Step 4: Display working games
    console.log(`\n✅ Found ${workingGames.length} working game(s):\n`);
    workingGames.slice(0, 10).forEach((game, index) => {
      console.log(`${index + 1}. ${game.name}`);
      console.log(`   UUID: ${game.uuid}`);
      console.log(`   Provider: ${game.provider}`);
      console.log(`   Type: ${game.type}`);
      console.log(`   Has Lobby: ${game.has_lobby === 1 ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Step 5: Test the first game (optional)
    if (workingGames.length > 0) {
      const testGame = workingGames[0];
      console.log(`\n🧪 Testing game: ${testGame.name} (${testGame.uuid})\n`);
      console.log(`To test this game, use currency: ${CURRENCY}`);
      console.log(`Game UUID: ${testGame.uuid}`);
      console.log(`\nOr visit: /games/${testGame.uuid}`);
      console.log(`\n⚠️  Make sure your user profile has currency set to: ${CURRENCY}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
if (!MERCHANT_KEY) {
  console.error('❌ CASINO_MERCHANT_KEY not set. Please set it in your .env file or as environment variable.');
  process.exit(1);
}

findWorkingGame();

