#!/usr/bin/env node

/**
 * Comprehensive API Test Script for Leisure Club Backend
 *
 * This script tests all API endpoints and provides detailed results.
 * Usage: node test-api.js
 */

const axios = require('axios');
const colors = require('colors');

// Test configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test data
const testUser = {
  email: `testuser${Date.now()}@example.com`,
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'User'
};

const adminCredentials = {
  email: 'admin@leisureclub.com',
  password: 'admin123'
};

const testFacility = {
  name: `Test Facility ${Date.now()}`,
  type: 'meeting_room',
  description: 'A test facility for API testing',
  capacity: 10,
  location: 'Test Building',
  operatingHoursStart: '08:00',
  operatingHoursEnd: '20:00',
  bookingDurationMinutes: 60,
  requiresSupervision: false
};

// Global variables for test data
let userToken = null;
let adminToken = null;
let userId = null;
let testFacilityId = null;
let testBookingId = null;

// Utility functions
const log = {
  success: (msg) => console.log('✅'.green.bold, msg),
  error: (msg) => console.log('❌'.red.bold, msg),
  info: (msg) => console.log('ℹ️ '.blue.bold, msg),
  warning: (msg) => console.log('⚠️ '.yellow.bold, msg),
  header: (msg) => console.log('\n' + '='.repeat(50).cyan, msg, '='.repeat(50).cyan)
};

// Test result tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// API test helper
async function testAPI(method, endpoint, data = null, headers = {}, expectedStatus = 200) {
  testResults.total++;

  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);

    if (response.status === expectedStatus) {
      testResults.passed++;
      log.success(`${method} ${endpoint} - ${response.status}`);
      return { success: true, data: response.data, status: response.status };
    } else {
      testResults.failed++;
      testResults.errors.push(`${method} ${endpoint} - Expected ${expectedStatus}, got ${response.status}`);
      log.error(`${method} ${endpoint} - Expected ${expectedStatus}, got ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    const status = error.response?.status || 'Network Error';

    if (status === expectedStatus) {
      testResults.passed++;
      log.success(`${method} ${endpoint} - ${status} (Expected)`);
      return { success: true, status, error: error.response?.data };
    } else {
      testResults.failed++;
      testResults.errors.push(`${method} ${endpoint} - Expected ${expectedStatus}, got ${status}: ${error.response?.data?.error || error.message}`);
      log.error(`${method} ${endpoint} - Expected ${expectedStatus}, got ${status}: ${error.response?.data?.error || error.message}`);
      return { success: false, status, error: error.response?.data || error.message };
    }
  }
}

// Test suite functions
async function testHealthEndpoints() {
  log.header('Testing Health Endpoints');

  await testAPI('GET', '/api/health');
  await testAPI('GET', '/api/health/db');
}

async function testAuthentication() {
  log.header('Testing Authentication Endpoints');

  // Test user registration
  const registerResult = await testAPI('POST', '/api/auth/register', testUser, {}, 201);
  if (registerResult.success) {
    userToken = registerResult.data.token;
    userId = registerResult.data.user.id;
    log.info(`User registered with ID: ${userId}`);
  }

  // Test duplicate registration (should fail)
  await testAPI('POST', '/api/auth/register', testUser, {}, 409);

  // Test user login
  const loginResult = await testAPI('POST', '/api/auth/login', {
    email: testUser.email,
    password: testUser.password
  }, {}, 200);

  if (loginResult.success) {
    userToken = loginResult.data.token;
    log.info('User login successful');
  }

  // Test admin login
  const adminLoginResult = await testAPI('POST', '/api/auth/login', adminCredentials, {}, 200);
  if (adminLoginResult.success) {
    adminToken = adminLoginResult.data.token;
    log.info('Admin login successful');
  }

  // Test invalid login
  await testAPI('POST', '/api/auth/login', {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }, {}, 401);

  // Test getting profile with token
  if (userToken) {
    await testAPI('GET', '/api/auth/profile', null, {
      'Authorization': `Bearer ${userToken}`
    });

    // Test updating profile
    await testAPI('PUT', '/api/auth/profile', {
      firstName: 'Updated',
      lastName: 'User'
    }, {
      'Authorization': `Bearer ${userToken}`
    });

    // Test changing password
    await testAPI('PUT', '/api/auth/change-password', {
      currentPassword: testUser.password,
      newPassword: 'newpass123'
    }, {
      'Authorization': `Bearer ${userToken}`
    });

    // Test logout
    await testAPI('POST', '/api/auth/logout', null, {
      'Authorization': `Bearer ${userToken}`
    });
  }

  // Test accessing protected routes without token
  await testAPI('GET', '/api/auth/profile', {}, {}, 401);
}

async function testFacilities() {
  log.header('Testing Facilities Endpoints');

  const userHeaders = { 'Authorization': `Bearer ${userToken}` };
  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

  // Test getting all facilities (should work even with no facilities initially)
  await testAPI('GET', '/api/facilities', null, userHeaders);

  // Test getting facility types
  await testAPI('GET', '/api/facilities/types', null, userHeaders);

  // Test creating facility as regular user (should fail)
  await testAPI('POST', '/api/facilities', testFacility, userHeaders, 403);

  // Test creating facility as admin (should succeed)
  const createFacilityResult = await testAPI('POST', '/api/facilities', testFacility, adminHeaders, 201);
  if (createFacilityResult.success) {
    testFacilityId = createFacilityResult.data.id;
    log.info(`Test facility created with ID: ${testFacilityId}`);
  }

  // Test getting specific facility
  if (testFacilityId) {
    await testAPI('GET', `/api/facilities/${testFacilityId}`, null, userHeaders);

    // Test checking facility availability
    const today = new Date().toISOString().split('T')[0];
    await testAPI('GET', `/api/facilities/${testFacilityId}/availability?date=${today}`, null, userHeaders);

    await testAPI('GET', `/api/facilities/${testFacilityId}/available-slots?date=${today}`, null, userHeaders);

    // Test updating facility as admin
    await testAPI('PUT', `/api/facilities/${testFacilityId}`, {
      ...testFacility,
      name: 'Updated Test Facility'
    }, adminHeaders);

    // Test updating facility status as admin
    await testAPI('PUT', `/api/facilities/${testFacilityId}/status`, {
      status: 'maintenance'
    }, adminHeaders);

    // Test getting facility utilization as admin
    await testAPI('GET', '/api/facilities/admin/utilization', null, adminHeaders);

    // Test deleting facility as admin
    await testAPI('DELETE', `/api/facilities/${testFacilityId}`, null, adminHeaders, 204);
  }

  // Test accessing non-existent facility
  await testAPI('GET', '/api/facilities/non-existent-id', null, userHeaders, 404);
}

async function testBookings() {
  log.header('Testing Bookings Endpoints');

  const userHeaders = { 'Authorization': `Bearer ${userToken}` };
  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

  // First, ensure we have at least one facility
  let facilityId = testFacilityId;

  if (!facilityId) {
    // Get existing facilities
    const facilitiesResult = await testAPI('GET', '/api/facilities', null, adminHeaders);
    if (facilitiesResult.success && facilitiesResult.data.length > 0) {
      facilityId = facilitiesResult.data[0].id;
      log.info(`Using existing facility with ID: ${facilityId}`);
    }
  }

  if (facilityId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);

    const bookingData = {
      facilityId: facilityId,
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      notes: 'Test booking'
    };

    // Test creating booking
    const createBookingResult = await testAPI('POST', '/api/bookings', bookingData, userHeaders, 201);
    if (createBookingResult.success) {
      testBookingId = createBookingResult.data.id;
      log.info(`Test booking created with ID: ${testBookingId}`);
    }

    // Test getting user's bookings
    await testAPI('GET', '/api/bookings', null, userHeaders);

    // Test getting specific booking
    if (testBookingId) {
      await testAPI('GET', `/api/bookings/${testBookingId}`, null, userHeaders);

      // Test cancelling booking
      await testAPI('DELETE', `/api/bookings/${testBookingId}`, null, userHeaders, 204);
    }

    // Test checking facility availability for booking
    const today = new Date().toISOString().split('T')[0];
    await testAPI('GET', `/api/bookings/facilities/${facilityId}/availability?date=${today}`, null, userHeaders);
  }

  // Test admin booking endpoints
  await testAPI('GET', '/api/bookings/admin/all', null, adminHeaders);
  await testAPI('GET', '/api/bookings/admin/stats', null, adminHeaders);

  // Test creating overlapping booking (should fail)
  if (facilityId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);

    const overlappingBooking1 = {
      facilityId: facilityId,
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString()
    };

    // Create first booking
    const booking1 = await testAPI('POST', '/api/bookings', overlappingBooking1, userHeaders, 201);

    if (booking1.success) {
      // Try to create overlapping booking
      const overlappingBooking2 = {
        facilityId: facilityId,
        startTime: tomorrow.toISOString(),
        endTime: endTime.toISOString()
      };

      await testAPI('POST', '/api/bookings', overlappingBooking2, userHeaders, 409);
    }
  }
}

async function testErrorHandling() {
  log.header('Testing Error Handling');

  const userHeaders = { 'Authorization': `Bearer ${userToken}` };

  // Test validation errors
  await testAPI('POST', '/api/auth/register', {
    email: 'invalid-email',
    password: '123',
    firstName: '',
    lastName: ''
  }, {}, 400);

  await testAPI('POST', '/api/bookings', {
    facilityId: 'invalid-uuid',
    startTime: 'invalid-date',
    endTime: 'invalid-date'
  }, userHeaders, 400);

  // Test unauthorized access to admin routes
  await testAPI('GET', '/api/bookings/admin/all', null, userHeaders, 403);
  await testAPI('GET', '/api/facilities/admin/utilization', null, userHeaders, 403);

  // Test non-existent routes
  await testAPI('GET', '/api/non-existent-route', null, userHeaders, 404);
  await testAPI('POST', '/api/auth/non-existent-endpoint', null, userHeaders, 404);
}

async function displayResults() {
  log.header('Test Results Summary');

  console.log(`\n📊 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`.green);
  console.log(`❌ Failed: ${testResults.failed}`.red);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);

  if (testResults.errors.length > 0) {
    log.warning('\nFailed Tests:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`.red);
    });
  }

  // Test credentials for manual testing
  log.info('\nTest Credentials:');
  console.log(`Test User: ${testUser.email}`);
  console.log(`Test User Password: ${testUser.password}`);
  console.log(`Admin: ${adminCredentials.email}`);
  console.log(`Admin Password: ${adminCredentials.password}`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Leisure Club Backend API Tests'.bold.cyan);
  console.log(`📡 Base URL: ${BASE_URL}\n`);

  try {
    await testHealthEndpoints();
    await testAuthentication();
    await testFacilities();
    await testBookings();
    await testErrorHandling();
  } catch (error) {
    log.error('Test suite crashed:', error.message);
  }

  await displayResults();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testAPI };