#!/usr/bin/env node

/**
 * Test Frontend Registration End-to-End
 */

const testRegistration = async () => {
  console.log('🧪 Testing Frontend Registration Flow...\n');

  const testEmail = `frontendtest${Date.now()}@example.com`;
  const testUserData = {
    email: testEmail,
    password: 'testpass123',
    firstName: 'Frontend',
    lastName: 'Test'
  };

  try {
    // Test registration API call (simulating frontend)
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify(testUserData)
    });

    const data = await response.json();

    if (response.status === 201) {
      console.log('✅ Registration Successful!');
      console.log('📧 Email:', data.user.email);
      console.log('👤 Name:', data.user.firstName, data.user.lastName);
      console.log('🆔 User ID:', data.user.id);
      console.log('🔑 Role:', data.user.role);
      console.log('📊 Status:', data.user.status);
      console.log('🎫 Token:', data.token.substring(0, 20) + '...');

      // Test login with the new user
      console.log('\n🔐 Testing Login...');
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'testpass123'
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.status === 200) {
        console.log('✅ Login Successful!');
        console.log('🎫 Token:', loginData.token.substring(0, 20) + '...');

        // Test getting user profile
        console.log('\n👤 Testing Profile Access...');
        const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });

        if (profileResponse.status === 200) {
          console.log('✅ Profile Access Successful!');
          console.log('👤 Profile loaded for:', loginData.user.email);
        } else {
          console.log('❌ Profile Access Failed:', profileResponse.status);
        }
      } else {
        console.log('❌ Login Failed:', loginData.error);
      }
    } else {
      console.log('❌ Registration Failed:', data.error);
    }

  } catch (error) {
    console.log('❌ Test Failed:', error.message);
  }

  console.log('\n🎉 Registration test completed!');
  console.log('\n📱 You can now test registration in the browser at:');
  console.log('   http://localhost:3001/register');
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
  testRegistration().catch(console.error);
}

module.exports = { testRegistration };