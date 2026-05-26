import React, { useState } from 'react';
import type { MouseEvent } from 'react';
import { sha256, deriveMasterKey, hex2buf } from '../../utils/encrypt';
import type { WebhookPayload, SaltResponse } from '../../types';
import { loginState } from '../../App';
import './Login.css';

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
      } else {
        if (!getMasterResponse.data || getMasterResponse.data.length == 0) {
          // Couldn't find master user in database
          setStatus("Could not find username " + username);
        } else {
          const saltAndPass = new Map<string, string>(Object.entries(JSON.parse(getMasterResponse.data)));
          const salt = saltAndPass.keys().next().value;
          if (!salt) {
            console.error("Could not get salt for username " + username);
          } else {
            const saltedPass = salt + masterPass;
            const actualSaltedHashedPass = await sha256(saltedPass);
            const expectedSaltedHashedPass = saltAndPass.values().next().value;

            if (actualSaltedHashedPass === expectedSaltedHashedPass) {
              setStatus("Successfully logged in as " + username);
              loginState.masterUser = username;
              loginState.masterKey = await deriveMasterKey(masterPass, hex2buf(salt));
              await triggerWebhook('USER_LOGIN_SUCCESS', { username, timestamp: Date.now() });
            } else {
              setStatus("Password incorrect; please try again.");
            }
          }
        }
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
      <form className="login-form">
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