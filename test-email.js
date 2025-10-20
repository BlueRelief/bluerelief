const http = require('http');

// Test email data
const testEmail = {
  to: 'smjkazmi14@gmail.com',
  subject: 'Test Email from BlueRelief',
  template: 'email',
  data: {
    title: 'BlueRelief Test Email',
    content: 'This is a test email from the BlueRelief email service. The service is working correctly!',
    buttonText: 'Visit BlueRelief',
    buttonUrl: 'https://bluerelief.com'
  },
  metadata: {
    test: true,
    timestamp: new Date().toISOString()
  }
};

const testAlert = {
  to: 'smjkazmi14@gmail.com',
  subject: 'Emergency Alert Test - BlueRelief',
  template: 'alert',
  data: {
    title: 'Emergency Alert Test',
    alertType: 'Earthquake Alert',
    severity: 'High',
    location: 'Test City, CA',
    description: 'This is a test emergency alert from BlueRelief. The email service is working correctly!',
    buttonText: 'View Details',
    buttonUrl: 'https://bluerelief.com/test'
  },
  metadata: {
    test: true,
    alertId: 'test-123'
  }
};

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
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

async function testEmailService() {
  console.log('🧪 Testing BlueRelief Email Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest('/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   ✅ Health check passed\n');

    // Test 2: Send basic email
    console.log('2. Sending test email to smjkazmi14@gmail.com...');
    const emailResponse = await makeRequest('/send', 'POST', testEmail);
    console.log(`   Status: ${emailResponse.status}`);
    console.log(`   Response:`, emailResponse.data);
    if (emailResponse.data.success) {
      console.log('   ✅ Test email sent successfully!\n');
    } else {
      console.log('   ❌ Test email failed\n');
    }

    // Test 3: Send alert email
    console.log('3. Sending test alert email to smjkazmi14@gmail.com...');
    const alertResponse = await makeRequest('/send', 'POST', testAlert);
    console.log(`   Status: ${alertResponse.status}`);
    console.log(`   Response:`, alertResponse.data);
    if (alertResponse.data.success) {
      console.log('   ✅ Test alert email sent successfully!\n');
    } else {
      console.log('   ❌ Test alert email failed\n');
    }

    console.log('🎉 Email testing completed!');
    console.log('📧 Check your email at smjkazmi14@gmail.com for the test emails.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run tests
testEmailService();
