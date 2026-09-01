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
import { resend, EMAIL_FROM } from '@/lib/resend';

const CONTACT_RECIPIENT = 'acassani@puntosclub.com.ar';

export async function sendContactEmail(
  input: ContactFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = ContactSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: 'Invalid form data.' };
  }

  const { firstName, lastName, email, phoneNumber, business, message } = parsed.data;

  const fullName = `${firstName} ${lastName}`;

  if (!process.env.RESEND_API_KEY) {
    after(() =>
      console.warn(
        '\n📧  [DEV] Contact form submission (no RESEND_API_KEY set):',
        JSON.stringify({ firstName, lastName, email, phoneNumber, business, message }, null, 2),
        '\n'
      ),
    );
    return { success: true };
  }

  // El form de contacto es público: todo lo que llega se escapa antes de entrar al HTML.
  const rows = [
    { label: 'Nombre', value: esc(fullName) },
    { label: 'Email', value: `<a href="mailto:${esc(email)}" style="color:#FD7E14;text-decoration:none">${esc(email)}</a>` },
    { label: 'Teléfono', value: esc(phoneNumber) },
    ...(business ? [{ label: 'Empresa', value: esc(business) }] : []),
  ];

  const body = `
    ${sectionHeading('Nueva consulta')}
    ${subtitle('Recibiste un mensaje desde el formulario de contacto de la landing page.')}
    ${dataTable(rows)}
    ${messageBox('Mensaje', esc(message))}
  `;

  const html = brandedEmailLayout(body);

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `Nueva consulta de ${fullName}`,
      html,
    });

    if (error) {
      console.error('[sendContactEmail] Resend error:', error);
      Sentry.captureException(error, {
        tags: { area: 'contact.email' },
        extra: { sender: email },
      });
      return { success: false, error: 'Failed to send contact email.' };
    }
  } catch (err) {
    console.error('[sendContactEmail] Resend error:', err);
    Sentry.captureException(err, {
      tags: { area: 'contact.email' },
      extra: { sender: email },
    });
    return { success: false, error: 'Failed to send contact email.' };
  }

  return { success: true };
}
