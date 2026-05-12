const ITERATIONS = 600000; // OWASP
const MIN_PASSWORD_LENGTH: number = 15; // NIST

/**
 *  Determine the strength of the given password by length based on NIST guidelines.
 *  All passwords must be checked with this function before stored
 *  @param password - password to check
 *  @return string[] - list of issues with the given password. Empty means valid.
 */
export function determineStrength(password: string): string[] {
  const issues: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push("Password is too short (minimum " + MIN_PASSWORD_LENGTH + " characters).");
  }

  return issues;
}

/**
 * generates and returns a secure password with length equal to MIN_PASSWORD_LENGTH
 * @returns master password
 */
export function generatePassword(): string {
  let chars = 
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}<>?";
  let rands = window.crypto.getRandomValues(new Uint8Array(MIN_PASSWORD_LENGTH));
  let password = "";
  for (let i = 0; i < MIN_PASSWORD_LENGTH; i++) {
    password += chars.at(rands[i] % chars.length);
  }
  return password;
}


/** *********** UNFINISHED ***********
 * checks if the password exists in the API
 * @param password - plaintext string of the user's password to be checked
 * @returns promise resolving to true if the API has this password in its database, false otherwise
 */
async function findWithAPI(password: string): Promise<boolean> {
  // first check w hashed
  let hash = await sha256(password);
  let res = await getHashSuffixes(hash.substring(0, 5));
  if (hasMatch(hash.substring(5), res)) { return true; }

  // then check w email database?

  return false;
}

/**
 * returns the sha256 hash of the given plaintext
 * @param plaintext - text to be hashed
 */
export async function sha256(plaintext: string): Promise<string> {
  const data = new TextEncoder().encode(plaintext);
  const hashed = await window.crypto.subtle.digest('SHA-256', data);
  return hashToString(hashed);
}

/**
 * returns string version of the given buffer/hash
 * @param arrayBuffer - hash to turn into a string
 */
function hashToString(arrayBuffer : ArrayBuffer) {
  const uint8View = new Uint8Array(arrayBuffer);
  return Array.from(uint8View)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * returns true if res has a matching hash suffix with a nonzero count
 * (representing a likely-matching password in the database); returns false otherwise
 * @param hashSuffix - suffix of the user's currently-being-tested hashed password
 * @param res - contains suffixes and counts corresponding to the API response when 
 *    querying with the hash prefix
 * @returns  true if res has a matching hash suffix with a nonzero count
 */
export function hasMatch(hashSuffix: string, res: string[]): boolean {
  for (let i = 0; i < res.length; i++) {
    // formatted <HASH_SUFFIX>:<COUNT>
    let curr = res[i];
    let colon = curr.indexOf(":");
    let suf = curr.substring(0, colon);
    let count = Number(curr.substring(colon + 1));
    if (hashSuffix === suf && count > 0) {
      return true;
    }
  }
  return false;
}

/**
 * queries API of pawned passwords with the first 5 digits of this hash
 * @param hashPrefix - first 5 digits of the user's currently-being-tested hashed password
 * @returns response which contains all suffixes corresponding to that prefix, 
 * along with the count of passwords in their database matching that prefix & suffix
 */
async function getHashSuffixes(hashPrefix: string): Promise<string[]> {
  try {
    const headers: Headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('Add-Padding', 'true'); // pads responses by random amount
  
    let site: string = "https://api.pwnedpasswords.com/range/".concat(hashPrefix);
    const req: RequestInfo = new Request(site, { method: 'GET', headers: headers});
    // return fetch(req)
    //   .then(res => res.json())
    //   .then(res => {return res as string[];}); // todo: prob need to modify - copied from example
    const resp = await fetch(req);
    return resp.json().then(res => { return res as string[]; });
  } catch {
    console.error("Failed to access PwnedPasswords API");
    return [];
  }
}

/**
 * Converts a buffer or Uint8Array to a Hex String
 */
export function buf2hex(buffer: ArrayBuffer | Uint8Array): string {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  return Array.prototype.map.call(
    uint8,
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

/**
 * Encrypts the plaintext using the masterKey
 * @param masterKey - the AES-256 key used to encrypt and decrypt
 * @param plaintext - string (plaintext) of the user's password to be encrypted
 * @returns promise of tuple containing encrypted plaintext (aka ciphertext) 
 *          and iv used to encrypt
 */
export async function encryptAES256(masterKey: CryptoKey, plaintext: string): Promise<[ArrayBuffer, Uint8Array]> {
  // generate random iv (16 bytes)
  let iv = window.crypto.getRandomValues(new Uint8Array(16));
  let encoded = new TextEncoder().encode(plaintext);
  // encrypt w 128-bit auth tag
  const encrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv, tagLength: 128}, masterKey, encoded);
  return [encrypted, iv];
}

/**
 * Decrypts the encrypted password using the masterKey
 * @param masterKey - the AES-256 key used to encrypt and decrypt
 * @param ciphertext - encrypted user's password to be decrypted
 * @param iv - initialization vector used when encrypting this ciphertext - TODO: how to save/find it?
 * @returns promise of decrypted ciphertext (aka plaintext)
 */
export async function decryptAES256(masterKey: CryptoKey, ciphertext: ArrayBuffer, iv : Uint8Array<ArrayBuffer>): Promise<string> {
  let decrypted = await window.crypto.subtle.decrypt(
          {name: 'AES-GCM', iv: iv, tagLength: 128}, masterKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}