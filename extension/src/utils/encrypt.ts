const ITERATIONS = 600000; // OWASP
const MIN_PASSWORD_LENGTH: number = 15; // NIST

/** * Determine the strength of the given password by length based on NIST guidelines.
 *  All passwords must be checked with this function before stored
 *  @param password - password to check
 *  @return string[] - list of issues with the given password. Empty means valid.
 */
export function determineStrength(password: string): string[] {
  const issues: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push("Password is too short (minimum " + MIN_PASSWORD_LENGTH + " characters).");
  }

  if (issues.length === 0) {
    issues.push("No issues found.");
  }

  return issues;
}

/**
 * Converts a buffer to a Hex String.
 * Useful for sending salts and hashes
 */
export function buf2hex(buffer: ArrayBuffer): string {
  return Array.prototype.map.call(
    new Uint8Array(buffer),
    x => ('00' + x.toString(16)).slice(-2)
  ).join('');
}

/**
 * Converts a Hex String back to a buffer
 * Useful for turning the salt fetched from the DB back into a usable buffer.
 */
export function hex2buf(hexString: string): Uint8Array {
  const match = hexString.match(/.{1,2}/g);
  return new Uint8Array(match ? match.map(byte => parseInt(byte, 16)) : []);
}

/**
 * Generates a secure random 16-byte salt using the browser's crypto API.
 * Should only be used during master account registration
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Derives the Master Key from the password and salt.
 * This key is kept in memory to encrypt/decrypt the user's stored logins.
 *   @param password - The user's plaintext master password
 *   @param salt - The unique 16-byte salt for this user
 *   @returns CryptoKey - The AES-GCM 256-bit key
 */
export async function deriveMasterKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();

  // Just grab the raw password
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive the Master Key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt),
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Hashes the Master Key to create the Auth Hash.
 * This is the value sent to the backend to prove the user knows their password.
 *   @param masterKey - The derived AES-256 key
 *   @returns string - A hex string representing the SHA-256 hash of the master key
 */
export async function createAuthHash(masterKey: CryptoKey): Promise<string> {
  const exportedKey = await window.crypto.subtle.exportKey("raw", masterKey);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", exportedKey);
  return buf2hex(hashBuffer);
}