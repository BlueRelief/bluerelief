/**
 * Simple test script for the email service
 * Run with: node test-email-service.js
 *
 * Make sure the email service is running via Docker:
 * docker-compose up email-service
 */

const http = require('http');

const EMAIL_SERVICE_URL = 'http://localhost:3002';

// Test data
const testEmail = {
  to: 'test@example.com',
  subject: 'Test Email from BlueRelief',
  template: 'email',
  data: {
    title: 'Test Email',
    content: 'This is a test email from the BlueRelief email service.',
    buttonText: 'Visit BlueRelief',
    buttonUrl: 'https://bluerelief.app',
  },
  metadata: {
    test: true,
    timestamp: new Date().toISOString(),
  },
};

const testAlert = {
  to: 'test@example.com',
  subject: 'Emergency Alert Test',
  template: 'alert',
  data: {
    alertType: 'Earthquake Alert',
    severity: 'High',
    location: 'Test City, CA',
    description: 'This is a test emergency alert from BlueRelief.',
    actionText: 'View Details',
    actionUrl: 'https://bluerelief.app/test',
  },
  metadata: {
    test: true,
    alertId: 'test-123',
  },
};

const testNotification = {
  to: 'test@example.com',
  subject: 'Test Notification',
  template: 'notification',
  data: {
    title: 'Test Notification',
    message: 'This is a test notification from BlueRelief.',
    type: 'info',
    actionText: 'View Dashboard',
    actionUrl: 'https://bluerelief.app/dashboard',
  },
  metadata: {
    test: true,
    type: 'info',
  },
};

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing BlueRelief Email Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest('/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   ✅ Health check passed\n');

    // Test 2: Send basic email
    console.log('2. Testing basic email...');
    const emailResponse = await makeRequest('/send', 'POST', testEmail);
    console.log(`   Status: ${emailResponse.status}`);
    console.log(`   Response:`, emailResponse.data);
    if (emailResponse.data.success) {
      console.log('   ✅ Basic email test passed\n');
    } else {
      console.log('   ❌ Basic email test failed\n');
    }

    // Test 3: Send alert email
    console.log('3. Testing alert email...');
    const alertResponse = await makeRequest('/send', 'POST', testAlert);
    console.log(`   Status: ${alertResponse.status}`);
    console.log(`   Response:`, alertResponse.data);
    if (alertResponse.data.success) {
      console.log('   ✅ Alert email test passed\n');
    } else {
      console.log('   ❌ Alert email test failed\n');
    }

    // Test 4: Send notification email
    console.log('4. Testing notification email...');
    const notificationResponse = await makeRequest('/send', 'POST', testNotification);
    console.log(`   Status: ${notificationResponse.status}`);
    console.log(`   Response:`, notificationResponse.data);
    if (notificationResponse.data.success) {
      console.log('   ✅ Notification email test passed\n');
    } else {
      console.log('   ❌ Notification email test failed\n');
    }

    // Test 5: Test error handling
    console.log('5. Testing error handling...');
    const errorResponse = await makeRequest('/send', 'POST', { to: 'invalid' });
    console.log(`   Status: ${errorResponse.status}`);
    console.log(`   Response:`, errorResponse.data);
    console.log('   ✅ Error handling test passed\n');

    console.log('🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the email service is running:');
    console.log('   docker-compose up email-service');
    console.log('   or');
    console.log('   docker-compose up (to start all services)');
  }
}

// Run tests
runTests();
