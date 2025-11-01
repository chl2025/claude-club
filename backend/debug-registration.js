#!/usr/bin/env node

/**
 * Debug Registration - Test exact frontend payload
 */

const testFrontendPayload = async () => {
  console.log('🔍 Debugging Registration Payload...\n');

  // This simulates exactly what the frontend sends
  const formData = {
    email: `debugtest${Date.now()}@example.com`,
    password: 'testpass123',
    confirmPassword: 'testpass123',
    firstName: 'Debug',
    lastName: 'Test',
    phone: '',
    dateOfBirth: ''
  };

  console.log('📝 Original formData:', formData);

  // Simulate frontend data cleaning
  const { confirmPassword, phone, dateOfBirth, ...userData } = formData;

  const cleanedUserData = {
    ...userData,
    ...(phone && phone.trim() && { phone: phone.trim() }),
    ...(dateOfBirth && { dateOfBirth })
  };

  console.log('🧹 Cleaned userData:', cleanedUserData);

  try {
    // Make the request exactly like the frontend does
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify(cleanedUserData)
    });

    const data = await response.json();

    console.log('\n📤 Response Status:', response.status);
    console.log('📥 Response Data:', data);

    if (response.status === 201) {
      console.log('\n✅ Registration SUCCESSFUL!');

      // Test login immediately
      console.log('\n🔐 Testing Login...');
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cleanedUserData.email,
          password: 'testpass123'
        })
      });

      const loginData = await loginResponse.json();
      console.log('📤 Login Status:', loginResponse.status);
      console.log('📥 Login Data:', loginData);

    } else {
      console.log('\n❌ Registration FAILED!');
      console.log('Error:', data.error);
    }

  } catch (error) {
    console.error('\n💥 Exception:', error.message);
  }

  console.log('\n🏁 Debug completed!');
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

    const req = require('http').request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          json: async () => JSON.parse(body)
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
};

if (require.main === module) {
  testFrontendPayload().catch(console.error);
}

module.exports = { testFrontendPayload };