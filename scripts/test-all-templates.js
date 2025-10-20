/**
 * Test script for all email templates
 * Usage: TEST_EMAIL=your@email.com node test-all-templates.js
 * 
 * Make sure the email service is running via Docker:
 * docker-compose up email-service
 */

const http = require('http');

const EMAIL_SERVICE_URL = 'http://localhost:3002';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

// Test data for all templates
const testData = {
  crisisAlert: {
    to: TEST_EMAIL,
    subject: 'Earthquake Alert - San Francisco',
    template: 'crisis-alert',
    data: {
      disasterType: 'Earthquake',
      location: 'San Francisco, CA',
      severity: 'High',
      description: 'A 6.5 magnitude earthquake has been detected in the San Francisco Bay Area. Please take immediate safety precautions.',
      affectedArea: 'San Francisco Bay Area',
      timestamp: new Date().toISOString(),
      actionText: 'View Details',
      actionUrl: 'https://bluerelief.com/alerts/123'
    },
    metadata: {
      crisisId: '123',
      type: 'crisis_alert'
    }
  },

  weeklyDigest: {
    to: TEST_EMAIL,
    subject: 'Weekly Crisis Digest - 2024-01-01 to 2024-01-07',
    template: 'weekly-digest',
    data: {
      userName: 'John Doe',
      weekStart: '2024-01-01',
      weekEnd: '2024-01-07',
      crisisCount: 3,
      crises: [
        {
          type: 'Earthquake',
          location: 'San Francisco, CA',
          date: '2024-01-03',
          severity: 'High'
        },
        {
          type: 'Flood',
          location: 'Los Angeles, CA',
          date: '2024-01-05',
          severity: 'Medium'
        },
        {
          type: 'Wildfire',
          location: 'Sacramento, CA',
          date: '2024-01-06',
          severity: 'Critical'
        }
      ],
      dashboardUrl: 'https://bluerelief.com/dashboard'
    },
    metadata: {
      type: 'weekly_digest'
    }
  },

  mentionNotification: {
    to: TEST_EMAIL,
    subject: "You've been mentioned by @jane_doe",
    template: 'mention-notification',
    data: {
      userName: 'John Doe',
      mentionedBy: 'Jane Doe',
      context: 'mentioned you in a crisis update',
      postTitle: 'Earthquake Response Update',
      postContent: 'The situation in San Francisco is under control. All emergency services are responding effectively.',
      actionText: 'View Post',
      actionUrl: 'https://bluerelief.com/posts/456',
      timestamp: new Date().toISOString()
    },
    metadata: {
      type: 'mention_notification'
    }
  },

  welcome: {
    to: TEST_EMAIL,
    subject: 'Welcome to BlueRelief!',
    template: 'welcome',
    data: {
      userName: 'John Doe',
      userEmail: TEST_EMAIL,
      dashboardUrl: 'https://bluerelief.com/dashboard',
      settingsUrl: 'https://bluerelief.com/settings',
      helpUrl: 'https://bluerelief.com/help'
    },
    metadata: {
      type: 'welcome'
    }
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

async function testAllTemplates() {
  console.log('🧪 Testing All BlueRelief Email Templates...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest('/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   ✅ Health check passed\n');

    // Test 2: Crisis Alert Template
    console.log('2. Testing Crisis Alert template...');
    const crisisResponse = await makeRequest('/send', 'POST', testData.crisisAlert);
    console.log(`   Status: ${crisisResponse.status}`);
    console.log(`   Response:`, crisisResponse.data);
    if (crisisResponse.data.success) {
      console.log('   ✅ Crisis Alert email sent successfully!\n');
    } else {
      console.log('   ❌ Crisis Alert email failed\n');
    }

    // Test 3: Weekly Digest Template
    console.log('3. Testing Weekly Digest template...');
    const digestResponse = await makeRequest('/send', 'POST', testData.weeklyDigest);
    console.log(`   Status: ${digestResponse.status}`);
    console.log(`   Response:`, digestResponse.data);
    if (digestResponse.data.success) {
      console.log('   ✅ Weekly Digest email sent successfully!\n');
    } else {
      console.log('   ❌ Weekly Digest email failed\n');
    }

    // Test 4: Mention Notification Template
    console.log('4. Testing Mention Notification template...');
    const mentionResponse = await makeRequest('/send', 'POST', testData.mentionNotification);
    console.log(`   Status: ${mentionResponse.status}`);
    console.log(`   Response:`, mentionResponse.data);
    if (mentionResponse.data.success) {
      console.log('   ✅ Mention Notification email sent successfully!\n');
    } else {
      console.log('   ❌ Mention Notification email failed\n');
    }

    // Test 5: Welcome Template
    console.log('5. Testing Welcome template...');
    const welcomeResponse = await makeRequest('/send', 'POST', testData.welcome);
    console.log(`   Status: ${welcomeResponse.status}`);
    console.log(`   Response:`, welcomeResponse.data);
    if (welcomeResponse.data.success) {
      console.log('   ✅ Welcome email sent successfully!\n');
    } else {
      console.log('   ❌ Welcome email failed\n');
    }

    console.log('🎉 All template tests completed!');
    console.log('📧 Check your email at ' + TEST_EMAIL + ' for all test emails.');
    console.log('\n📋 Templates tested:');
    console.log('   • Crisis Alert (High-priority emergency notifications)');
    console.log('   • Weekly Digest (Weekly crisis summary)');
    console.log('   • Mention Notification (User mention notifications)');
    console.log('   • Welcome (New user onboarding)');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the email service is running:');
    console.log('   docker-compose up email-service');
    console.log('   or');
    console.log('   docker-compose up (to start all services)');
  }
}

// Run tests
testAllTemplates();
