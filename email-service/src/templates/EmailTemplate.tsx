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
} from '@react-email/components';
import * as React from 'react';

interface EmailTemplateProps {
  title?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  [key: string]: any;
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

export const EmailTemplate = ({
  title = 'BlueRelief Notification',
  content = 'This is a notification from BlueRelief.',
  buttonText,
  buttonUrl,
  footerText = 'This email was sent by BlueRelief Emergency Response System.',
  ...props
}: EmailTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Logo />
          </Section>

          <Heading style={h1}>{title}</Heading>

          <Text style={text}>{content}</Text>

          {buttonText && buttonUrl && (
            <Section style={buttonContainer}>
              <Link style={button} href={buttonUrl}>
                {buttonText}
              </Link>
            </Section>
          )}

          <Text style={footer}>{footerText}</Text>
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

const h1 = {
  color: '#020617',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 24px',
  padding: '0',
  textAlign: 'center' as const,
  lineHeight: '1.3',
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#196EE3',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  boxShadow: '0 2px 4px rgba(25, 110, 227, 0.25)',
};

const footer = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '32px 0 0',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
};

export default EmailTemplate;
