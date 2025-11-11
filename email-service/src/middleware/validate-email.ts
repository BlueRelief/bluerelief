import { Request, Response, NextFunction } from 'express';

export function validateEmailRequest(req: Request, res: Response, next: NextFunction) {
  const { to, subject, template } = req.body;

  if (!to || !subject || !template) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, subject, template'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address'
    });
  }

  // Valid templates
  const validTemplates = [
    'email',
    'alert',
    'notification',
    'crisis-alert',
    'weekly-digest',
    'mention-notification',
    'welcome',
    'password-reset'
  ];

  if (!validTemplates.includes(template)) {
    return res.status(400).json({
      success: false,
      error: `Invalid template. Must be one of: ${validTemplates.join(', ')}`
    });
  }

  next();
}

