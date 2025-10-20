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

interface AlertTemplateProps {
  alertType?: string;
  severity?: string;
  location?: string;
  description?: string;
  actionText?: string;
  actionUrl?: string;
  timestamp?: string;
  logoUrl?: string;
  [key: string]: any;
}

export const AlertTemplate = ({
  alertType = 'Emergency Alert',
  severity = 'High',
  location = 'Unknown Location',
  description = 'An emergency situation has been detected in your area.',
  actionText = 'View Details',
  actionUrl = '#',
  timestamp = new Date().toISOString(),
  logoUrl = 'https://bluerelief.com/logo.png',
  ...props
}: AlertTemplateProps) => {
  const severityColor = {
    'Low': '#28a745',
    'Medium': '#ffc107',
    'High': '#fd7e14',
    'Critical': '#dc3545'
  }[severity] || '#dc3545';

  return (
    <Html>
      <Head />
      <Preview>{alertType} - {location}</Preview>
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
          
          <Section style={alertHeader}>
            <Heading style={alertTitle}>{alertType}</Heading>
            <Text style={{...severityBadge, backgroundColor: severityColor}}>
              {severity} Priority
            </Text>
          </Section>
          
          <Section style={contentSection}>
            <Text style={locationText}>📍 {location}</Text>
            <Text style={timestampText}>🕐 {new Date(timestamp).toLocaleString()}</Text>
            <Hr style={divider} />
            <Text style={descriptionText}>{description}</Text>
          </Section>
          
          {actionText && actionUrl && (
            <Section style={buttonContainer}>
              <Link style={actionButton} href={actionUrl}>
                {actionText}
              </Link>
            </Section>
          )}
          
          <Section style={footerSection}>
            <Text style={footerText}>
              This is an automated alert from BlueRelief Emergency Response System.
            </Text>
            <Text style={footerText}>
              Stay safe and follow local emergency guidelines.
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
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const logoContainer = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const alertHeader = {
  textAlign: 'center' as const,
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px 8px 0 0',
};

const alertTitle = {
  color: '#dc3545',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const severityBadge = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 16px',
  borderRadius: '20px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const contentSection = {
  padding: '32px 20px',
};

const locationText = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const timestampText = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 24px 0',
};

const divider = {
  borderColor: '#e9ecef',
  margin: '24px 0',
};

const descriptionText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '0 20px',
};

const actionButton = {
  backgroundColor: '#dc3545',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
};

const footerSection = {
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '0 0 8px 8px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6c757d',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};

export default AlertTemplate;
