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

const baseUrl = BASE_URL;

export const MentionNotificationTemplate = ({
  userName = 'there',
  mentionedBy = 'Someone',
  context = 'mentioned you in a discussion',
  postTitle,
  postContent,
  actionText = 'View Discussion',
  actionUrl = `${baseUrl}/dashboard`,
  timestamp = new Date().toISOString(),
}: MentionNotificationProps) => {
  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
      <Preview>{mentionedBy} mentioned you: {context}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={LOGO_DATA_URI}
              width="40"
              height="40"
              alt="BlueRelief"
              style={logo}
            />
            <Text style={brandName}>BlueRelief</Text>
          </Section>

          <Section style={content}>
            <Section style={mentionCard}>
              <Section style={iconCircle}>
                <Text style={iconText}>@</Text>
              </Section>
              <Heading style={titleText}>You were mentioned</Heading>
              <Text style={timestampText}>{formattedTime}</Text>
            </Section>

            <Text style={greeting}>Hi {userName},</Text>

            <Section style={mentionBox}>
              <Text style={mentionContent}>
                <Text style={mentionerName}>{mentionedBy}</Text> {context}
              </Text>
            </Section>

            {postTitle && (
              <Section style={postCard}>
                <Text style={postLabel}>Related Discussion</Text>
                <Text style={postTitleText}>"{postTitle}"</Text>
                {postContent && (
                  <Text style={postContentText}>{postContent}</Text>
                )}
              </Section>
            )}

            {actionText && actionUrl && (
              <Section style={buttonContainer}>
                <Link style={button} href={actionUrl}>
                  {actionText}
                </Link>
              </Section>
            )}
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because someone mentioned you on BlueRelief.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/dashboard`} style={footerLink}>
                Dashboard
              </Link>
              {' • '}
              <Link href={`${baseUrl}/settings`} style={footerLink}>
                Notification Settings
              </Link>
              {' • '}
              <Link href={`${baseUrl}/support`} style={footerLink}>
                Help
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
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto 8px',
  display: 'block',
};

const brandName = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
};

const content = {
  padding: '32px 40px',
};

const mentionCard = {
  backgroundColor: '#f0f9ff',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  border: '1px solid #bae6fd',
};

const iconCircle = {
  width: '48px',
  height: '48px',
  backgroundColor: '#0ea5e9',
  borderRadius: '50%',
  margin: '0 auto 16px',
};

const iconText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '48px',
  textAlign: 'center' as const,
};

const titleText = {
  color: '#0f172a',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.3',
};

const timestampText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
};

const greeting = {
  color: '#334155',
  fontSize: '16px',
  margin: '0 0 16px',
};

const mentionBox = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #3b82f6',
  borderRadius: '0 8px 8px 0',
  padding: '16px 20px',
  margin: '0 0 24px',
};

const mentionContent = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const mentionerName = {
  color: '#3b82f6',
  fontWeight: '600',
};

const postCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  overflow: 'hidden' as const,
  margin: '0 0 24px',
};

const postLabel = {
  backgroundColor: '#f8fafc',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  padding: '12px 20px',
  margin: '0',
  borderBottom: '1px solid #e2e8f0',
};

const postTitleText = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '600',
  fontStyle: 'italic' as const,
  padding: '16px 20px 8px',
  margin: '0',
  lineHeight: '1.4',
};

const postContentText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.6',
  padding: '0 20px 16px',
  margin: '0',
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

export default MentionNotificationTemplate;
