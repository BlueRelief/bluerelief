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

interface Crisis {
  type: string;
  location: string;
  date: string;
  severity?: string;
}

interface WeeklyDigestProps {
  userName: string;
  weekStart: string;
  weekEnd: string;
  crisisCount: number;
  crises: Crisis[];
  dashboardUrl?: string;
}

const baseUrl = BASE_URL;

const severityColors: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#fef2f2', text: '#991b1b' },
  high: { bg: '#fff7ed', text: '#c2410c' },
  medium: { bg: '#fefce8', text: '#a16207' },
  low: { bg: '#f0fdf4', text: '#166534' },
};

export const WeeklyDigestTemplate = ({
  userName = 'there',
  weekStart = '2024-01-01',
  weekEnd = '2024-01-07',
  crisisCount = 0,
  crises = [],
  dashboardUrl = `${baseUrl}/dashboard`,
}: WeeklyDigestProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSeverityStyle = (severity?: string) => {
    const key = severity?.toLowerCase() || 'medium';
    return severityColors[key] || severityColors.medium;
  };

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
        Your Weekly Crisis Report: {String(crisisCount)} incidents • {formatDate(weekStart)} -{' '}
        {formatDate(weekEnd)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={LOGO_DATA_URI} width="48" height="48" alt="BlueRelief" style={logo} />
            <Text style={brandName}>BlueRelief</Text>
            <Text style={tagline}>Weekly Crisis Digest</Text>
          </Section>

          <Section style={dateRange}>
            <Text style={dateRangeText}>
              {formatDate(weekStart)} — {formatDate(weekEnd)}
            </Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>
            <Text style={introText}>
              Here's your weekly summary of crisis activity in your monitored areas.
            </Text>

            <Section style={statsCard}>
              <Text style={statsNumber}>{crisisCount}</Text>
              <Text style={statsLabel}>
                {crisisCount === 1 ? 'Incident Reported' : 'Incidents Reported'}
              </Text>
              <Text style={statsSubtext}>
                {crisisCount > 0
                  ? 'Review the details below to stay informed.'
                  : 'Great news! No major incidents in your monitored areas this week.'}
              </Text>
            </Section>

            {crises.length > 0 && (
              <Section style={incidentsSection}>
                <Text style={sectionTitle}>Recent Incidents</Text>

                {crises.slice(0, 5).map((crisis, index) => {
                  const severityStyle = getSeverityStyle(crisis.severity);
                  return (
                    <Section key={index} style={incidentCard}>
                      <Section style={incidentHeader}>
                        <Text style={incidentType}>{crisis.type}</Text>
                        {crisis.severity && (
                          <Text
                            style={{
                              ...severityBadge,
                              backgroundColor: severityStyle.bg,
                              color: severityStyle.text,
                            }}
                          >
                            {crisis.severity.toUpperCase()}
                          </Text>
                        )}
                      </Section>
                      <Text style={incidentLocation}>📍 {crisis.location}</Text>
                      <Text style={incidentDate}>📅 {formatDate(crisis.date)}</Text>
                    </Section>
                  );
                })}

                {crises.length > 5 && (
                  <Section style={moreIncidents}>
                    <Text style={moreText}>+ {crises.length - 5} more incidents this week</Text>
                  </Section>
                )}
              </Section>
            )}

            <Section style={buttonContainer}>
              <Link style={button} href={dashboardUrl}>
                View Full Dashboard
              </Link>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              This weekly digest is sent every Monday based on your notification preferences.
            </Text>
            <Text style={footerLinks}>
              <Link href={dashboardUrl} style={footerLink}>
                Dashboard
              </Link>
              {' • '}
              <Link href={`${baseUrl}/settings`} style={footerLink}>
                Manage Digest
              </Link>
              {' • '}
              <Link href={`${baseUrl}/support`} style={footerLink}>
                Support
              </Link>
            </Text>
            <Text style={footerAddress}>BlueRelief • Real-Time Crisis Detection System</Text>
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
  background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
  padding: '40px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto 12px',
  display: 'block',
};

const brandName = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 4px',
};

const tagline = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
  margin: '0',
};

const dateRange = {
  backgroundColor: '#f0f9ff',
  padding: '16px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e0f2fe',
};

const dateRangeText = {
  color: '#0369a1',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
};

const content = {
  padding: '32px 40px',
};

const greeting = {
  color: '#334155',
  fontSize: '16px',
  margin: '0 0 8px',
};

const introText = {
  color: '#64748b',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 24px',
};

const statsCard = {
  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center' as const,
  margin: '0 0 32px',
  border: '1px solid #bfdbfe',
};

const statsNumber = {
  color: '#1e40af',
  fontSize: '48px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1',
};

const statsLabel = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const statsSubtext = {
  color: '#3b82f6',
  fontSize: '14px',
  margin: '0',
};

const incidentsSection = {
  margin: '0 0 32px',
};

const sectionTitle = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 16px',
};

const incidentCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 12px',
};

const incidentHeader = {
  marginBottom: '8px',
};

const incidentType = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
  display: 'inline-block',
};

const severityBadge = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '4px',
  marginLeft: '8px',
  verticalAlign: 'middle',
};

const incidentLocation = {
  color: '#475569',
  fontSize: '14px',
  margin: '0 0 4px',
  lineHeight: '1.4',
};

const incidentDate = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0',
};

const moreIncidents = {
  backgroundColor: '#f8fafc',
  border: '1px dashed #cbd5e1',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
};

const moreText = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 8px',
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

export default WeeklyDigestTemplate;
