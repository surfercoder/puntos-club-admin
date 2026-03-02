import crypto from 'crypto';

export interface PendingRegistration {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  redirectTo: string;
  expiresAt: number;
}

function getKey(): Buffer {
  const secret = process.env.REGISTRATION_SECRET;
  if (!secret) throw new Error('REGISTRATION_SECRET is not set in environment variables.');
  return crypto.createHash('sha256').update(secret).digest();
}

export function createRegistrationToken(data: PendingRegistration): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]).toString('base64url');
  const hmac = crypto.createHmac('sha256', key).update(combined).digest('base64url');
  return `${combined}.${hmac}`;
}

export function verifyRegistrationToken(token: string): PendingRegistration | null {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const combined = token.slice(0, dotIndex);
    const hmac = token.slice(dotIndex + 1);
    const key = getKey();

    const expectedHmac = crypto
      .createHmac('sha256', key)
      .update(combined)
      .digest('base64url');

    if (
      hmac.length !== expectedHmac.length ||
      !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))
    ) {
      return null;
    }

    const buf = Buffer.from(combined, 'base64url');
    const iv = buf.subarray(0, 16);
    const authTag = buf.subarray(16, 32);
    const encrypted = buf.subarray(32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    const data = JSON.parse(decrypted.toString('utf8')) as PendingRegistration;
    if (Date.now() > data.expiresAt) return null;

    return data;
  } catch {
    return null;
  }
}
