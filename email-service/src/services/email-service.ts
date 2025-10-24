import { Resend } from 'resend';
import { render } from '@react-email/render';
import {
  EmailTemplate,
  CrisisAlertTemplate,
  WeeklyDigestTemplate,
  MentionNotificationTemplate,
  WelcomeTemplate,
  AlertTemplate,
  NotificationTemplate
} from '../templates';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@bluerelief.com';
  }

  async sendEmail({ to, subject, template, data, metadata }: EmailData): Promise<EmailResult> {
    try {
      // Render the email template
      const html = await this.renderTemplate(template, data);

      // Send email via Resend
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
        tags: [
          { name: 'service', value: 'bluerelief' },
          { name: 'template', value: template },
          ...(metadata ? Object.entries(metadata).map(([key, value]) => ({ 
            name: key.replace(/[^a-zA-Z0-9_-]/g, '-'),
            value: String(value).replace(/[^a-zA-Z0-9_-]/g, '-').substring(0, 100)
          })) : [])
        ]
      });

      if (result.error) {
        console.error('Resend API error:', result.error);
        return {
          success: false,
          error: `Email sending failed: ${result.error.message}`
        };
      }

      console.log(`Email sent successfully to ${to}, message ID: ${result.data?.id}`);
      return {
        success: true,
        messageId: result.data?.id
      };

    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      let template;
      
      switch (templateName.toLowerCase()) {
        case 'crisis-alert':
          template = CrisisAlertTemplate(data as any);
          break;
        case 'weekly-digest':
          template = WeeklyDigestTemplate(data as any);
          break;
        case 'mention-notification':
          template = MentionNotificationTemplate(data as any);
          break;
        case 'welcome':
          template = WelcomeTemplate(data as any);
          break;
        case 'alert':
          template = AlertTemplate(data as any);
          break;
        case 'notification':
          template = NotificationTemplate(data as any);
          break;
        case 'email':
        default:
          template = EmailTemplate(data as any);
          break;
      }
      
      return render(template);
    } catch (error) {
      console.error('Error rendering template:', error);
      throw new Error(`Failed to render template: ${templateName}`);
    }
  }

  // Method to validate email addresses
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Method to retry failed email sends
  async sendEmailWithRetry(emailData: EmailData, maxRetries: number = 3): Promise<EmailResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.sendEmail(emailData);
      
      if (result.success) {
        return result;
      }

      lastError = result.error;
      console.warn(`Email send attempt ${attempt} failed: ${result.error}`);

      if (attempt < maxRetries) {
        // Exponential backoff: wait 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: `Email sending failed after ${maxRetries} attempts. Last error: ${lastError}`
    };
  }
}

export const emailService = new EmailService();
