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
} from '@react-email/components';
import * as React from 'react';

interface WelcomeTemplateProps {
  userName: string;
  userEmail: string;
  dashboardUrl?: string;
  settingsUrl?: string;
  helpUrl?: string;
  logoUrl?: string;
}

export const WelcomeTemplate = ({
  userName = 'User',
  userEmail = 'user@example.com',
  dashboardUrl = 'https://bluerelief.com/dashboard',
  settingsUrl = 'https://bluerelief.com/settings',
  helpUrl = 'https://bluerelief.com/help',
  logoUrl = 'https://bluerelief.com/logo.png',
}: WelcomeTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BlueRelief, {userName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width="120"
              height="40"
              alt="BlueRelief"
              style={logo}
            />
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
            <Text style={welcomeText}>
              Thank you for joining BlueRelief! We're excited to have you as part of our 
              emergency response community. You're now connected to real-time crisis 
              information and can help make a difference in emergency situations.
            </Text>
            
            <Section style={featuresSection}>
              <Text style={featuresTitle}>🚀 What you can do with BlueRelief:</Text>
              <Text style={featureItem}>📊 Monitor real-time crisis data and alerts</Text>
              <Text style={featureItem}>🌍 Track disasters and emergencies worldwide</Text>
              <Text style={featureItem}>📱 Receive instant notifications for your area</Text>
              <Text style={featureItem}>🤝 Connect with emergency response teams</Text>
              <Text style={featureItem}>📈 Access detailed analytics and reports</Text>
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
              <Text style={helpTitle}>Need help getting started?</Text>
              <Text style={helpText}>
                Check out our <Link href={helpUrl} style={helpLink}>help center</Link> for 
                guides, tutorials, and best practices.
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
              </Link> • 
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

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const logoContainer = {
  padding: '32px 20px 20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const headerSection = {
  textAlign: 'center' as const,
  padding: '20px',
  backgroundColor: '#e8f5e8',
  borderRadius: '8px 8px 0 0',
};

const welcomeIcon = {
  fontSize: '48px',
  margin: '0 0 16px 0',
};

const titleText = {
  color: '#28a745',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const subtitleText = {
  color: '#666',
  fontSize: '16px',
  margin: '0 0 24px 0',
};

const contentSection = {
  padding: '32px 20px',
};

const greetingText = {
  color: '#333',
  fontSize: '18px',
  margin: '0 0 16px 0',
};

const welcomeText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
};

const featuresSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
};

const featuresTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const featureItem = {
  color: '#333',
  fontSize: '14px',
  margin: '0 0 8px 0',
  paddingLeft: '8px',
};

const actionSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const primaryButton = {
  backgroundColor: '#28a745',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  margin: '0 8px 8px 0',
  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
};

const secondaryButton = {
  backgroundColor: '#6c757d',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  margin: '0 8px 8px 0',
  boxShadow: '0 2px 4px rgba(108, 117, 125, 0.3)',
};

const helpSection = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
};

const helpTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const helpText = {
  color: '#333',
  fontSize: '14px',
  margin: '0',
};

const helpLink = {
  color: '#007ee6',
  textDecoration: 'none',
};

const divider = {
  borderColor: '#e9ecef',
  margin: '32px 0 24px',
};

const footerSection = {
  padding: '0 20px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6c757d',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};

const linkText = {
  color: '#007ee6',
  textDecoration: 'none',
};

export default WelcomeTemplate;
