import { createHash } from 'crypto';

export function computeContentHash(title: string, body: string): string {
  return createHash('sha256').update(`${title}|${body}`).digest('hex');
}
