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

interface MentionNotificationProps {
  userName: string;
  mentionedBy: string;
  context: string;
  postTitle?: string;
  postContent?: string;
  actionText?: string;
  actionUrl?: string;
  timestamp?: string;
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

export const MentionNotificationTemplate = ({
  userName = 'User',
  mentionedBy = 'Someone',
  context = 'mentioned you in a post',
  postTitle,
  postContent,
  actionText = 'View Post',
  actionUrl = '#',
  timestamp = new Date().toISOString(),
}: MentionNotificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>{mentionedBy} mentioned you in a post</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Logo />
          </Section>

          <Section style={headerSection}>
            <Section style={iconCircle}>
              <Text style={mentionIcon}>💬</Text>
            </Section>
            <Heading style={titleText}>You've been mentioned!</Heading>
          </Section>

          <Section style={contentSection}>
            <Text style={greetingText}>Hello {userName},</Text>

            <Section style={mentionBox}>
              <Text style={mentionText}>
                <span style={mentionedByText}>{mentionedBy}</span> {context}
              </Text>
              <Text style={timestampText}>🕐 {new Date(timestamp).toLocaleString()}</Text>
            </Section>

            {postTitle && (
              <Section style={postSection}>
                <Section style={postHeader}>
                  <Text style={postLabel}>Related Post</Text>
                </Section>
                <Text style={postTitleText}>"{postTitle}"</Text>
                {postContent && <Text style={postContentText}>{postContent}</Text>}
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
            <Text style={footerText}>This notification was sent by BlueRelief.</Text>
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
  padding: '0 0 24px',
  textAlign: 'center' as const,
};

const headerSection = {
  textAlign: 'center' as const,
  padding: '24px 20px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #bae6fd',
  marginBottom: '24px',
};

const iconCircle = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: '#0ea5e9',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
};

const mentionIcon = {
  fontSize: '28px',
  margin: '0',
  lineHeight: '1',
};

const titleText = {
  color: '#020617',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.3',
};

const contentSection = {
  padding: '0',
};

const greetingText = {
  color: '#020617',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const mentionBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderLeft: '4px solid #6366f1',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 20px',
};

const mentionText = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const mentionedByText = {
  color: '#196EE3',
  fontWeight: '600',
};

const timestampText = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0',
};

const postSection = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '0',
  margin: '0 0 24px',
  overflow: 'hidden',
};

const postHeader = {
  backgroundColor: '#f8fafc',
  padding: '12px 16px',
  borderBottom: '1px solid #e2e8f0',
};

const postLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
};

const postTitleText = {
  color: '#020617',
  fontSize: '16px',
  fontWeight: '600',
  margin: '16px 16px 12px',
  fontStyle: 'italic' as const,
  lineHeight: '1.4',
};

const postContentText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 16px 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const actionButton = {
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

export default MentionNotificationTemplate;
