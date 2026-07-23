'use server';

import { fetchRecaptchaAssessment } from '@/lib/recaptcha';

export async function verifyCaptchaToken(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: 'Captcha not configured' };
  }

  try {
    const { success } = await fetchRecaptchaAssessment(secretKey, token);

    if (success) {
      return { success: true };
    }

    return { success: false, error: 'Verificación fallida. Intentá de nuevo.' };
  } catch {
    return { success: false, error: 'Error al verificar el captcha.' };
  }
}
