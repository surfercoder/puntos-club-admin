'use server';

import { after } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import {
  createRegistrationToken,
  type PendingRegistration,
} from '@/lib/registration-token';
import { brandedEmailLayout, ctaButton } from '@/lib/email-template';
import { resend, EMAIL_FROM } from '@/lib/resend';

export async function initiateRegistration(input: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  redirectTo: string;
}): Promise<{ success: boolean; error?: string }> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ).replace(/\/+$/, '');

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
    Sentry.captureException(err, { tags: { area: 'onboarding.token' } });
    return { success: false, error: 'Error de configuración del servidor.' };
  }

  const verificationUrl = `${siteUrl}/auth/complete-registration?token=${token}`;

  // Dev fallback: no Resend API key → print link to server console
  if (!process.env.RESEND_API_KEY) {
    after(() => {
      console.warn('\n📧  [DEV] Verification URL (no RESEND_API_KEY set):\n');
      console.warn(' ', verificationUrl, '\n');
    });
    return { success: true };
  }

  const body = `
    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:22px;font-weight:700;color:#1A1A2E;margin:0 0 12px">
      ¡Hola, ${input.firstName}!
    </h2>
    <p style="font-family:'Lexend',Arial,sans-serif;font-size:15px;color:#374151;margin:0 0 8px;line-height:1.7">
      Gracias por registrarte en <strong style="color:#1A1A2E">Puntos Club</strong>.
      Un último paso: confirmá tu dirección de email para activar tu cuenta y
      comenzar a gestionar tus programas de fidelización.
    </p>
    ${ctaButton(verificationUrl, 'Confirmar mi email')}
    <p style="font-family:'Lexend',Arial,sans-serif;font-size:13px;color:#6B7280;margin:0;line-height:1.6">
      Este enlace expira en <strong>1&nbsp;hora</strong>. Si no creaste esta
      cuenta, podés ignorar este mensaje sin problema.
    </p>
  `;

  const footer = `
    <p style="margin:0 0 4px;font-size:13px;color:#6B7280;font-family:'Lexend',Arial,sans-serif">
      Si el botón no funciona, copiá y pegá este enlace en tu navegador:
    </p>
    <p style="margin:0 0 16px;font-size:11px;word-break:break-all">
      <a href="${verificationUrl}" style="color:#31A1D6">${verificationUrl}</a>
    </p>
    <p style="margin:0;font-size:12px;color:#6B7280;font-family:'Lexend',Arial,sans-serif">
      © ${new Date().getFullYear()} Puntos Club. Todos los derechos reservados.
    </p>
  `;

  const html = brandedEmailLayout(body, footer);

  const text = [
    `¡Hola, ${input.firstName}!`,
    '',
    'Gracias por registrarte en Puntos Club.',
    'Un último paso: confirmá tu dirección de email para activar tu cuenta.',
    '',
    'Hacé clic en el siguiente enlace para confirmar:',
    verificationUrl,
    '',
    'Este enlace expira en 1 hora.',
    'Si no creaste esta cuenta, podés ignorar este mensaje sin problema.',
    '',
    `© ${new Date().getFullYear()} Puntos Club. Todos los derechos reservados.`,
  ].join('\n');

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: input.email,
      subject: 'Confirma tu email - Puntos Club',
      html,
      text,
    });

    if (error) {
      console.error('[initiateRegistration] Resend error:', error);
      Sentry.captureException(error, {
        tags: { area: 'onboarding.email' },
        extra: { recipient: input.email },
      });
      return { success: false, error: 'No se pudo enviar el email de verificación.' };
    }
  } catch (err) {
    console.error('[initiateRegistration] Resend error:', err);
    Sentry.captureException(err, {
      tags: { area: 'onboarding.email' },
      extra: { recipient: input.email },
    });
    return { success: false, error: 'No se pudo enviar el email de verificación.' };
  }

  return { success: true };
}
