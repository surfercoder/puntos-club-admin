import { createHash } from 'crypto';
import { computeContentHash } from '@/lib/notifications/content-hash';

describe('computeContentHash', () => {
  it('returns a sha256 hex hash of title|body', () => {
    const title = 'Hello';
    const body = 'World';
    const expected = createHash('sha256').update('Hello\0World').digest('hex');

    expect(computeContentHash(title, body)).toBe(expected);
  });

  it('returns different hashes for different titles', () => {
    const hash1 = computeContentHash('Title A', 'Same body');
    const hash2 = computeContentHash('Title B', 'Same body');

    expect(hash1).not.toBe(hash2);
  });

  it('returns different hashes for different bodies', () => {
    const hash1 = computeContentHash('Same title', 'Body A');
    const hash2 = computeContentHash('Same title', 'Body B');

    expect(hash1).not.toBe(hash2);
  });

  it('returns the same hash for the same input', () => {
    const hash1 = computeContentHash('Test', 'Content');
    const hash2 = computeContentHash('Test', 'Content');

    expect(hash1).toBe(hash2);
  });

  it('returns a 64-character hex string', () => {
    const hash = computeContentHash('title', 'body');

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('handles empty strings', () => {
    const expected = createHash('sha256').update('\0').digest('hex');
    expect(computeContentHash('', '')).toBe(expected);
  });

  it('distinguishes "a|b" title with "c" body from "a" title with "b|c" body', () => {
    const hash1 = computeContentHash('a|b', 'c');
    const hash2 = computeContentHash('a', 'b|c');

    expect(hash1).not.toBe(hash2);
  });
});
