import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Font,
} from '@react-email/components';
import * as React from 'react';
import { LOGO_DATA_URI, BASE_URL } from './logo';

interface AlertTemplateProps {
  alertType?: string;
  severity?: string;
  location?: string;
  description?: string;
  userName?: string;
  actionText?: string;
  actionUrl?: string;
  timestamp?: string;
  [key: string]: any;
}

const baseUrl = BASE_URL;

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  Low: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  Medium: { bg: '#fefce8', text: '#a16207', border: '#fde047' },
  High: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  Critical: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
};

export const AlertTemplate = ({
  alertType = 'Emergency Alert',
  severity = 'High',
  location = 'Unknown Location',
  description = 'An emergency situation has been detected in your area.',
  userName,
  actionText = 'View Details',
  actionUrl = `${baseUrl}/dashboard/alerts`,
  timestamp = new Date().toISOString(),
  ...props
}: AlertTemplateProps) => {
  const colors = severityColors[severity] || severityColors.High;
  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Lato"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        {severity} Priority: {alertType} in {location}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={LOGO_DATA_URI}
              width="40"
              height="40"
              alt="BlueRelief"
              style={logo}
            />
            <Text style={brandName}>BlueRelief</Text>
          </Section>

          <Section style={{ ...alertBanner, backgroundColor: colors.bg, borderColor: colors.border }}>
            <Text style={{ ...severityBadge, backgroundColor: colors.text }}>
              {severity.toUpperCase()} PRIORITY
            </Text>
            <Heading style={{ ...alertTitle, color: colors.text }}>{alertType}</Heading>
          </Section>

          <Section style={content}>
            {userName && (
              <Text style={greeting}>Hi {userName},</Text>
            )}

            <Text style={introText}>
              An alert has been issued for your monitored area. Please review the details below.
            </Text>

            <Section style={detailsCard}>
              <Section style={detailRow}>
                <Text style={detailLabel}>Location</Text>
                <Text style={detailValue}>{location}</Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Time Reported</Text>
                <Text style={detailValue}>{formattedTime}</Text>
              </Section>
              <Section style={detailRow}>
                <Text style={detailLabel}>Severity Level</Text>
                <Text style={{ ...detailValue, color: colors.text, fontWeight: '600' }}>
                  {severity}
                </Text>
              </Section>
            </Section>

            <Section style={descriptionSection}>
              <Text style={descriptionLabel}>Description</Text>
              <Text style={descriptionText}>{description}</Text>
            </Section>

            {actionText && actionUrl && (
              <Section style={buttonContainer}>
                <Link style={button} href={actionUrl}>
                  {actionText}
                </Link>
              </Section>
            )}

            <Section style={safetyNotice}>
              <Text style={safetyTitle}>Stay Safe</Text>
              <Text style={safetyText}>
                Follow local emergency guidelines and stay informed through official channels.
                If you're in immediate danger, contact emergency services.
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you have alert notifications enabled for this area.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/dashboard`} style={footerLink}>
                Dashboard
              </Link>
              {' • '}
              <Link href={`${baseUrl}/settings`} style={footerLink}>
                Manage Alerts
              </Link>
              {' • '}
              <Link href={`${baseUrl}/support`} style={footerLink}>
                Support
              </Link>
            </Text>
            <Text style={footerAddress}>
              BlueRelief • Real-Time Crisis Detection System
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Lato, Helvetica, Arial, sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
};

const header = {
  backgroundColor: '#1e3a5f',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto 8px',
  display: 'block',
};

const brandName = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
};

const alertBanner = {
  padding: '24px 40px',
  textAlign: 'center' as const,
  borderBottom: '3px solid',
};

const severityBadge = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '700',
  padding: '6px 16px',
  borderRadius: '20px',
  letterSpacing: '0.5px',
  margin: '0 0 12px',
};

const alertTitle = {
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.2',
};

const content = {
  padding: '32px 40px',
};

const greeting = {
  color: '#334155',
  fontSize: '16px',
  margin: '0 0 16px',
};

const introText = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const detailsCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 24px',
  border: '1px solid #e2e8f0',
};

const detailRow = {
  margin: '0 0 12px',
};

const detailLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const detailValue = {
  color: '#0f172a',
  fontSize: '15px',
  margin: '0',
  lineHeight: '1.4',
};

const descriptionSection = {
  margin: '0 0 24px',
};

const descriptionLabel = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const descriptionText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const safetyNotice = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '16px 20px',
};

const safetyTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const safetyText = {
  color: '#a16207',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const footer = {
  padding: '32px 40px',
  backgroundColor: '#f8fafc',
};

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const footerLinks = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#3b82f6',
  textDecoration: 'none',
};

const footerAddress = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '0',
  textAlign: 'center' as const,
};

export default AlertTemplate;
