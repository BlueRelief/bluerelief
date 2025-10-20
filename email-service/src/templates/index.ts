export { EmailTemplate } from './EmailTemplate';
export { AlertTemplate } from './AlertTemplate';
export { NotificationTemplate } from './NotificationTemplate';
export { CrisisAlertTemplate } from './CrisisAlertTemplate';
export { WeeklyDigestTemplate } from './WeeklyDigestTemplate';
export { MentionNotificationTemplate } from './MentionNotificationTemplate';
export { WelcomeTemplate } from './WelcomeTemplate';

// Template registry for easy access
export const TEMPLATE_REGISTRY = {
  'email': 'EmailTemplate',
  'alert': 'AlertTemplate',
  'notification': 'NotificationTemplate',
  'crisis-alert': 'CrisisAlertTemplate',
  'weekly-digest': 'WeeklyDigestTemplate',
  'mention-notification': 'MentionNotificationTemplate',
  'welcome': 'WelcomeTemplate',
} as const;

export type TemplateName = keyof typeof TEMPLATE_REGISTRY;
