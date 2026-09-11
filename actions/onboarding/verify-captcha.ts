'use server';

import { fetchRecaptchaAssessment } from '@/lib/recaptcha';
import { errorText } from '@/lib/error-handler';

export async function verifyCaptchaToken(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: await errorText('config.missing') };
  }

  try {
    const { success } = await fetchRecaptchaAssessment(secretKey, token);

    if (success) {
      return { success: true };
    }

    return { success: false, error: await errorText('auth.captchaFailed') };
  } catch {
    return { success: false, error: await errorText('auth.captchaFailed') };
  }
}
