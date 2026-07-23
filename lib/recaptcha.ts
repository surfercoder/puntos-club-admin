const VERIFY_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Calls Google's reCAPTCHA siteverify endpoint. Kept out of the server action
 * so the action stays a thin wrapper around this integration call.
 */
export async function fetchRecaptchaAssessment(
  secretKey: string,
  token: string,
): Promise<{ success: boolean }> {
  const res = await fetch(VERIFY_ENDPOINT, {
    method: 'POST',
    body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) {
    return { success: false };
  }

  const data = await res.json();
  return { success: Boolean(data.success) };
}
