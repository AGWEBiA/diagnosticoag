/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({ siteName, token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        {siteName && (
          <Section style={brandBar}>
            <Text style={brandText}>{siteName}</Text>
          </Section>
        )}
        <Heading style={h1}>Confirme sua identidade</Heading>
        <Text style={text}>
          Use o código abaixo para confirmar a ação solicitada na sua conta:
        </Text>
        <Section style={codeBox}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          Este código expira em alguns minutos. Se você não solicitou esta verificação, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { borderBottom: '1px solid hsl(214.3, 31.8%, 91.4%)', paddingBottom: '16px', marginBottom: '24px' }
const brandText = { fontSize: '14px', fontWeight: 'bold' as const, color: 'hsl(222.2, 47.4%, 11.2%)', letterSpacing: '0.5px', margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(222.2, 84%, 4.9%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(215.4, 16.3%, 46.9%)', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = { backgroundColor: 'hsl(210, 40%, 96.1%)', borderRadius: '8px', padding: '20px', textAlign: 'center' as const, margin: '24px 0' }
const codeStyle = { fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(222.2, 47.4%, 11.2%)', letterSpacing: '6px', margin: 0 }
const footer = { fontSize: '12px', color: 'hsl(215.4, 16.3%, 46.9%)', margin: '32px 0 0', borderTop: '1px solid hsl(214.3, 31.8%, 91.4%)', paddingTop: '16px' }
