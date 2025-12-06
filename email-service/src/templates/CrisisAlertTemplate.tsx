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

interface CrisisAlertProps {
  disasterType: string;
  location: string;
  severity: string;
  description: string;
  affectedArea: string;
  userName?: string;
  timestamp?: string;
  actionText?: string;
  actionUrl?: string;
}

const baseUrl = BASE_URL;

const severityConfig: Record<string, { bg: string; text: string; border: string; headerBg: string }> = {
  Low: { bg: '#f0fdf4', text: '#166534', border: '#86efac', headerBg: '#22c55e' },
  Medium: { bg: '#fefce8', text: '#a16207', border: '#fde047', headerBg: '#eab308' },
  High: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74', headerBg: '#f97316' },
  Critical: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', headerBg: '#dc2626' },
};

export const CrisisAlertTemplate = ({
  disasterType = 'Emergency Alert',
  location = 'Unknown Location',
  severity = 'High',
  description = 'A crisis situation has been detected in your area.',
  affectedArea = 'Multiple areas affected',
  userName,
  timestamp = new Date().toISOString(),
  actionText = 'View Full Details',
  actionUrl = `${baseUrl}/dashboard/alerts`,
}: CrisisAlertProps) => {
  const config = severityConfig[severity] || severityConfig.Critical;
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
        CRISIS ALERT: {disasterType} - {severity} Priority - {location}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...alertHeader, backgroundColor: config.headerBg }}>
            <Text style={alertBadge}>CRISIS ALERT</Text>
            <Heading style={alertTitle}>{disasterType}</Heading>
            <Text style={severityText}>{severity} Priority</Text>
          </Section>

          <Section style={logoSection}>
            <Img
              src={LOGO_DATA_URI}
              width="32"
              height="32"
              alt="BlueRelief"
              style={logoInline}
            />
            <Text style={brandInline}>BlueRelief Alert System</Text>
          </Section>

          <Section style={content}>
            {userName && (
              <Text style={greeting}>Hi {userName},</Text>
            )}

            <Text style={introText}>
              A crisis has been reported in a location you monitor. Please review the details below 
              and take appropriate precautions.
            </Text>

            <Section style={detailsCard}>
              <Section style={detailRow}>
                <Text style={detailIcon}>📍</Text>
                <Section style={detailContent}>
                  <Text style={detailLabel}>Location</Text>
                  <Text style={detailValue}>{location}</Text>
                </Section>
              </Section>

              <Section style={detailRow}>
                <Text style={detailIcon}>🌍</Text>
                <Section style={detailContent}>
                  <Text style={detailLabel}>Affected Area</Text>
                  <Text style={detailValue}>{affectedArea}</Text>
                </Section>
              </Section>

              <Section style={detailRow}>
                <Text style={detailIcon}>🕐</Text>
                <Section style={detailContent}>
                  <Text style={detailLabel}>Time Reported</Text>
                  <Text style={detailValue}>{formattedTime}</Text>
                </Section>
              </Section>

              <Section style={{ ...detailRow, marginBottom: '0' }}>
                <Text style={detailIcon}>⚠️</Text>
                <Section style={detailContent}>
                  <Text style={detailLabel}>Severity Level</Text>
                  <Text style={{ ...severityBadgeInline, backgroundColor: config.bg, color: config.text, borderColor: config.border }}>
                    {severity}
                  </Text>
                </Section>
              </Section>
            </Section>

            <Section style={descriptionSection}>
              <Text style={descriptionLabel}>Situation Details</Text>
              <Text style={descriptionText}>{description}</Text>
            </Section>

            {actionText && actionUrl && (
              <Section style={buttonContainer}>
                <Link style={button} href={actionUrl}>
                  {actionText}
                </Link>
              </Section>
            )}

            <Section style={safetyBox}>
              <Text style={safetyTitle}>⚠️ Safety Guidelines</Text>
              <Text style={safetyText}>
                • Follow instructions from local emergency services{'\n'}
                • Stay informed through official news channels{'\n'}
                • If in immediate danger, call emergency services{'\n'}
                • Check on family, friends, and neighbors if safe to do so
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You received this alert because you have notifications enabled for this area.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/dashboard`} style={footerLink}>
                Dashboard
              </Link>
              {' • '}
              <Link href={`${baseUrl}/settings`} style={footerLink}>
                Alert Settings
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

const alertHeader = {
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const alertBadge = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
};

const alertTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.2',
};

const severityText = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const logoSection = {
  padding: '16px 40px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'center' as const,
};

const logoInline = {
  display: 'inline-block',
  verticalAlign: 'middle',
  marginRight: '8px',
};

const brandInline = {
  display: 'inline',
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  verticalAlign: 'middle',
  margin: '0',
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
  marginBottom: '16px',
};

const detailIcon = {
  fontSize: '16px',
  display: 'inline-block',
  width: '24px',
  verticalAlign: 'top',
  margin: '0',
};

const detailContent = {
  display: 'inline-block',
  width: 'calc(100% - 32px)',
  verticalAlign: 'top',
};

const detailLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 2px',
};

const detailValue = {
  color: '#0f172a',
  fontSize: '15px',
  margin: '0',
  lineHeight: '1.4',
};

const severityBadgeInline = {
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: '600',
  padding: '4px 12px',
  borderRadius: '4px',
  border: '1px solid',
  margin: '0',
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
  padding: '14px 40px',
};

const safetyBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '20px',
};

const safetyTitle = {
  color: '#92400e',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 12px',
};

const safetyText = {
  color: '#a16207',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
  whiteSpace: 'pre-line' as const,
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

export default CrisisAlertTemplate;

