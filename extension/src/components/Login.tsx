import React, { useState } from 'react';
import type { MouseEvent } from 'react';
import { buf2hex, generateSalt, sha256 } from '../utils/encrypt';
import { loginState } from '../App';

// Define the expected structure for our webhook payload
interface WebhookPayload {
  username: string;
  timestamp: number;
  [key: string]: unknown;
}

interface SaltResponse {
  saltHex: string;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [status, setStatus] = useState('');

  const triggerWebhook = async (eventType: string, payload: WebhookPayload) => {
    console.log(`This ${eventType} finished and with payload:`, payload);
  };

  const handleLogin = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStatus("Logging in...");

    try {
      const getMasterMessage = {
        type: "GET_MASTER",
        masterUser: username
      };

      const getMasterResponse = await chrome.runtime.sendMessage(getMasterMessage);

      if (!getMasterResponse.success) {
        setStatus("Could not find account information. Error: " + getMasterResponse.error);
        return;
      }

      if (!getMasterResponse.data || getMasterResponse.data.length == 0) {
        // Couldn't find master user in database
        setStatus("Could not find username " + username);
      }

      const saltAndPass = new Map<string, string>(Object.entries(JSON.parse(getMasterResponse.data)));
      const salt = saltAndPass.keys().next().value;
      const saltedPass = salt + masterPass;
      const actualSaltedHashedPass = await sha256(saltedPass);
      const expectedSaltedHashedPass = saltAndPass.values().next().value;

      if (actualSaltedHashedPass === expectedSaltedHashedPass) {
        setStatus("Successfully logged in as " + username);
        loginState.masterUser = username;
        await triggerWebhook('USER_LOGIN_SUCCESS', { username, timestamp: Date.now() });
      } else {
        setStatus("Password incorrect; please try again.");
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login error:", error.message);
      } else {
        console.error("An unexpected error occurred:", error);
      }
      setStatus("Error connecting to the server.");
    }
  };

  return (
    <div className="login-component">
      <h3>Login</h3>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Master Password"
          value={masterPass}
          onChange={(e) => setMasterPass(e.target.value)}
          required
        />
        <button type="button" onClick={handleLogin}>Login</button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}