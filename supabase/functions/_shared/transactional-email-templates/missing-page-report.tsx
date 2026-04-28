import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MatchVenezuelan'

interface MissingPageReportProps {
  brokenPath?: string
  language?: string
  referrer?: string
  userAgent?: string
  reporterEmail?: string
  note?: string
  reportedAt?: string
}

const MissingPageReportEmail = ({
  brokenPath = '(not provided)',
  language = '(unknown)',
  referrer = '(direct or unknown)',
  userAgent = '(unknown)',
  reporterEmail,
  note,
  reportedAt,
}: MissingPageReportProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Missing page reported on {SITE_NAME}: {brokenPath}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Missing page report</Heading>
        <Text style={lead}>
          A visitor on {SITE_NAME} hit a 404 page and used the in-page
          report button.
        </Text>

        <Section style={card}>
          <Text style={label}>Broken path</Text>
          <Text style={mono}>{brokenPath}</Text>

          <Text style={label}>Visitor language</Text>
          <Text style={value}>{language}</Text>

          <Text style={label}>Referrer</Text>
          <Text style={mono}>{referrer}</Text>

          <Text style={label}>User agent</Text>
          <Text style={monoSmall}>{userAgent}</Text>

          {reportedAt ? (
            <>
              <Text style={label}>Reported at</Text>
              <Text style={value}>{reportedAt}</Text>
            </>
          ) : null}
        </Section>

        {(reporterEmail || note) ? (
          <Section style={card}>
            <Heading as="h2" style={h2}>From the visitor</Heading>
            {reporterEmail ? (
              <>
                <Text style={label}>Reply-to email</Text>
                <Text style={value}>{reporterEmail}</Text>
              </>
            ) : null}
            {note ? (
              <>
                <Text style={label}>Note</Text>
                <Text style={quote}>{note}</Text>
              </>
            ) : null}
          </Section>
        ) : (
          <Text style={muted}>
            The visitor did not leave a note or contact email.
          </Text>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Sent automatically by the {SITE_NAME} 404 page.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MissingPageReportEmail,
  subject: (data: Record<string, any>) =>
    `[404] Missing page reported: ${data?.brokenPath ?? 'unknown path'}`,
  displayName: 'Missing page report (404)',
  to: 'sdm7001@hotmail.com',
  previewData: {
    brokenPath: '/es/profiles/missing-id',
    language: 'es',
    referrer: 'https://www.google.com/',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ...',
    reporterEmail: 'visitor@example.com',
    note: 'I clicked a link from Google and it did not work.',
    reportedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}
const container = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '560px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#1a0f1a',
  margin: '0 0 8px',
}
const h2 = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1a0f1a',
  margin: '0 0 12px',
}
const lead = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.55',
  margin: '0 0 24px',
}
const card = {
  border: '1px solid #ece6ec',
  borderRadius: '12px',
  padding: '18px 18px 6px',
  margin: '0 0 16px',
  backgroundColor: '#fbf8fb',
}
const label = {
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: '#8a7d8a',
  margin: '8px 0 4px',
}
const value = {
  fontSize: '14px',
  color: '#1a0f1a',
  margin: '0 0 12px',
  lineHeight: '1.5',
}
const mono = {
  fontSize: '13px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  color: '#1a0f1a',
  margin: '0 0 12px',
  wordBreak: 'break-all' as const,
}
const monoSmall = {
  fontSize: '12px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  color: '#55575d',
  margin: '0 0 12px',
  wordBreak: 'break-all' as const,
}
const quote = {
  fontSize: '14px',
  color: '#1a0f1a',
  lineHeight: '1.55',
  margin: '0 0 12px',
  padding: '10px 12px',
  borderLeft: '3px solid #b85a8b',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  whiteSpace: 'pre-wrap' as const,
}
const muted = {
  fontSize: '13px',
  color: '#8a7d8a',
  fontStyle: 'italic' as const,
  margin: '0 0 16px',
}
const hr = {
  borderColor: '#ece6ec',
  margin: '24px 0 16px',
}
const footer = {
  fontSize: '12px',
  color: '#8a7d8a',
  margin: '0',
}
