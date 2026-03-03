'use server';

import nodemailer from 'nodemailer';

import {
  createRegistrationToken,
  type PendingRegistration,
} from '@/lib/registration-token';

export async function initiateRegistration(input: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  redirectTo: string;
}): Promise<{ success: boolean; error?: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const pending: PendingRegistration = {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    password: input.password,
    redirectTo: input.redirectTo,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  };

  let token: string;
  try {
    token = createRegistrationToken(pending);
  } catch (err) {
    console.error('[initiateRegistration] Token creation failed:', err);
    return { success: false, error: 'Error de configuración del servidor.' };
  }

  const verificationUrl = `${siteUrl}/auth/complete-registration?token=${token}`;

  // Dev fallback: no email credentials configured → print link to server console
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('\n📧  [DEV] Verification URL (no GMAIL_USER / GMAIL_APP_PASSWORD set):\n');
    console.warn(' ', verificationUrl, '\n');
    return { success: true };
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#111827">¡Hola, ${input.firstName}!</h2>
      <p style="color:#374151">
        Gracias por registrarte en <strong>Puntos Club</strong>. Haz clic en el
        botón para confirmar tu dirección de email y continuar con la
        configuración de tu cuenta.
      </p>
      <a
        href="${verificationUrl}"
        style="display:inline-block;background:#059669;color:#fff;padding:12px 28px;
               border-radius:6px;text-decoration:none;font-weight:600;margin:20px 0"
      >
        Confirmar email
      </a>
      <p style="color:#6b7280;font-size:14px">
        Este enlace expira en 1&nbsp;hora. Si no creaste esta cuenta, puedes
        ignorar este mensaje.
      </p>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Puntos Club" <${process.env.GMAIL_USER}>`,
      to: input.email,
      subject: 'Confirma tu email – Puntos Club',
      html,
    });
  } catch (err) {
    console.error('[initiateRegistration] Nodemailer error:', err);
    return { success: false, error: 'No se pudo enviar el email de verificación.' };
  }

  return { success: true };
}
