import express from 'express';
import dotenv from 'dotenv';
import { emailService } from './services/email-service';

// Load environment variables
dotenv.config();

// Log startup info
const PORT = process.env.PORT || 3002;
const hasApiKey = !!process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'noreply@bluerelief.com';

if (!hasApiKey) {
  console.warn('⚠️  Warning: RESEND_API_KEY not found. Email sending will fail.');
  console.warn('    Make sure your .env file is loaded or RESEND_API_KEY is set.');
}

const app: express.Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BlueRelief Email Service',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0'
  });
});

// Email sending endpoint
app.post('/send', async (req, res) => {
  try {
    const { to, subject, template, data, metadata } = req.body;

    // Validate required fields
    if (!to || !subject || !template) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, template'
      });
    }

    // Send email using the email service
    const result = await emailService.sendEmail({
      to,
      subject,
      template,
      data: data || {},
      metadata: metadata || {}
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /send endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
