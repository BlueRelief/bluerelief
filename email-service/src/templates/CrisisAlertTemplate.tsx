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

interface CrisisAlertProps {
  disasterType: string;
  location: string;
  severity: string;
  description: string;
  affectedArea: string;
  timestamp?: string;
  actionText?: string;
  actionUrl?: string;
  logoUrl?: string;
}

export const CrisisAlertTemplate = ({
  disasterType = 'Emergency Alert',
  location = 'Unknown Location',
  severity = 'High',
  description = 'A crisis situation has been detected in your area.',
  affectedArea = 'Multiple areas affected',
  timestamp = new Date().toISOString(),
  actionText = 'View Details',
  actionUrl = '#',
  logoUrl = 'https://bluerelief.com/logo.png',
}: CrisisAlertProps) => {
  const severityColor = {
    'Low': '#28a745',
    'Medium': '#ffc107',
    'High': '#fd7e14',
    'Critical': '#dc3545'
  }[severity] || '#dc3545';

  const severityIcon = {
    'Low': '🟢',
    'Medium': '🟡',
    'High': '🟠',
    'Critical': '🔴'
  }[severity] || '🔴';

  return (
    <Html>
      <Head />
      <Preview>{disasterType} - {location} - {severity} Priority</Preview>
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
            <Heading style={alertTitle}>🚨 CRISIS ALERT</Heading>
            <Text style={disasterTypeText}>{disasterType}</Text>
            <Text style={{...severityBadge, backgroundColor: severityColor}}>
              {severityIcon} {severity} Priority
            </Text>
          </Section>
          
          <Section style={contentSection}>
            <Text style={locationText}>📍 Location: {location}</Text>
            <Text style={affectedAreaText}>🌍 Affected Area: {affectedArea}</Text>
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
              This is an automated crisis alert from BlueRelief Emergency Response System.
            </Text>
            <Text style={footerText}>
              <strong>Stay safe and follow local emergency guidelines.</strong>
            </Text>
            <Text style={footerText}>
              For immediate assistance, contact local emergency services.
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
  backgroundColor: '#fff3cd',
  borderRadius: '8px 8px 0 0',
  border: '2px solid #ffc107',
};

const alertTitle = {
  color: '#dc3545',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const disasterTypeText = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const severityBadge = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 20px',
  borderRadius: '25px',
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

const affectedAreaText = {
  color: '#666',
  fontSize: '16px',
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
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
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

export default CrisisAlertTemplate;
