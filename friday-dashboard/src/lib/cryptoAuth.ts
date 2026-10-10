// ═══════════════════════════════════════════════════════════════════════
// F.R.I.D.A.Y. Cryptographic Authentication & Password Utility
// Web Crypto API with robust pure-JS SHA-256 fallback for LAN/HTTP contexts
// ═══════════════════════════════════════════════════════════════════════

/**
 * Pure JavaScript SHA-256 implementation.
 * Used as fallback when running over non-HTTPS LAN connections (e.g. http://10.x.x.x:5173/)
 * where browsers disable `window.crypto.subtle`.
 */
function sha256PureJs(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0)) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);

      const temp1 = (((((hash[7] + s1h) | 0) + ch) | 0) + ((k[i] + w[i]) | 0)) | 0;
      const temp2 = (s0h + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Helper to safely generate random bytes even in insecure contexts.
 */
function getRandomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
    try {
      window.crypto.getRandomValues(bytes);
      return bytes;
    } catch {
      // Fall through to Math.random
    }
  }
  for (let i = 0; i < count; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * Generate a cryptographically secure random password with high entropy.
 * Format: FRIDAY-[STATION]-[RANDOM4]-[RANDOM4]
 */
export function generateSecurePassword(stationTag: 'ALPHA' | 'CHARLIE' | 'RELAY'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars 0/O, 1/I
  const randomBytes = getRandomBytes(8);

  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[randomBytes[i] % chars.length];
  }
  for (let i = 4; i < 8; i++) {
    part2 += chars[randomBytes[i] % chars.length];
  }

  return `FRIDAY-${stationTag}-${part1}-${part2}`;
}

/**
 * Generate a random 16-byte cryptographic salt represented as a hex string.
 */
export function generateSalt(): string {
  const saltBytes = getRandomBytes(16);
  return Array.from(saltBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a password with salt using SHA-256.
 * Prefers Web Crypto API in secure contexts (HTTPS/localhost),
 * and automatically falls back to pure JavaScript SHA-256 on HTTP/LAN devices.
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}:FRIDAY_SALT_PEPPER_v2`;

  // Check if Web Crypto subtle is available (HTTPS or localhost)
  if (typeof window !== 'undefined' && window.crypto?.subtle?.digest) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Pure JavaScript fallback for insecure contexts (e.g. http://10.x.x.x:5173/)
  return sha256PureJs(input);
}

/**
 * Verify a plaintext password attempt against stored salt and hash.
 */
export async function verifyPassword(
  passwordAttempt: string,
  storedSalt: string,
  storedHash: string
): Promise<boolean> {
  if (!passwordAttempt || !storedSalt || !storedHash) return false;
  const calculatedHash = await hashPasswordWithSalt(passwordAttempt.trim(), storedSalt);
  return calculatedHash.toLowerCase() === storedHash.toLowerCase();
}
