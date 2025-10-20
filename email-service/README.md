# BlueRelief Email Service

A Node.js microservice for handling email functionality using React Email for beautiful, maintainable email templates.

## Features

- 🚀 Express.js server with TypeScript
- 📧 React Email for beautiful email templates
- 🔄 Resend API integration with retry logic
- 🐳 Docker support for containerization
- 🏥 Health check endpoints
- 📊 Error handling and logging

## API Endpoints

### Health Check
```
GET /health
```

Returns service status and version information.

### Send Email
```
POST /send
```

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Emergency Alert",
  "template": "alert",
  "data": {
    "title": "Earthquake Alert",
    "content": "A 6.5 magnitude earthquake has been detected...",
    "buttonText": "View Details",
    "buttonUrl": "https://bluerelief.com/alerts/123"
  },
  "metadata": {
    "alertId": "123",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "resend_message_id"
}
```

## Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Email Service Configuration
PORT=3002
EMAIL_FROM=noreply@bluerelief.com

# Resend API Configuration
RESEND_API_KEY=your_resend_api_key_here

# Optional: Email service metadata
SERVICE_NAME=BlueRelief Email Service
SERVICE_VERSION=1.0.0
```

## Development

### Prerequisites
- Docker and Docker Compose
- Environment variables configured

### Development with Docker
```bash
# Start the email service in development mode (with hot reloading)
docker-compose up email-service

# Or start all services including email service
docker-compose up
```

### Production with Docker
```bash
# Build and run in production mode
docker-compose -f docker-compose.yml up email-service --build
```

### Individual Docker Commands (if needed)
```bash
# Development
docker build -f Dockerfile.dev -t bluerelief-email-service:dev ./email-service
docker run -p 3002:3002 --env-file .env bluerelief-email-service:dev

# Production
docker build -t bluerelief-email-service ./email-service
docker run -p 3002:3002 --env-file .env bluerelief-email-service
```

## Email Templates

Templates are located in `src/templates/` and use React Email components for consistent, beautiful email designs.

### Current Templates
- `EmailTemplate` - Basic template with logo, title, content, and optional button

### Adding New Templates
1. Create a new React component in `src/templates/`
2. Export the component
3. Update the email service to handle the new template

## Integration

The email service is designed to be called by the main BlueRelief backend. Update your backend to send HTTP requests to the email service instead of sending emails directly.

### Example Integration
```python
import requests

def send_alert_email(user_email, alert_data):
    response = requests.post(
        'http://email-service:3002/send',
        json={
            'to': user_email,
            'subject': 'Emergency Alert',
            'template': 'alert',
            'data': alert_data
        }
    )
    return response.json()
```

## Health Monitoring

The service includes health check endpoints for monitoring:
- `GET /health` - Returns service status
- Docker health checks are configured
- Logs include structured error information

## Error Handling

- Automatic retry logic with exponential backoff
- Comprehensive error logging
- Graceful failure handling
- Structured error responses
