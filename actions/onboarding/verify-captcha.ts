'use server';

import type { TurnstileServerValidationResponse } from '@marsidev/react-turnstile';

const VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyCaptchaToken(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: 'Captcha not configured' };
  }

  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    const data = (await res.json()) as TurnstileServerValidationResponse;

    if (data.success) {
      return { success: true };
    }

    return { success: false, error: 'Verificación fallida. Intentá de nuevo.' };
  } catch {
    return { success: false, error: 'Error al verificar el captcha.' };
  }
}
