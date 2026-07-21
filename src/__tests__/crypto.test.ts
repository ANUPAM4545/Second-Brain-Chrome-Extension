import { describe, it, expect } from 'vitest';
import { CryptoUtils } from '../utils/crypto';

describe('CryptoUtils', () => {
  it('should generate a consistent SHA-256 hash', async () => {
    const text = 'This is the exact same content.';

    const hash1 = await CryptoUtils.generateSHA256Hash(text);
    const hash2 = await CryptoUtils.generateSHA256Hash(text);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex is 64 chars
  });

  it('should generate different hashes for different content', async () => {
    const hash1 = await CryptoUtils.generateSHA256Hash('Version 1');
    const hash2 = await CryptoUtils.generateSHA256Hash('Version 2');

    expect(hash1).not.toBe(hash2);
  });
});
