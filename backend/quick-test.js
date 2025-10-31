#!/usr/bin/env node

/**
 * Quick API Test Script for Leisure Club Backend
 * Simple tests without external dependencies
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Utility function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealth() {
  console.log('\n🔍 Testing Health Endpoints...\n');

  try {
    const health = await makeRequest('GET', '/api/health');
    console.log(`✅ Health Check: ${health.status} - ${health.data.status || health.data}`);

    const dbHealth = await makeRequest('GET', '/api/health/db');
    console.log(`✅ Database Health: ${dbHealth.status} - ${dbHealth.data.database || dbHealth.data.status}`);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

async function testAuth() {
  console.log('\n🔐 Testing Authentication...\n');

  try {
    // Test registration
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User'
    };

    const register = await makeRequest('POST', '/api/auth/register', testUser);
    console.log(`✅ Register: ${register.status}`);

    if (register.status === 201) {
      const token = register.data.token;
      console.log(`📝 User Token: ${token.substring(0, 20)}...`);

      // Test profile
      const profile = await makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${token}`
      });
      console.log(`✅ Get Profile: ${profile.status}`);

      // Test login
      const login = await makeRequest('POST', '/api/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      console.log(`✅ Login: ${login.status}`);
    }

    // Test admin login
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@leisureclub.com',
      password: 'admin123'
    });
    console.log(`✅ Admin Login: ${adminLogin.status}`);

    if (adminLogin.status === 200) {
      const adminToken = adminLogin.data.token;
      console.log(`🔑 Admin Token: ${adminToken.substring(0, 20)}...`);
    }

  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
  }
}

async function testFacilities() {
  console.log('\n🏢 Testing Facilities...\n');

  try {
    // Get admin token first
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@leisureclub.com',
      password: 'admin123'
    });

    if (adminLogin.status === 200) {
      const adminToken = adminLogin.data.token;
      const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

      // Get all facilities
      const facilities = await makeRequest('GET', '/api/facilities', null, adminHeaders);
      console.log(`✅ Get Facilities: ${facilities.status}`);
      if (facilities.data && Array.isArray(facilities.data)) {
        console.log(`📊 Found ${facilities.data.length} facilities`);
      }

      // Create a test facility
      const testFacility = {
        name: `Test Facility ${Date.now()}`,
        type: 'meeting_room',
        description: 'Test facility',
        capacity: 10,
        operatingHoursStart: '08:00',
        operatingHoursEnd: '20:00'
      };

      const createFacility = await makeRequest('POST', '/api/facilities', testFacility, adminHeaders);
      console.log(`✅ Create Facility: ${createFacility.status}`);

      if (createFacility.status === 201) {
        const facilityId = createFacility.data.id;

        // Get specific facility
        const facility = await makeRequest('GET', `/api/facilities/${facilityId}`, null, adminHeaders);
        console.log(`✅ Get Facility: ${facility.status}`);

        // Check availability
        const today = new Date().toISOString().split('T')[0];
        const availability = await makeRequest('GET', `/api/facilities/${facilityId}/availability?date=${today}`, null, adminHeaders);
        console.log(`✅ Check Availability: ${availability.status}`);
      }
    }

  } catch (error) {
    console.log('❌ Facilities test failed:', error.message);
  }
}

async function testBookings() {
  console.log('\n📅 Testing Bookings...\n');

  try {
    // Get tokens
    const userLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@leisureclub.com',
      password: 'admin123'
    });

    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@leisureclub.com',
      password: 'admin123'
    });

    if (userLogin.status === 200 && adminLogin.status === 200) {
      const userToken = userLogin.data.token;
      const adminToken = adminLogin.data.token;

      // Get user's bookings
      const userBookings = await makeRequest('GET', '/api/bookings', null, {
        'Authorization': `Bearer ${userToken}`
      });
      console.log(`✅ Get User Bookings: ${userBookings.status}`);

      // Get all bookings (admin)
      const allBookings = await makeRequest('GET', '/api/bookings/admin/all', null, {
        'Authorization': `Bearer ${adminToken}`
      });
      console.log(`✅ Get All Bookings (Admin): ${allBookings.status}`);

      // Get booking stats (admin)
      const stats = await makeRequest('GET', '/api/bookings/admin/stats', null, {
        'Authorization': `Bearer ${adminToken}`
      });
      console.log(`✅ Get Booking Stats (Admin): ${stats.status}`);
    }

  } catch (error) {
    console.log('❌ Bookings test failed:', error.message);
  }
}

// Main test runner
async function runQuickTests() {
  console.log('🚀 Quick API Test for Leisure Club Backend'.bold);
  console.log(`📡 Testing server at: ${BASE_URL}\n`);

  await testHealth();
  await testAuth();
  await testFacilities();
  await testBookings();

  console.log('\n✨ Quick tests completed!');
  console.log('\n📋 Available Endpoints:');
  console.log('  🔐 Auth: POST /api/auth/login, /api/auth/register');
  console.log('  🏢 Facilities: GET /api/facilities, POST /api/facilities');
  console.log('  📅 Bookings: GET /api/bookings, POST /api/bookings');
  console.log('  🏥 Health: GET /api/health, /api/health/db');
  console.log('\n👑 Admin Credentials: admin@leisureclub.com / admin123');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = { runQuickTests };