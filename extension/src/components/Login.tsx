import { hex2buf, deriveMasterKey, createAuthHash } from '../utils/encrypt';

// TODO: Note the urls are hard coded rn
// Swap local hosts for a server later and also make a .env to do this lateer
// Also also add it to the gitignore!!

async function loginUser(username: string, masterPass: string) {
  // Request user's salt
  const response = await fetch(`http://localhost:8080/api/users/${username}/salt`);
  const { saltHex } = await response.json();

  // Decrypt and check with the salt
  const salt = hex2buf(saltHex);
  const masterKey = await deriveMasterKey(masterPass, salt);

  // Create auth hash and attempt login
  const authHash = await createAuthHash(masterKey);

  const loginResponse = await fetch(`http://localhost:8080/api/login`, {
    method: 'POST',
    body: JSON.stringify({ username, authHash })
  });

  if (loginResponse.ok) {
    console.log("Logged in! Key is loaded in memory.");
  }
}