import { createHash } from 'crypto';
import * as fs from 'fs';
import CSPRNG from 'csprng';

// Basing strong password on the following metrics - switched to be based on https://pages.nist.gov/800-63-4/sp800-63b.html
// - min 8 characters
// - rec 15 char?
// Currently ignoring these requirements:
// - does not include the username?
// - does not repeat the same character
// - includes a special character - not doing this based on wikipedia and this https://pages.nist.gov/800-63-4/sp800-63b/passwords/
// - needing both upper and lower casing
// - needing a special symbol

const MIN_PASSWORD_LENGTH: number = 15;
const SALT_FILE_NAME: string = "salt.txt";
const SALT_LENGTH: number = 160;



  /** 
  * determine the strength of the given password by length
  * @param password - password to check
  * @return issue - list of issues with the given password
  */
function determineStrength(password: string): string[] {
  const issues: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push("Password is too short (minimum " + MIN_PASSWORD_LENGTH + ").");
  }
  // const threshold = password.length * MAX_REPEAT_CHAR / 100;
  // const counts = new Map<string, number>();
  // const chars = [...password];
  // chars.forEach((character, index) => {
  //   counts.set(character, (counts.get(character) || 0 ) + 1);
  // });
  // counts.forEach((value, key) => {
  //   if (value > threshold && value > 1) {
  //     issues.push("Character repeating too often, more than " + MAX_REPEAT_CHAR + "% of the time. " + key);
  //   }
  // });
  if (issues.length == 0) {
    issues.push("No issues found.");
  }

  return issues;
}


/**
 * Function to generate a SHA-256 hash of a given input.
 * Generates or uses the salt at SALT_FILE_NAME
 * @param input - The input string to hash.
 * @returns The SHA-256 hash as a hexadecimal string.
 */
function hashPassword(input: string): string {
  let salt: string = "";
  if (!checkSaltExistAndValid()) {
    salt = CSPRNG(SALT_LENGTH, 2);
    console.log("NEW SALT TIME")
    fs.writeFileSync(SALT_FILE_NAME, salt);
  } else {
    salt = fs.readFileSync(SALT_FILE_NAME, 'utf8');
  }  
  return createHash('sha256').update(salt + input).digest('hex');
}

/**
 * checks salt exists and is correct length based on SALT_FILE_NAME and SALT_LENGTH
 * @returns false if not does not exist or is invalid; true otherwise
 */
function checkSaltExistAndValid() : boolean {
  if (!fs.existsSync(SALT_FILE_NAME)) {
    return false;
  }

  if (fs.existsSync(SALT_FILE_NAME)) {
    const fileContents = fs.readFileSync(SALT_FILE_NAME, 'utf-8');
    if (fileContents.length != SALT_LENGTH) {
      return false;
    }
    // possibly check valid characters?
  }
  return true;
}

console.log(determineStrength("test"));
console.log(determineStrength("testttttttttttt"));
console.log("Hashing password testtttttt " + hashPassword("testtttttt"));
console.log("Hashing password testttttttt " + hashPassword("testttttttt"));
console.log("Just the salt hashed " + hashPassword(""));
