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
 
 interface BloqueioEmailProps {
   siteName: string
   empresaNome: string
   motivo: string
   supportEmail: string
   supportWhatsapp?: string
 }
 
 export const BloqueioEmail = ({
   siteName,
   empresaNome,
   motivo,
   supportEmail,
   supportWhatsapp,
 }: BloqueioEmailProps) => (
   <Html lang="pt-BR" dir="ltr">
     <Head />
     <Preview>Acesso ao diagnóstico de {empresaNome} bloqueado</Preview>
     <Body style={main}>
       <Container style={container}>
         <Section style={brandBar}>
           <Text style={brandText}>{siteName}</Text>
         </Section>
         <Heading style={h1}>Acesso Bloqueado</Heading>
         <Text style={text}>
           Olá,
         </Text>
         <Text style={text}>
           Informamos que o acesso ao diagnóstico estratégico da empresa <strong>{empresaNome}</strong> foi bloqueado em nossa plataforma.
         </Text>
         
         <Section style={reasonBox}>
           <Text style={reasonTitle}>Motivo do bloqueio:</Text>
           <Text style={reasonText}>{motivo}</Text>
         </Section>
 
         <Text style={text}>
           Geralmente, isso ocorre devido a solicitações de reembolso, estornos de cartão (chargeback) ou pendências na confirmação do pagamento.
         </Text>
 
         <Heading style={h2}>Como restaurar o acesso?</Heading>
         <Text style={text}>
           Se você acredita que houve um erro ou deseja regularizar sua situação para continuar acessando sua análise estratégica, entre em contato com nosso suporte:
         </Text>
 
         <Section style={{ margin: '24px 0' }}>
           <Text style={text}>
             📧 E-mail: <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>
           </Text>
           {supportWhatsapp && (
             <Text style={text}>
               📱 WhatsApp: <Link href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}`} style={link}>{supportWhatsapp}</Link>
             </Text>
           )}
         </Section>
 
         <Text style={footer}>
           Atenciosamente,<br />
           Equipe {siteName}
         </Text>
       </Container>
     </Body>
   </Html>
 )
 
 export default BloqueioEmail
 
 const main = { backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' }
 const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
 const brandBar = { borderBottom: '1px solid hsl(214.3, 31.8%, 91.4%)', paddingBottom: '16px', marginBottom: '24px' }
 const brandText = { fontSize: '14px', fontWeight: 'bold' as const, color: 'hsl(222.2, 47.4%, 11.2%)', letterSpacing: '0.5px', margin: 0 }
 const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(0, 84.2%, 60.2%)', margin: '0 0 20px' }
 const h2 = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(222.2, 84%, 4.9%)', margin: '24px 0 12px' }
 const text = { fontSize: '15px', color: 'hsl(215.4, 16.3%, 46.9%)', lineHeight: '1.6', margin: '0 0 12px' }
 const link = { color: 'hsl(222.2, 47.4%, 11.2%)', textDecoration: 'underline' }
 const reasonBox = { backgroundColor: 'hsl(0, 100%, 97%)', border: '1px solid hsl(0, 100%, 92%)', borderRadius: '8px', padding: '16px', margin: '24px 0' }
 const reasonTitle = { fontSize: '13px', fontWeight: 'bold' as const, color: 'hsl(0, 84.2%, 60.2%)', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
 const reasonText = { fontSize: '15px', color: 'hsl(222.2, 47.4%, 11.2%)', margin: 0, fontWeight: '500' as const }
 const footer = { fontSize: '12px', color: 'hsl(215.4, 16.3%, 46.9%)', margin: '32px 0 0', borderTop: '1px solid hsl(214.3, 31.8%, 91.4%)', paddingTop: '16px' }