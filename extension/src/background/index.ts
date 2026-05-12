// Basing strong password on https://pages.nist.gov/800-63-4/sp800-63b.html
// - min 15 characters since it's a master password
const MIN_PASSWORD_LENGTH: number = 15;

// Store the session key as long as the browser stays open
let sessionMasterKey: CryptoKey | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  // Check for successful logins from popup
  if (message.type === "STORE_MASTER_KEY") {
    sessionMasterKey = message.key;
    console.log("Master key secured in background memory.");
    sendResponse({ success: true });
  }

  // Check requests from your popup to see if the user is currently logged in
  else if (message.type === "CHECK_LOGIN_STATUS") {
    sendResponse({ isLoggedIn: sessionMasterKey !== null });
  }

  // Clear session key on logout
  else if (message.type === "LOGOUT") {
    sessionMasterKey = null;
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

    const domainUrl = `http://localhost:8080/database/add_domain/${message.masterUser}`;

    fetch(domainUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.domain)
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
    const url = `http://localhost:8080/database/get_passwords/${message.masterUser}/${message.domain}`;

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
    const url = `http://localhost:8080/database/get_master/${message.masterUser}`;

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

  else if (message.type === "CHECK_MASTER_EXISTS") {
    console.log("CHECK_MASTER_EXISTS message received");
    const url = `http://localhost:8080/database/check_master_exists/${message.masterUser}`;

    fetch(url)
    .then(response => response.text())
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error("Could not check for master user", error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }

  else if (message.type === "GET_DOMAINS") {
    console.log("GET_DOMAINS message received");
    const url = `http://localhost:8080/database/get_domains/${message.masterUser}`;

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

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_UI" }).catch((err) => {
      console.log("Failed to load script and popup", err);
    });
  }
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
  // salting removed until DB connection
  // if (!checkSaltExistAndValid()) {
  //   salt = CSPRNG(SALT_LENGTH, 2);
  //   console.log("NEW SALT TIME")
  //   fs.writeFileSync(SALT_FILE_NAME, salt);
  // } else {
  //   salt = fs.readFileSync(SALT_FILE_NAME, 'utf8');
  // }
  const ptUint8 = new TextEncoder().encode(salt + input)
  const hashedAndEncoded = await crypto.subtle.digest('SHA-256', ptUint8);
  const hashHex = Array.from(new Uint8Array(hashedAndEncoded))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

// TODO: pull salt from DB and validate
/**
 * checks salt exists and is correct length based on SALT_FILE_NAME and SALT_LENGTH
 * @returns false if not does not exist or is invalid; true otherwise
 */
// function checkSaltExistAndValid() : boolean {
//   if (!fs.existsSync(SALT_FILE_NAME)) {
//     return false;
//   }

//   if (fs.existsSync(SALT_FILE_NAME)) {
//     const fileContents = fs.readFileSync(SALT_FILE_NAME, 'utf-8');
//     if (fileContents.length != SALT_LENGTH) {
//       return false;
//     }
//     // possibly check valid characters?
//   }
//   return true;
// }