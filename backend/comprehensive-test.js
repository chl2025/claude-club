#!/usr/bin/env node

/**
 * Comprehensive Registration Test
 * Tests all possible failure points
 */

const comprehensiveTest = async () => {
  console.log('🔍 Comprehensive Registration Test\n');

  // Test 1: Backend Health
  console.log('1️⃣ Testing Backend Health...');
  try {
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend Health:', healthData.status);
  } catch (error) {
    console.log('❌ Backend Health Failed:', error.message);
    return;
  }

  // Test 2: CORS Test
  console.log('\n2️⃣ Testing CORS...');
  try {
    const corsResponse = await fetch('http://localhost:5000/api/health', {
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ CORS Status:', corsResponse.status);
    console.log('✅ CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('access-control-allow-origin')
    });
  } catch (error) {
    console.log('❌ CORS Failed:', error.message);
  }

  // Test 3: Registration with Valid Data
  console.log('\n3️⃣ Testing Registration (Valid Data)...');
  const validData = {
    email: `comptest${Date.now()}@example.com`,
    password: 'testpass123',
    firstName: 'Comp',
    lastName: 'Test'
  };

  try {
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify(validData)
    });

    const registerData = await registerResponse.json();
    console.log('📤 Registration Status:', registerResponse.status);
    console.log('📥 Registration Data:', {
      message: registerData.message,
      userStatus: registerData.user?.status,
      userEmail: registerData.user?.email,
      userId: registerData.user?.id
    });

    if (registerResponse.status === 201) {
      // Test 4: Immediate Login
      console.log('\n4️⃣ Testing Immediate Login...');
      try {
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: validData.email,
            password: 'testpass123'
          })
        });

        const loginData = await loginResponse.json();
        console.log('📤 Login Status:', loginResponse.status);
        console.log('📥 Login Message:', loginData.message);
        console.log('📥 Login User Status:', loginData.user?.status);

        if (loginResponse.status === 200) {
          console.log('✅ FULL REGISTRATION FLOW WORKS!');
        } else {
          console.log('❌ Login Failed:', loginData.error);
        }
      } catch (error) {
        console.log('❌ Login Exception:', error.message);
      }
    } else {
      console.log('❌ Registration Failed:', registerData.error);
    }
  } catch (error) {
    console.log('❌ Registration Exception:', error.message);
    console.log('🔍 Full Error:', error);
  }

  // Test 5: Registration Validation Tests
  console.log('\n5️⃣ Testing Registration Validation...');

  const invalidTests = [
    {
      name: 'Empty Email',
      data: { email: '', password: 'testpass123', firstName: 'Test', lastName: 'User' }
    },
    {
      name: 'Invalid Email',
      data: { email: 'invalid-email', password: 'testpass123', firstName: 'Test', lastName: 'User' }
    },
    {
      name: 'Short Password',
      data: { email: 'test@example.com', password: '123', firstName: 'Test', lastName: 'User' }
    },
    {
      name: 'Empty First Name',
      data: { email: 'test@example.com', password: 'testpass123', firstName: '', lastName: 'User' }
    },
    {
      name: 'Empty Last Name',
      data: { email: 'test@example.com', password: 'testpass123', firstName: 'Test', lastName: '' }
    }
  ];

  for (const test of invalidTests) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3001'
        },
        body: JSON.stringify(test.data)
      });

      const data = await response.json();
      if (response.status === 400) {
        console.log(`✅ ${test.name}: Correctly rejected (${data.error})`);
      } else {
        console.log(`❌ ${test.name}: Should have been rejected (status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Exception:`, error.message);
    }
  }

  console.log('\n🏁 Comprehensive Test Complete!');
  console.log('\n📱 Browser Test Instructions:');
  console.log('1. Open: http://localhost:3001/register');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Try registering with valid data');
  console.log('5. Look for debug messages starting with 🔍');
  console.log('6. If you see "Registration failed", check the exact error message');
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
          headers: {
            get: (name) => res.headers[name.toLowerCase()]
          },
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
  comprehensiveTest().catch(console.error);
}

module.exports = { comprehensiveTest };