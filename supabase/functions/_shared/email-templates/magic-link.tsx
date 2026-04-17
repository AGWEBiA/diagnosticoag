/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso ao {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{siteName}</Text>
        </Section>
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>
          Clique no botão abaixo para entrar no <strong>{siteName}</strong>. Este link expira em alguns minutos.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Entrar agora
          </Button>
        </Section>
        <Text style={smallText}>
          Ou copie e cole este link no seu navegador:
          <br />
          <Link href={confirmationUrl} style={linkBreak}>{confirmationUrl}</Link>
        </Text>
        <Text style={footer}>
          Se você não solicitou este link, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { borderBottom: '1px solid hsl(214.3, 31.8%, 91.4%)', paddingBottom: '16px', marginBottom: '24px' }
const brandText = { fontSize: '14px', fontWeight: 'bold' as const, color: 'hsl(222.2, 47.4%, 11.2%)', letterSpacing: '0.5px', margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(222.2, 84%, 4.9%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(215.4, 16.3%, 46.9%)', lineHeight: '1.6', margin: '0 0 16px' }
const linkBreak = { color: 'hsl(222.2, 47.4%, 11.2%)', textDecoration: 'underline', wordBreak: 'break-all' as const }
const button = { backgroundColor: 'hsl(222.2, 47.4%, 11.2%)', color: 'hsl(210, 40%, 98%)', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const smallText = { fontSize: '12px', color: 'hsl(215.4, 16.3%, 46.9%)', lineHeight: '1.5', margin: '24px 0 0' }
const footer = { fontSize: '12px', color: 'hsl(215.4, 16.3%, 46.9%)', margin: '32px 0 0', borderTop: '1px solid hsl(214.3, 31.8%, 91.4%)', paddingTop: '16px' }
