import {
  Body,
  Button,
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

interface PasswordResetTemplateProps {
  userName: string;
  resetLink: string;
  expiresIn?: string;
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

export const PasswordResetTemplate = ({
  userName = 'User',
  resetLink = 'https://bluerelief.com/reset-password',
  expiresIn = '1 hour',
}: PasswordResetTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your BlueRelief password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Logo />
            <Text style={brandName}>BlueRelief</Text>
          </Section>

          <Section style={headerSection}>
            <Text style={lockIcon}>🔐</Text>
            <Heading style={heading}>Password Reset Request</Heading>
          </Section>

          <Section style={contentSection}>
            <Text style={greetingText}>Hello {userName},</Text>
            
            <Text style={bodyText}>
              We received a request to reset your password for your BlueRelief account. 
              Click the button below to create a new password:
            </Text>

            <Section style={buttonContainer}>
              <Button style={resetButton} href={resetLink}>
                Reset Password
              </Button>
            </Section>

            <Text style={infoText}>
              This link will expire in <strong>{expiresIn}</strong>. If you didn't request 
              a password reset, you can safely ignore this email.
            </Text>

            <Hr style={divider} />

            <Section style={linkSection}>
              <Text style={linkText}>
                If the button doesn't work, copy and paste this link into your browser:
              </Text>
              <Link href={resetLink} style={linkUrl}>
                {resetLink}
              </Link>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>Security Note:</strong> For your account's security, never share 
                this email or link with anyone.
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerTitle}>BlueRelief</Text>
            <Text style={footerSubtitle}>Real-Time Crisis Detection System</Text>
            <Text style={footerText}>
              This is an automated message, please do not reply to this email.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://bluerelief.com/support" style={footerLink}>Support</Link>
              {' • '}
              <Link href="https://bluerelief.com/privacy" style={footerLink}>Privacy</Link>
              {' • '}
              <Link href="https://bluerelief.com/terms" style={footerLink}>Terms</Link>
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
  padding: '0',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden' as const,
};

const logoContainer = {
  padding: '32px 20px 24px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
};

const brandName = {
  color: '#020617',
  fontSize: '24px',
  fontWeight: '700',
  margin: '12px 0 0',
  textAlign: 'center' as const,
};

const headerSection = {
  background: 'linear-gradient(135deg, #196EE3 0%, #5B6FFF 100%)',
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const lockIcon = {
  fontSize: '48px',
  margin: '0 0 12px',
  lineHeight: '1',
};

const heading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.2',
};

const contentSection = {
  padding: '32px 20px',
};

const greetingText = {
  color: '#020617',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const bodyText = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const resetButton = {
  background: 'linear-gradient(135deg, #196EE3 0%, #5B6FFF 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
  boxShadow: '0 4px 12px rgba(25, 110, 227, 0.3)',
};

const infoText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '24px 0',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const linkSection = {
  margin: '24px 0',
};

const linkText = {
  color: '#475569',
  fontSize: '14px',
  margin: '0 0 8px',
};

const linkUrl = {
  color: '#5B6FFF',
  fontSize: '13px',
  wordBreak: 'break-all' as const,
  textDecoration: 'underline',
};

const warningBox = {
  backgroundColor: '#FFF7ED',
  borderLeft: '4px solid #FB923C',
  borderRadius: '4px',
  padding: '16px',
  margin: '24px 0',
};

const warningText = {
  color: '#9A3412',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const footerSection = {
  textAlign: 'center' as const,
  padding: '32px 20px',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
};

const footerTitle = {
  color: '#020617',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 4px',
};

const footerSubtitle = {
  color: '#475569',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0 0 16px',
};

const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 12px',
};

const footerLinks = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0',
};

const footerLink = {
  color: '#196EE3',
  textDecoration: 'none',
  fontWeight: '500',
};

export default PasswordResetTemplate;

