// Basing strong password on https://pages.nist.gov/800-63-4/sp800-63b.html
// - min 15 characters since it's a master password
const MIN_PASSWORD_LENGTH: number = 15;

// Store the session key and user as long as the browser stays open
let sessionMasterKey: string | null = null;
let sessionMasterUser: string | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  // Check for successful logins from popup
  if (message.type === "STORE_MASTER_KEY") {
    sessionMasterKey = message.key;
    sessionMasterUser = message.username;
    console.log("Master key secured in background memory.");
    sendResponse({ success: true });
  }

  // Check requests from your popup to see if the user is currently logged in
  else if (message.type === "CHECK_LOGIN_STATUS") {
    sendResponse({
      isLoggedIn: sessionMasterKey !== null,
      username: sessionMasterUser,
      key: sessionMasterKey
    });
  }

  // Clear session key on logout
  else if (message.type === "LOGOUT") {
    sessionMasterKey = null;
    sessionMasterUser = null;
    sendResponse({ success: true });
  }

  // Verifies password strength and sends encrypted password to DB
  else if (message.action === "HASH") {
    const issue = determineStrength(message.password);

    if (issue.length == 0) {
      (async () => {
        const hash = await hashPassword(message.password);
        sendResponse({ success: true, hash: hash });
      })();

      return true;
    } else {
      sendResponse({ success: false, message: issue });
    }
  }

  else if (message.type === "ADD_PASSWORD") {
    console.log("ADD_PASSWORD message received");
    const passwordUrl = `http://localhost:8080/database/add_password/${message.masterUser}/${message.domain}`;

    fetch(passwordUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.newLogin)
    })
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error("Could not add password", error);
        sendResponse({ success: false, error: error.message });
      });

    const domainUrl = `http://localhost:8080/database/add_domain/${message.masterUser}/${message.domain}`;

    fetch(domainUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: message.masterPassword
    })
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error("Could not add domain", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  else if (message.type === "GET_PASSWORDS") {
    console.log("GET_PASSWORDS message received");
    const url = `http://localhost:8080/database/get_passwords/${message.masterUser}/${message.domain}/${message.masterPassword}`;

    fetch(url)
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error("Could not get password", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  else if (message.type === "ADD_MASTER") {
    console.log("ADD_MASTER message received");
    const url = `http://localhost:8080/database/add_master/${message.masterUser}`;

    fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.newMaster)
    })
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error("Could not register master user", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  else if (message.type === "GET_MASTER") {
    console.log("GET_MASTER message received");
    const url = `http://localhost:8080/database/get_master/${message.masterUser}/${message.masterPassword}`;

    fetch(url)
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error("Could not get master user", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  else if (message.type === "GET_SALT") {
    console.log("GET_SALT message received");
    const url = `http://localhost:8080/database/get_salt/${message.masterUser}`;
    fetch(url)
    .then(response => response.text())
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error("Could not get salt for master user", error);
      sendResponse({ success: false, error: error.message });
    });

    return true;
  }

  else if (message.type === "GET_DOMAINS") {
    console.log("GET_DOMAINS message received");
    const url = `http://localhost:8080/database/get_domains/${message.masterUser}/${message.masterPassword}`;

    fetch(url)
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error("Could not get domains for master user", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  return true;
});

/**
 * determine the strength of the given password by length
 * @param password - password to check
 * @return issue - list of issues with the given password
 * or an empty array if nothing is wrong
 */
function determineStrength(password: string): string[] {
  const issues: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push("Password is too short (minimum " + MIN_PASSWORD_LENGTH + ").");
  }
  return issues;
}


/**
 * Function to generate a SHA-256 hash of a given input.
 * Generates or uses the salt at SALT_FILE_NAME
 * @param input - The input string to hash.
 * @returns The SHA-256 hash as a hexadecimal string.
 */
async function hashPassword(input: string): Promise<string> {
  let salt: string = "";
  const ptUint8 = new TextEncoder().encode(salt + input)
  const hashedAndEncoded = await crypto.subtle.digest('SHA-256', ptUint8);
  const hashHex = Array.from(new Uint8Array(hashedAndEncoded))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}