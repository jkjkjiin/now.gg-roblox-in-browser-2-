
const fetch = require('node-fetch');

// Test different now.gg API endpoints to find which ones are accessible
async function testEndpoints() {
  const endpoints = [
    'https://now.gg/api/user/v2/auth',
    'https://api.now.gg/user/v2/auth',
    'https://account.api.now.gg/user/v2/auth',
    'https://now.gg/api/v1/auth',
    'https://api.now.gg/v1/auth'
  ];

  console.log('Testing now.gg API endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      
      console.log(`  ✓ Status: ${response.status}`);
      console.log(`  ✓ Reachable\n`);
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      console.log(`  ✗ Code: ${error.code || 'N/A'}\n`);
    }
  }
}

testEndpoints();
