import { Router } from 'express';
import { emailService } from '../services/email-service';
import { validateEmailRequest } from '../middleware/validate-email';

const router: Router = Router();

router.post('/send', validateEmailRequest, async (req, res) => {
  try {
    const { to, subject, template, data, metadata } = req.body;

    const result = await emailService.sendEmail({
      to,
      subject,
      template,
      data: data || {},
      metadata: metadata || {},
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in /send endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
