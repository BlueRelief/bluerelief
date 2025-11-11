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

interface CrisisAlertProps {
  disasterType: string;
  location: string;
  severity: string;
  description: string;
  affectedArea: string;
  timestamp?: string;
  actionText?: string;
  actionUrl?: string;
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

export const CrisisAlertTemplate = ({
  disasterType = 'Emergency Alert',
  location = 'Unknown Location',
  severity = 'High',
  description = 'A crisis situation has been detected in your area.',
  affectedArea = 'Multiple areas affected',
  timestamp = new Date().toISOString(),
  actionText = 'View Details',
  actionUrl = '#',
}: CrisisAlertProps) => {
  const severityConfig = {
    Low: { bg: '#22c55e', icon: '🟢' },
    Medium: { bg: '#f59e0b', icon: '🟡' },
    High: { bg: '#f97316', icon: '🟠' },
    Critical: { bg: '#ef4444', icon: '🔴' },
  };

  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.Critical;

  return (
    <Html>
      <Head />
      <Preview>
        {disasterType} - {location} - {severity} Priority
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Logo />
          </Section>

          <Section style={alertBanner}>
            <Text style={bannerIcon}>🚨</Text>
            <Heading style={bannerTitle}>CRISIS ALERT</Heading>
          </Section>

          <Section style={alertHeader}>
            <Heading style={disasterTypeText}>{disasterType}</Heading>
            <Text
              style={{
                ...severityBadge,
                backgroundColor: config.bg,
              }}
            >
              {config.icon} {severity} Priority
            </Text>
          </Section>

          <Section style={contentSection}>
            <Section style={infoGrid}>
              <Section style={infoCard}>
                <Text style={infoLabel}>Location</Text>
                <Text style={infoValue}>📍 {location}</Text>
              </Section>
              <Section style={infoCard}>
                <Text style={infoLabel}>Affected Area</Text>
                <Text style={infoValue}>🌍 {affectedArea}</Text>
              </Section>
              <Section style={infoCard}>
                <Text style={infoLabel}>Time</Text>
                <Text style={infoValue}>🕐 {new Date(timestamp).toLocaleString()}</Text>
              </Section>
            </Section>

            <Hr style={divider} />

            <Section style={descriptionSection}>
              <Text style={descriptionLabel}>Situation Details</Text>
              <Text style={descriptionText}>{description}</Text>
            </Section>
          </Section>

          {actionText && actionUrl && (
            <Section style={buttonContainer}>
              <Link style={actionButton} href={actionUrl}>
                {actionText}
              </Link>
            </Section>
          )}

          <Section style={warningBox}>
            <Text style={warningTitle}>⚠️ Safety Notice</Text>
            <Text style={warningText}>
              This is an automated crisis alert from BlueRelief Emergency Response System.
            </Text>
            <Text style={warningText}>
              <strong>Stay safe and follow local emergency guidelines.</strong>
            </Text>
            <Text style={warningText}>
              For immediate assistance, contact local emergency services.
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

const alertBanner = {
  backgroundColor: '#7f1d1d',
  textAlign: 'center' as const,
  padding: '16px',
  borderRadius: '8px 8px 0 0',
};

const bannerIcon = {
  fontSize: '32px',
  margin: '0 0 8px',
  lineHeight: '1',
};

const bannerTitle = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '2px',
  lineHeight: '1',
};

const alertHeader = {
  textAlign: 'center' as const,
  padding: '24px 20px',
  backgroundColor: '#fef3f2',
  borderRadius: '0 0 8px 8px',
  border: '1px solid #fecaca',
  borderTop: 'none',
  marginBottom: '24px',
};

const disasterTypeText = {
  color: '#020617',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px',
  lineHeight: '1.2',
};

const severityBadge = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 20px',
  borderRadius: '24px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const contentSection = {
  padding: '0',
};

const infoGrid = {
  margin: '0 0 20px',
};

const infoCard = {
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
};

const infoLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 6px',
};

const infoValue = {
  color: '#020617',
  fontSize: '15px',
  fontWeight: '500',
  margin: '0',
  lineHeight: '1.4',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const descriptionSection = {
  padding: '0',
};

const descriptionLabel = {
  color: '#020617',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const descriptionText = {
  color: '#334155',
  fontSize: '15px',
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
  padding: '16px 40px',
  boxShadow: '0 4px 6px rgba(239, 68, 68, 0.25)',
};

const warningBox = {
  backgroundColor: '#fffbeb',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0 0',
};

const warningTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const warningText = {
  color: '#78350f',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

export default CrisisAlertTemplate;
