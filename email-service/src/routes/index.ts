import { Router } from 'express';

const router: Router = Router();

router.get('/', (req, res) => {
  res.json({
    service: 'BlueRelief Email Service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      send: 'POST /send',
      templates: '/templates',
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@bluerelief.com';

  res.json({
    status: 'healthy',
    service: 'BlueRelief Email Service',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    config: {
      hasApiKey: hasApiKey,
      emailFrom: emailFrom,
    },
  });
});

router.get('/templates', (req, res) => {
  res.json({
    templates: [
      'email',
      'alert',
      'notification',
      'crisis-alert',
      'weekly-digest',
      'mention-notification',
      'welcome',
    ],
    usage: 'POST /send with template name in body',
  });
});

export default router;
