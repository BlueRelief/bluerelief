import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface NotificationTemplateProps {
  title?: string;
  message?: string;
  type?: string;
  actionText?: string;
  actionUrl?: string;
  timestamp?: string;
  [key: string]: any;
}

const Logo = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" style={{ margin: '0 auto', display: 'block' }}>
    <defs>
      <mask id="logo-mask">
        <rect x="0" y="0" width="100" height="100" rx="20" ry="20" fill="white" />
        <rect x="25" y="25" width="50" height="50" rx="8" ry="8" fill="black" />
      </mask>
    </defs>
    <rect
      x="0"
      y="0"
      width="100"
      height="100"
      rx="20"
      ry="20"
      fill="#196EE3"
      mask="url(#logo-mask)"
    />
  </svg>
);

export const NotificationTemplate = ({
  title = 'BlueRelief Notification',
  message = 'You have a new notification from BlueRelief.',
  type = 'info',
  actionText,
  actionUrl,
  timestamp = new Date().toISOString(),
  ...props
}: NotificationTemplateProps) => {
  const typeConfig = {
    info: { bg: '#eff6ff', border: '#93c5fd', iconBg: '#3b82f6', icon: 'ℹ️' },
    success: { bg: '#f0fdf4', border: '#86efac', iconBg: '#22c55e', icon: '✅' },
    warning: { bg: '#fffbeb', border: '#fcd34d', iconBg: '#f59e0b', icon: '⚠️' },
    error: { bg: '#fef2f2', border: '#fca5a5', iconBg: '#ef4444', icon: '❌' },
  };

  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.info;

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Logo />
          </Section>

          <Section
            style={{
              ...headerSection,
              backgroundColor: config.bg,
              borderColor: config.border,
            }}
          >
            <Section
              style={{
                ...iconCircle,
                backgroundColor: config.iconBg,
              }}
            >
              <Text style={typeIconText}>{config.icon}</Text>
            </Section>
            <Heading style={titleText}>{title}</Heading>
          </Section>

          <Section style={contentSection}>
            <Section style={timestampContainer}>
              <Text style={timestampText}>🕐 {new Date(timestamp).toLocaleString()}</Text>
            </Section>

            <Text style={messageText}>{message}</Text>
          </Section>

          {actionText && actionUrl && (
            <Section style={buttonContainer}>
              <Link style={actionButton} href={actionUrl}>
                {actionText}
              </Link>
            </Section>
          )}

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              This notification was sent by BlueRelief Emergency Response System.
            </Text>
            <Text style={footerText}>
              <Link href="https://bluerelief.com/settings" style={linkText}>
                Manage your notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const logoContainer = {
  padding: '0 0 24px',
  textAlign: 'center' as const,
};

const headerSection = {
  textAlign: 'center' as const,
  padding: '32px 20px',
  borderRadius: '8px',
  border: '1px solid',
  marginBottom: '24px',
};

const iconCircle = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
};

const typeIconText = {
  fontSize: '28px',
  margin: '0',
  lineHeight: '1',
};

const titleText = {
  color: '#020617',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.3',
};

const contentSection = {
  padding: '0',
};

const timestampContainer = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 20px',
  border: '1px solid #e2e8f0',
};

const timestampText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.4',
};

const messageText = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const actionButton = {
  backgroundColor: '#196EE3',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  boxShadow: '0 2px 4px rgba(25, 110, 227, 0.25)',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const footerSection = {
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const linkText = {
  color: '#196EE3',
  textDecoration: 'none',
};

export default NotificationTemplate;
