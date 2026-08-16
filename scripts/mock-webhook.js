const http = require('http');

/**
 * Mock Webhook Script for Local Manual Testing
 * Run this to manually simulate blockchain confirmations.
 * 
 * Usage: node scripts/mock-webhook.js
 */

async function mockDeposit() {
  console.log('Sending mock deposit webhook...');
  
  // Replace with the actual URL and deposit data expected by your application.
  // E.g., hitting your local API to complete a deposit
  const postData = JSON.stringify({
    // Modify based on the structure of your webhook API
    address: '0x123MockAddress',
    amount: 50,
    txHash: '0xabc123MockTxHash',
    network: 'ethereum',
    status: 'confirmed'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/crypto', // Update with actual webhook endpoint if different
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

mockDeposit();
