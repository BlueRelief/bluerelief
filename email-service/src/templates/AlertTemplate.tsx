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

interface AlertTemplateProps {
  alertType?: string;
  severity?: string;
  location?: string;
  description?: string;
  actionText?: string;
  actionUrl?: string;
  timestamp?: string;
  [key: string]: any;
}

const Logo = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 100 100"
    style={{ margin: '0 auto', display: 'block' }}
  >
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

export const AlertTemplate = ({
  alertType = 'Emergency Alert',
  severity = 'High',
  location = 'Unknown Location',
  description = 'An emergency situation has been detected in your area.',
  actionText = 'View Details',
  actionUrl = '#',
  timestamp = new Date().toISOString(),
  ...props
}: AlertTemplateProps) => {
  const severityColors = {
    'Low': { bg: '#22c55e', text: '#ffffff' },
    'Medium': { bg: '#f59e0b', text: '#ffffff' },
    'High': { bg: '#f97316', text: '#ffffff' },
    'Critical': { bg: '#ef4444', text: '#ffffff' }
  };

  const severityColor = severityColors[severity as keyof typeof severityColors] || severityColors.Critical;

  return (
    <Html>
      <Head />
      <Preview>{alertType} - {location}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Logo />
          </Section>
          
          <Section style={alertHeader}>
            <Text style={alertIcon}>⚠️</Text>
            <Heading style={alertTitle}>{alertType}</Heading>
            <Text style={{
              ...severityBadge,
              backgroundColor: severityColor.bg,
              color: severityColor.text
            }}>
              {severity} Priority
            </Text>
          </Section>
          
          <Section style={contentSection}>
            <Section style={metaContainer}>
              <Text style={metaItem}>
                <span style={metaIcon}>📍</span>
                <span style={metaText}>{location}</span>
              </Text>
              <Text style={metaItem}>
                <span style={metaIcon}>🕐</span>
                <span style={metaText}>{new Date(timestamp).toLocaleString()}</span>
              </Text>
            </Section>
            
            <Hr style={divider} />
            
            <Text style={descriptionText}>{description}</Text>
          </Section>
          
          {actionText && actionUrl && (
            <Section style={buttonContainer}>
              <Link style={actionButton} href={actionUrl}>
                {actionText}
              </Link>
            </Section>
          )}
          
          <Section style={footerSection}>
            <Text style={footerText}>
              This is an automated alert from BlueRelief Emergency Response System.
            </Text>
            <Text style={footerText}>
              Stay safe and follow local emergency guidelines.
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

const alertHeader = {
  textAlign: 'center' as const,
  padding: '24px 20px',
  backgroundColor: '#fef3f2',
  borderRadius: '8px',
  border: '1px solid #fecaca',
};

const alertIcon = {
  fontSize: '40px',
  margin: '0 0 12px',
  lineHeight: '1',
};

const alertTitle = {
  color: '#991b1b',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 16px',
  lineHeight: '1.2',
};

const severityBadge = {
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '20px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const contentSection = {
  padding: '32px 0',
};

const metaContainer = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 20px',
};

const metaItem = {
  color: '#334155',
  fontSize: '15px',
  margin: '0 0 8px',
  lineHeight: '1.5',
};

const metaIcon = {
  display: 'inline-block',
  marginRight: '8px',
  fontSize: '16px',
};

const metaText = {
  color: '#334155',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
};

const descriptionText = {
  color: '#020617',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const actionButton = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)',
};

const footerSection = {
  padding: '24px 0 0',
  borderTop: '1px solid #e2e8f0',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

export default AlertTemplate;
