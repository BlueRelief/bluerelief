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

interface EmailTemplateProps {
  title?: string;
  content?: string;
  userName?: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  [key: string]: any;
}

const baseUrl = BASE_URL;

export const EmailTemplate = ({
  title = 'BlueRelief Notification',
  content = 'This is a notification from BlueRelief.',
  userName,
  buttonText,
  buttonUrl,
  footerText = 'This email was sent by BlueRelief Emergency Response System.',
  ...props
}: EmailTemplateProps) => {
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
      <Preview>{title}</Preview>
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

          <Section style={card}>
            <Heading style={heading}>{title}</Heading>

            {userName && (
              <Text style={greeting}>Hi {userName},</Text>
            )}

            <Text style={bodyText}>{content}</Text>

            {buttonText && buttonUrl && (
              <Section style={buttonContainer}>
                <Link style={button} href={buttonUrl}>
                  {buttonText}
                </Link>
              </Section>
            )}
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerTextStyle}>{footerText}</Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/dashboard`} style={footerLink}>
                Dashboard
              </Link>
              {' • '}
              <Link href={`${baseUrl}/settings`} style={footerLink}>
                Settings
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
  letterSpacing: '-0.5px',
};

const card = {
  padding: '40px',
};

const heading = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 24px',
  lineHeight: '1.3',
};

const greeting = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const bodyText = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
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
  padding: '14px 32px',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const footer = {
  padding: '32px 40px',
  backgroundColor: '#f8fafc',
};

const footerTextStyle = {
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

export default EmailTemplate;
