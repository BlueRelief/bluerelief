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

interface WelcomeTemplateProps {
  userName: string;
  userEmail: string;
  dashboardUrl?: string;
  settingsUrl?: string;
  helpUrl?: string;
}

const baseUrl = BASE_URL;

export const WelcomeTemplate = ({
  userName = 'there',
  userEmail = 'user@example.com',
  dashboardUrl = `${baseUrl}/dashboard`,
  settingsUrl = `${baseUrl}/settings`,
  helpUrl = `${baseUrl}/support`,
}: WelcomeTemplateProps) => {
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
      <Preview>Welcome to BlueRelief, {userName}! Your account is ready.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={LOGO_DATA_URI}
              width="56"
              height="56"
              alt="BlueRelief"
              style={logo}
            />
            <Text style={brandName}>BlueRelief</Text>
            <Text style={tagline}>Real-Time Crisis Detection</Text>
          </Section>

          <Section style={heroSection}>
            <Heading style={heroTitle}>Welcome aboard, {userName}!</Heading>
            <Text style={heroSubtitle}>
              Your account is now active. You're part of a community dedicated to 
              real-time emergency awareness and response.
            </Text>
          </Section>

          <Section style={content}>
            <Text style={sectionTitle}>Get Started</Text>
            
            <Section style={featureGrid}>
              <Section style={featureItem}>
                <Section style={featureIcon}>
                  <Text style={featureEmoji}>📊</Text>
                </Section>
                <Text style={featureTitle}>Live Dashboard</Text>
                <Text style={featureDesc}>
                  Monitor real-time crisis data and alerts from around the world
                </Text>
              </Section>

              <Section style={featureItem}>
                <Section style={featureIcon}>
                  <Text style={featureEmoji}>🔔</Text>
                </Section>
                <Text style={featureTitle}>Smart Alerts</Text>
                <Text style={featureDesc}>
                  Get notified about emergencies in areas you care about
                </Text>
              </Section>

              <Section style={featureItem}>
                <Section style={featureIcon}>
                  <Text style={featureEmoji}>🗺️</Text>
                </Section>
                <Text style={featureTitle}>Interactive Map</Text>
                <Text style={featureDesc}>
                  Visualize incidents on an interactive, real-time map
                </Text>
              </Section>

              <Section style={featureItem}>
                <Section style={featureIcon}>
                  <Text style={featureEmoji}>📈</Text>
                </Section>
                <Text style={featureTitle}>Analytics</Text>
                <Text style={featureDesc}>
                  Access insights and trends from crisis data
                </Text>
              </Section>
            </Section>

            <Section style={buttonContainer}>
              <Link style={primaryButton} href={dashboardUrl}>
                Open Your Dashboard
              </Link>
            </Section>

            <Section style={secondaryActions}>
              <Link style={secondaryLink} href={settingsUrl}>
                Set Up Alert Preferences
              </Link>
              <Text style={actionDivider}>•</Text>
              <Link style={secondaryLink} href={helpUrl}>
                View Help Guide
              </Link>
            </Section>
          </Section>

          <Section style={tipSection}>
            <Text style={tipTitle}>Quick Tip</Text>
            <Text style={tipText}>
              Set up your monitored locations in Settings to receive personalized 
              alerts about emergencies in areas that matter to you.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              This email confirms your BlueRelief account registration for {userEmail}.
            </Text>
            <Text style={footerLinks}>
              <Link href={dashboardUrl} style={footerLink}>
                Dashboard
              </Link>
              {' • '}
              <Link href={settingsUrl} style={footerLink}>
                Settings
              </Link>
              {' • '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy
              </Link>
              {' • '}
              <Link href={helpUrl} style={footerLink}>
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
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 4px',
  letterSpacing: '-0.5px',
};

const tagline = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
  margin: '0',
};

const heroSection = {
  backgroundColor: '#f0f9ff',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e0f2fe',
};

const heroTitle = {
  color: '#0f172a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 12px',
  lineHeight: '1.2',
};

const heroSubtitle = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const content = {
  padding: '32px 40px',
};

const sectionTitle = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const featureGrid = {
  margin: '0 0 32px',
};

const featureItem = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 12px',
  border: '1px solid #e2e8f0',
};

const featureIcon = {
  width: '40px',
  height: '40px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  margin: '0 0 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const featureEmoji = {
  fontSize: '20px',
  margin: '0',
  lineHeight: '40px',
  textAlign: 'center' as const,
};

const featureTitle = {
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px',
};

const featureDesc = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const primaryButton = {
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

const secondaryActions = {
  textAlign: 'center' as const,
};

const secondaryLink = {
  color: '#3b82f6',
  fontSize: '14px',
  textDecoration: 'none',
};

const actionDivider = {
  color: '#cbd5e1',
  fontSize: '14px',
  margin: '0 12px',
  display: 'inline',
};

const tipSection = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 40px 32px',
};

const tipTitle = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const tipText = {
  color: '#15803d',
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

export default WelcomeTemplate;
