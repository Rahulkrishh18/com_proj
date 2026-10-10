// ═══════════════════════════════════════════════════════════════════════
// F.R.I.D.A.Y. Cryptographic Authentication & Password Utility
// Standards-compliant Web Crypto API implementation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure random password with high entropy.
 * Format: FRIDAY-[STATION]-[RANDOM4]-[RANDOM4]
 */
export function generateSecurePassword(stationTag: 'ALPHA' | 'CHARLIE' | 'RELAY'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars 0/O, 1/I
  const randomBytes = new Uint8Array(8);
  window.crypto.getRandomValues(randomBytes);

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
  const saltBytes = new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);
  return Array.from(saltBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a password with salt using SHA-256 via Web Crypto API.
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}:FRIDAY_SALT_PEPPER_v2`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
