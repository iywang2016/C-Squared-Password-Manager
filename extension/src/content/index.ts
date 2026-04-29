console.log("Content Scraper Script Loaded");

/**
 * Scrapes the current page for login fields.
 * Returns the DOM elements if found.
 */
function findLoginFields() {
  // Find the password field(s)
  const passwordFields = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]'));

  if (passwordFields.length === 0) {
    return null;
  }

  const passwordField = passwordFields[0];

  // Find username/email field
  let usernameField: HTMLInputElement | null = null;

  // If the html is well-formed they are in the same <form>
  if (passwordField.form) {
    usernameField = passwordField.form.querySelector<HTMLInputElement>('input[type="text"], input[type="email"]');
  }

  // If no <form> wrapper look for the closest text/email input preceding the password field.
  if (!usernameField) {
    const allTextInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"]'));
    for (const input of allTextInputs.reverse()) {
      const position = passwordField.compareDocumentPosition(input);
      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        usernameField = input;
        break;
      }
    }
  }

  return { usernameField, passwordField };
}

/**
 * Fills an HTML input field and triggers the necessary DOM events
 */
function fillField(element: HTMLInputElement, value: string) {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.style.backgroundColor = '#e8f0fe';
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CHECK_FOR_FORM") {
    const fields = findLoginFields();
    if (fields) {
      console.log("Debug: Found login form", fields);
      sendResponse({ hasForm: true });
    } else {
      sendResponse({ hasForm: false });
    }
  }

  // Try Autofill
  if (message.type === "AUTOFILL_CREDENTIALS") {
    const { username, password } = message.payload;
    const fields = findLoginFields();

    if (fields) {
      if (fields.usernameField && username) {
        fillField(fields.usernameField, username);
      }
      if (fields.passwordField && password) {
        fillField(fields.passwordField, password);
      }
      console.log("Debug: Successfully autofilled credentials.");
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "Couldn't autofill all details" });
    }
  }

  return true;
});