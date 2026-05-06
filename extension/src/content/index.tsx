import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import '../App.css';

console.log("Content Scraper Script Loaded");

/**
 * Scrapes the current page for login fields.
 * Returns the DOM elements if found.
 */
export function findLoginFields() {
  const passwordFields = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]'));
  if (passwordFields.length === 0) return null;

  const passwordField = passwordFields[0];
  let usernameField: HTMLInputElement | null = null;

  usernameField = document.querySelector<HTMLInputElement>(
    'input[required][autocomplete="username"], input[required][autocomplete="email"]'
  );

  if (!usernameField && passwordField.form) {
    usernameField = passwordField.form.querySelector<HTMLInputElement>(
      'input[type="text"], input[type="email"], input:not([type])'
    );
  }

  if (!usernameField) {
    const allInputs = Array.from(document.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input[type="email"], input:not([type])'
    ));
    for (const input of allInputs.reverse()) {
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
export function fillField(element: HTMLInputElement, value: string) {
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


const rootDiv = document.createElement('div');
rootDiv.id = 'c-squared-extension-root';
rootDiv.style.position = 'fixed';
rootDiv.style.top = '0';
rootDiv.style.left = '0';
rootDiv.style.width = '100vw';
rootDiv.style.height = '100vh';
rootDiv.style.pointerEvents = 'none';
rootDiv.style.zIndex = '2147483647';
document.body.appendChild(rootDiv);

const root = createRoot(rootDiv);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);