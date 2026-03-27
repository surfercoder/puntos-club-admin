'use server';

import nodemailer from 'nodemailer';
import { ContactSchema } from '@/schemas/contact.schema';
import type { ContactFormData } from '@/schemas/contact.schema';
import {
  brandedEmailLayout,
  sectionHeading,
  subtitle,
  dataTable,
  messageBox,
} from '@/lib/email-template';

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

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      '\n📧  [DEV] Contact form submission (no GMAIL credentials set):',
      JSON.stringify({ firstName, lastName, email, phoneNumber, business, message }, null, 2),
      '\n'
    );
    return { success: true };
  }

  const rows = [
    { label: 'Nombre', value: fullName },
    { label: 'Email', value: `<a href="mailto:${email}" style="color:#FD7E14;text-decoration:none">${email}</a>` },
    { label: 'Teléfono', value: phoneNumber },
    ...(business ? [{ label: 'Empresa', value: business }] : []),
  ];

  const body = `
    ${sectionHeading('Nueva consulta')}
    ${subtitle('Recibiste un mensaje desde el formulario de contacto de la landing page.')}
    ${dataTable(rows)}
    ${messageBox('Mensaje', message)}
  `;

  const html = brandedEmailLayout(body);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Puntos Club Contact" <${process.env.GMAIL_USER}>`,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `Nueva consulta de ${fullName}`,
      html,
    });
  } catch (err) {
    console.error('[sendContactEmail] Nodemailer error:', err);
    return { success: false, error: 'Failed to send contact email.' };
  }

  return { success: true };
}
