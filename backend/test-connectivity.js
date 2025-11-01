#!/usr/bin/env node

/**
 * Test Frontend-Backend Connectivity
 */

const http = require('http');

const testConnection = async () => {
  console.log('🔗 Testing Frontend-Backend Connectivity...\n');

  // Test backend health
  try {
    const backendHealth = await fetch('http://localhost:5000/api/health');
    const backendData = await backendHealth.json();
    console.log('✅ Backend Health:', backendData.status);
    console.log('   Uptime:', Math.round(backendData.uptime), 'seconds');
  } catch (error) {
    console.log('❌ Backend Health Check Failed:', error.message);
    return;
  }

  // Test frontend accessibility
  try {
    const frontendResponse = await fetch('http://localhost:3001');
    console.log('✅ Frontend Accessible:', frontendResponse.status);
  } catch (error) {
    console.log('❌ Frontend Access Failed:', error.message);
    return;
  }

  // Test CORS preflight
  try {
    const corsResponse = await fetch('http://localhost:5000/api/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS Preflight:', corsResponse.status);
    console.log('   CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods')
    });
  } catch (error) {
    console.log('❌ CORS Test Failed:', error.message);
  }

  console.log('\n🎉 Connectivity test completed!');
  console.log('\n📱 Frontend URL: http://localhost:3001');
  console.log('🔧 Backend URL: http://localhost:5000');
  console.log('🏥 Health Check: http://localhost:5000/api/health');
};

// Use node-fetch for Node.js compatibility
global.fetch = async (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          json: async () => JSON.parse(body),
          headers: {
            get: (name) => res.headers[name.toLowerCase()]
          }
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { testConnection };