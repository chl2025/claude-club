#!/usr/bin/env node

/**
 * Complete Frontend Flow Test
 * Simulates exactly what the frontend does step by step
 */

const testCompleteFlow = async () => {
  console.log('🔄 Testing Complete Frontend Flow...\n');

  // Step 1: Test API Service Configuration
  console.log('1️⃣ Testing API Configuration...');

  try {
    const healthResponse = await fetch('http://localhost:5000/api/health', {
      headers: {
        'Origin': 'http://localhost:3001'
      }
    });

    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData.status);
  } catch (error) {
    console.log('❌ API Health Failed:', error.message);
    return;
  }

  // Step 2: Test Registration (exactly like frontend)
  console.log('\n2️⃣ Testing Registration (Frontend Simulation)...');

  const formData = {
    email: `flowtest${Date.now()}@example.com`,
    password: 'testpass123',
    confirmPassword: 'testpass123',
    firstName: 'Flow',
    lastName: 'Test',
    phone: '',
    dateOfBirth: ''
  };

  console.log('📝 Form Data:', formData);

  // Clean data exactly like frontend does
  const { confirmPassword, phone, dateOfBirth, ...userData } = formData;
  const cleanedUserData = {
    ...userData,
    ...(phone && phone.trim() && { phone: phone.trim() }),
    ...(dateOfBirth && { dateOfBirth })
  };

  console.log('🧹 Cleaned Data:', cleanedUserData);

  try {
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify(cleanedUserData)
    });

    const registerData = await registerResponse.json();
    console.log('📤 Register Status:', registerResponse.status);
    console.log('📥 Register Data:', registerData);

    if (registerResponse.status !== 201) {
      console.log('❌ Registration Failed at API level');
      return;
    }

    const { user, token } = registerData;
    console.log('✅ Registration API Success');
    console.log('👤 User:', user);
    console.log('🎫 Token:', token.substring(0, 30) + '...');

    // Step 3: Test Auth Context behavior simulation
    console.log('\n3️⃣ Simulating Auth Context Processing...');

    // Simulate what AuthContext does
    if (user && token) {
      console.log('✅ Auth Context would store token and user');
      console.log('✅ Auth Context would dispatch LOGIN_SUCCESS');

      // Step 4: Test immediate login (since user should be active)
      console.log('\n4️⃣ Testing Immediate Login...');

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

      if (loginResponse.status === 200) {
        console.log('✅ Login Successful - User can access the system!');

        // Step 5: Test Profile Access
        console.log('\n5️⃣ Testing Profile Access...');

        const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });

        if (profileResponse.status === 200) {
          console.log('✅ Profile Access Successful!');
        } else {
          console.log('❌ Profile Access Failed:', profileResponse.status);
        }

      } else {
        console.log('❌ Login Failed - User status issue');
        console.log('🔍 User Status:', user.status);
      }

    } else {
      console.log('❌ Registration response missing user or token');
    }

  } catch (error) {
    console.log('❌ Registration Exception:', error.message);
    console.log('🔍 Full Error:', error);
  }

  console.log('\n🏁 Complete Flow Test Finished!');
  console.log('\n📱 Browser Test Instructions:');
  console.log('1. Open: http://localhost:3001/register');
  console.log('2. Fill out the registration form');
  console.log('3. Open Browser Developer Tools (F12)');
  console.log('4. Go to Console tab');
  console.log('5. Submit the form');
  console.log('6. Check console for debug messages starting with 🔍');
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
  testCompleteFlow().catch(console.error);
}

module.exports = { testCompleteFlow };