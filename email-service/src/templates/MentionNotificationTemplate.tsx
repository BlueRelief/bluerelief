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

interface MentionNotificationProps {
  userName: string;
  mentionedBy: string;
  context: string;
  postTitle?: string;
  postContent?: string;
  actionText?: string;
  actionUrl?: string;
  timestamp?: string;
  logoUrl?: string;
}

export const MentionNotificationTemplate = ({
  userName = 'User',
  mentionedBy = 'Someone',
  context = 'mentioned you in a post',
  postTitle,
  postContent,
  actionText = 'View Post',
  actionUrl = '#',
  timestamp = new Date().toISOString(),
  logoUrl = 'https://bluerelief.com/logo.png',
}: MentionNotificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>{mentionedBy} mentioned you in a post</Preview>
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
            <Text style={mentionIcon}>💬</Text>
            <Heading style={titleText}>You've been mentioned!</Heading>
            <Text style={timestampText}>
              {new Date(timestamp).toLocaleString()}
            </Text>
          </Section>
          
          <Section style={contentSection}>
            <Text style={greetingText}>Hello {userName},</Text>
            <Text style={mentionText}>
              <strong>{mentionedBy}</strong> {context}
            </Text>
            
            {postTitle && (
              <Section style={postSection}>
                <Text style={postTitleText}>"{postTitle}"</Text>
                {postContent && (
                  <Text style={postContentText}>{postContent}</Text>
                )}
              </Section>
            )}
          </Section>
          
          {actionText && actionUrl && (
            <Section style={buttonContainer}>
              <Link style={actionButton} href={actionUrl}>
                {actionText}
              </Link>
            </Section>
          )}
          
          <Hr style={divider} />
          
          <Section style={footerSection}>
            <Text style={footerText}>
              This notification was sent by BlueRelief.
            </Text>
            <Text style={footerText}>
              <Link href="https://bluerelief.com/settings" style={linkText}>
                Manage your notification preferences
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
};

const mentionIcon = {
  fontSize: '32px',
  margin: '0 0 16px 0',
};

const titleText = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const timestampText = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 24px 0',
};

const contentSection = {
  padding: '0 20px 32px',
};

const greetingText = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 16px 0',
};

const mentionText = {
  color: '#333',
  fontSize: '18px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
};

const postSection = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
};

const postTitleText = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  fontStyle: 'italic' as const,
};

const postContentText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '0 20px',
};

const actionButton = {
  backgroundColor: '#007ee6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  boxShadow: '0 2px 4px rgba(0, 126, 230, 0.3)',
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

export default MentionNotificationTemplate;
