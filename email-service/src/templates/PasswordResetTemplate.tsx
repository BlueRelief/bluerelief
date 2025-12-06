import {
  Body,
  Button,
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

interface PasswordResetTemplateProps {
  userName: string;
  resetLink: string;
  expiresIn?: string;
}

const baseUrl = BASE_URL;

export const PasswordResetTemplate = ({
  userName = 'there',
  resetLink = `${baseUrl}/reset-password`,
  expiresIn = '1 hour',
}: PasswordResetTemplateProps) => {
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
      <Preview>Reset your BlueRelief password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={LOGO_DATA_URI}
              width="48"
              height="48"
              alt="BlueRelief"
              style={logo}
            />
            <Text style={brandName}>BlueRelief</Text>
          </Section>

          <Section style={iconSection}>
            <Section style={iconCircle}>
              <Text style={iconText}>🔐</Text>
            </Section>
            <Heading style={titleText}>Password Reset Request</Heading>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>

            <Text style={bodyText}>
              We received a request to reset the password for your BlueRelief account. 
              If you made this request, click the button below to create a new password.
            </Text>

            <Section style={buttonContainer}>
              <Button style={resetButton} href={resetLink}>
                Reset My Password
              </Button>
            </Section>

            <Text style={expiryText}>
              This link will expire in <strong>{expiresIn}</strong>. After that, you'll need 
              to request a new password reset.
            </Text>

            <Section style={linkSection}>
              <Text style={linkLabel}>
                If the button doesn't work, copy and paste this link into your browser:
              </Text>
              <Link href={resetLink} style={linkUrl}>
                {resetLink}
              </Link>
            </Section>

            <Section style={securityNotice}>
              <Text style={securityTitle}>🔒 Security Notice</Text>
              <Text style={securityText}>
                If you didn't request this password reset, you can safely ignore this email. 
                Your password will remain unchanged. Never share this link with anyone.
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated security email from BlueRelief.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/support`} style={footerLink}>
                Contact Support
              </Link>
              {' • '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>
                Terms of Service
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
  padding: '32px 40px',
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
  margin: '0',
};

const iconSection = {
  backgroundColor: '#f0f9ff',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e0f2fe',
};

const iconCircle = {
  width: '64px',
  height: '64px',
  backgroundColor: '#dbeafe',
  borderRadius: '50%',
  margin: '0 auto 16px',
};

const iconText = {
  fontSize: '32px',
  margin: '0',
  lineHeight: '64px',
  textAlign: 'center' as const,
};

const titleText = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.3',
};

const content = {
  padding: '32px 40px',
};

const greeting = {
  color: '#334155',
  fontSize: '16px',
  margin: '0 0 16px',
};

const bodyText = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 32px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
};

const resetButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 48px',
};

const expiryText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const linkSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px',
  border: '1px solid #e2e8f0',
};

const linkLabel = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0 0 8px',
};

const linkUrl = {
  color: '#3b82f6',
  fontSize: '13px',
  wordBreak: 'break-all' as const,
  textDecoration: 'underline',
};

const securityNotice = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '16px 20px',
};

const securityTitle = {
  color: '#c2410c',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const securityText = {
  color: '#ea580c',
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

export default PasswordResetTemplate;
