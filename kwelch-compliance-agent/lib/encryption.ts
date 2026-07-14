// AES-256-GCM encryption for sensitive fields (EIN).
// The EIN is never logged, never sent to external APIs in plaintext,
// and is stored only as an encrypted blob + last-4 for display masking.
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Derives a stable 32-byte key from ENCRYPTION_KEY (any length secret) via
 * scrypt with a fixed app salt. If ENCRYPTION_KEY is unset, a dev-only key
 * file is created next to the database so local data survives restarts.
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || getOrCreateDevSecret();
  return crypto.scryptSync(secret, 'kwelch-compliance-agent-v1', 32);
}

function getOrCreateDevSecret(): string {
  // Lazy require so this file stays importable in edge-less server contexts.
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const file = path.join(process.cwd(), '.encryption-key');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

/** Encrypt plaintext → base64("iv.tag.ciphertext"). */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}

/** Decrypt a blob produced by encrypt(). Returns null on any failure. */
export function decrypt(blob: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = blob.split('.');
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return null;
  }
}

/** Normalize an EIN to digits only; returns null if not 9 digits. */
export function normalizeEIN(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return digits.length === 9 ? digits : null;
}
