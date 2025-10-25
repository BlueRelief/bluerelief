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

interface WelcomeTemplateProps {
  userName: string;
  userEmail: string;
  dashboardUrl?: string;
  settingsUrl?: string;
  helpUrl?: string;
}

const Logo = () => (
  <svg
    width="56"
    height="56"
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

export const WelcomeTemplate = ({
  userName = 'User',
  userEmail = 'user@example.com',
  dashboardUrl = 'https://bluerelief.com/dashboard',
  settingsUrl = 'https://bluerelief.com/settings',
  helpUrl = 'https://bluerelief.com/help',
}: WelcomeTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BlueRelief, {userName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Logo />
          </Section>
          
          <Section style={headerSection}>
            <Text style={welcomeIcon}>🎉</Text>
            <Heading style={titleText}>Welcome to BlueRelief!</Heading>
            <Text style={subtitleText}>
              Your emergency response platform is ready
            </Text>
          </Section>
          
          <Section style={contentSection}>
            <Text style={greetingText}>Hello {userName},</Text>
            <Text style={bodyText}>
              Thank you for joining BlueRelief! We're excited to have you as part of our 
              emergency response community. You're now connected to real-time crisis 
              information and can help make a difference in emergency situations.
            </Text>
            
            <Section style={featuresSection}>
              <Text style={featuresTitle}>What you can do with BlueRelief</Text>
              
              <Section style={featureItem}>
                <Text style={featureIcon}>📊</Text>
                <Section style={featureContent}>
                  <Text style={featureLabel}>Monitor Real-Time Data</Text>
                  <Text style={featureDescription}>Track crisis data and alerts as they happen</Text>
                </Section>
              </Section>
              
              <Section style={featureItem}>
                <Text style={featureIcon}>🌍</Text>
                <Section style={featureContent}>
                  <Text style={featureLabel}>Global Coverage</Text>
                  <Text style={featureDescription}>Track disasters and emergencies worldwide</Text>
                </Section>
              </Section>
              
              <Section style={featureItem}>
                <Text style={featureIcon}>📱</Text>
                <Section style={featureContent}>
                  <Text style={featureLabel}>Instant Notifications</Text>
                  <Text style={featureDescription}>Get alerts for emergencies in your area</Text>
                </Section>
              </Section>
              
              <Section style={featureItem}>
                <Text style={featureIcon}>📈</Text>
                <Section style={featureContent}>
                  <Text style={featureLabel}>Detailed Analytics</Text>
                  <Text style={featureDescription}>Access comprehensive reports and insights</Text>
                </Section>
              </Section>
            </Section>
            
            <Section style={actionSection}>
              <Link style={primaryButton} href={dashboardUrl}>
                Go to Dashboard
              </Link>
              <Link style={secondaryButton} href={settingsUrl}>
                Account Settings
              </Link>
            </Section>
            
            <Section style={helpSection}>
              <Text style={helpText}>
                Need help getting started? Check out our{' '}
                <Link href={helpUrl} style={helpLink}>help center</Link>{' '}
                for guides and tutorials.
              </Text>
            </Section>
          </Section>
          
          <Hr style={divider} />
          
          <Section style={footerSection}>
            <Text style={footerText}>
              Welcome to the BlueRelief community!
            </Text>
            <Text style={footerText}>
              <Link href="https://bluerelief.com/support" style={linkText}>
                Contact Support
              </Link> •{' '}
              <Link href="https://bluerelief.com/privacy" style={linkText}>
                Privacy Policy
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
  padding: '0 0 32px',
  textAlign: 'center' as const,
};

const headerSection = {
  textAlign: 'center' as const,
  padding: '24px 20px',
  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
  borderRadius: '8px',
  marginBottom: '32px',
};

const welcomeIcon = {
  fontSize: '48px',
  margin: '0 0 16px',
  lineHeight: '1',
};

const titleText = {
  color: '#020617',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.2',
};

const subtitleText = {
  color: '#475569',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.5',
};

const contentSection = {
  padding: '0',
};

const greetingText = {
  color: '#020617',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const bodyText = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const featuresSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
};

const featuresTitle = {
  color: '#020617',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const featureItem = {
  display: 'flex',
  alignItems: 'flex-start',
  margin: '0 0 16px',
};

const featureIcon = {
  fontSize: '24px',
  margin: '0 12px 0 0',
  lineHeight: '1',
  display: 'inline-block',
  verticalAlign: 'top',
};

const featureContent = {
  flex: '1',
  display: 'inline-block',
};

const featureLabel = {
  color: '#020617',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '1.4',
};

const featureDescription = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.4',
};

const actionSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const primaryButton = {
  backgroundColor: '#196EE3',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 8px 12px',
  boxShadow: '0 2px 4px rgba(25, 110, 227, 0.25)',
};

const secondaryButton = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  color: '#475569',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 8px 12px',
};

const helpSection = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const helpText = {
  color: '#1e40af',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.5',
};

const helpLink = {
  color: '#2563eb',
  textDecoration: 'underline',
  fontWeight: '500',
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

export default WelcomeTemplate;
