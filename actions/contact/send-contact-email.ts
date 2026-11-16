'use server';

import { after } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ContactSchema } from '@/schemas/contact.schema';
import type { ContactFormData } from '@/schemas/contact.schema';
import {
  brandedEmailLayout,
  sectionHeading,
  subtitle,
  dataTable,
  esc,
  messageBox,
} from '@/lib/email-template';
import { errorText } from '@/lib/error-handler';

const CONTACT_RECIPIENT = 'acassani@puntosclub.com.ar';

export async function sendContactEmail(
  input: ContactFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = ContactSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: await errorText('contact.invalidData') };
  }

  const { name, email, phoneNumber, business, message } = parsed.data;

  if (!process.env.RESEND_API_KEY) {
    after(() =>
      console.warn(
        '\n📧  [DEV] Contact form submission (no RESEND_API_KEY set):',
        JSON.stringify({ name, email, phoneNumber, business, message }, null, 2),
        '\n'
      ),
    );
    return { success: true };
  }

  // El form de contacto es público: todo lo que llega se escapa antes de entrar al HTML.
  const rows = [
    { label: 'Nombre', value: esc(name) },
    { label: 'Email', value: `<a href="mailto:${esc(email)}" style="color:#FD7E14;text-decoration:none">${esc(email)}</a>` },
    ...(phoneNumber ? [{ label: 'Teléfono', value: esc(phoneNumber) }] : []),
    ...(business ? [{ label: 'Empresa', value: esc(business) }] : []),
  ];

  const body = `
    ${sectionHeading('Nueva consulta')}
    ${subtitle('Recibiste un mensaje desde el formulario de contacto de la home.')}
    ${dataTable(rows)}
    ${messageBox('Mensaje', esc(message))}
  `;

  const html = brandedEmailLayout(body);

  // Import diferido: lib/resend construye el cliente al cargar y sin key tira, así que
  // el fallback de dev de arriba sólo funciona si el módulo no se evalúa antes.
  const { resend, EMAIL_FROM } = await import('@/lib/resend');

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `Nueva consulta de ${name}`,
      html,
    });

    // Mismo manejo que si Resend tira: un solo lugar para loguear y avisar a Sentry.
    if (error) throw error;
  } catch (err) {
    console.error('[sendContactEmail] Resend error:', err);
    Sentry.captureException(err, {
      tags: { area: 'contact.email' },
      extra: { sender: email },
    });
    return { success: false, error: await errorText('contact.sendFailed') };
  }

  return { success: true };
}
