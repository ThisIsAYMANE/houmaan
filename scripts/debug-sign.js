/**
 * Debugging script to simulate the X-Sign calculation
 * and figure out why specific requests get "Invalid signature"
 * 
 * Usage: node scripts/debug-sign.js
 */
require('dotenv').config()
const crypto = require('crypto')

const MERCHANT_KEY = process.env.CASINO_MERCHANT_KEY

function encodePHP(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E')
}

function calcSign(params, headers, useRaw = false) {
  const allParams = { ...params, ...headers }
  const sortedKeys = Object.keys(allParams).sort()
  const qs = sortedKeys.map(key => {
    let val = allParams[key]
    if (val === null || val === undefined) val = ''
    const s = String(val)
    return useRaw ? `${key}=${s}` : `${encodePHP(key)}=${encodePHP(s)}`
  }).join('&')
  return crypto.createHmac('sha1', MERCHANT_KEY).update(qs).digest('hex')
}

// From the failing win request in the log
const failingWinParams = {
  action: 'win',
  amount: '3684.3456',
  currency: 'EUR',
  game_uuid: '7487f0fac9049c9ee0dd0635a8ce5f5bfe04cd15',
  player_id: 'jETzshv9CCUeSXTb29P6G',
  transaction_id: '637d587a054540c2839862c4345a6173',
  session_id: 'session_jETzshv9CCUeSXTb29P6G_1780700958010_necszc',
  type: 'win',
  round_id: '231751837',
}

// Auth headers from the request (normalize to Pascal-Case)
const winHeaders = {
  'X-Merchant-Id': 'dbb46701285c1a2e24a0bf92f00501e5',
  'X-Timestamp': '1780701441',
  'X-Nonce': '88dd27eb80f2493f8ac699a6dcc86fa5',
}

// Received sign from Slotegrator
const receivedSign = '59d59b2f3fc745ef8aee78a7103f52f04d3c86cf'

console.log('=== Debugging Invalid Signature for Win ===\n')
console.log('Received X-Sign:', receivedSign)

const encoded = calcSign(failingWinParams, winHeaders, false)
const raw = calcSign(failingWinParams, winHeaders, true)

console.log('Our signature (PHP-encoded):', encoded, encoded === receivedSign ? '✅ MATCH' : '❌ NO MATCH')
console.log('Our signature (raw):', raw, raw === receivedSign ? '✅ MATCH' : '❌ NO MATCH')

// Try with amount as number (not string)
const paramsWithNumericAmount = { ...failingWinParams, amount: 3684.3456 }
const encodedNum = calcSign(paramsWithNumericAmount, winHeaders, false)
const rawNum = calcSign(paramsWithNumericAmount, winHeaders, true)
console.log('\n--- With numeric amount (3684.3456) ---')
console.log('Our signature (PHP-encoded):', encodedNum, encodedNum === receivedSign ? '✅ MATCH' : '❌ NO MATCH')
console.log('Our signature (raw):', rawNum, rawNum === receivedSign ? '✅ MATCH' : '❌ NO MATCH')

// Try without type field
const noTypeParams = { ...failingWinParams }
delete noTypeParams.type
const encodedNoType = calcSign(noTypeParams, winHeaders, false)
console.log('\n--- Without type field ---')
console.log('Our signature (PHP-encoded):', encodedNoType, encodedNoType === receivedSign ? '✅ MATCH' : '❌ NO MATCH')

// Print what the query string looks like
const allParams = { ...failingWinParams, ...winHeaders }
const sortedKeys = Object.keys(allParams).sort()
console.log('\n=== Query String for Signature (PHP-encoded) ===')
const qs = sortedKeys.map(k => {
  const v = allParams[k]
  return `${encodePHP(String(k))}=${encodePHP(String(v))}`
}).join('&')
console.log(qs)
