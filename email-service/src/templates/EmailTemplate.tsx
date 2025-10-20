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
} from '@react-email/components';
import * as React from 'react';

interface EmailTemplateProps {
  title?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  logoUrl?: string;
  footerText?: string;
  [key: string]: any; // Allow additional props for template data
}

export const EmailTemplate = ({
  title = 'BlueRelief Notification',
  content = 'This is a notification from BlueRelief.',
  buttonText,
  buttonUrl,
  logoUrl = 'https://bluerelief.com/logo.png',
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
            <Img
              src={logoUrl}
              width="120"
              height="40"
              alt="BlueRelief"
              style={logo}
            />
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
          
          <Text style={footer}>
            {footerText}
          </Text>
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
};

const logoContainer = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '32px 0 0',
  textAlign: 'center' as const,
};

export default EmailTemplate;
