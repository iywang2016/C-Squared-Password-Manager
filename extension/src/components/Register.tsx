import { generateSalt, deriveMasterKey, createAuthHash, buf2hex } from '../utils/encrypt';

async function _registerUser(_username: string, masterPass: string) {
  const salt = generateSalt();
  const masterKey = await deriveMasterKey(masterPass, salt);
  const authHash = await createAuthHash(masterKey);

  // TODO:
  // Send to backend: username, buf2hex(salt), and authHash
  // Backend stores these exactly
}