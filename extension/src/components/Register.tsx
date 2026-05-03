import React, { useState } from 'react';
import type { MouseEvent } from 'react';
import { generateSalt, deriveMasterKey, createAuthHash, buf2hex } from '../utils/encrypt';

// Could move this out to a separate file, it's also used in login.tsx being lazy though
// @cady do you want to do this?
interface WebhookPayload {
  username: string;
  timestamp: number;
  [key: string]: unknown;
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [status, setStatus] = useState('');

  const triggerWebhook = async (eventType: string, payload: WebhookPayload) => {
    console.log(`This ${eventType} finished and with payload:`, payload);
  };

  const handleRegister = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStatus("Generating something");

    try {
      const salt = generateSalt();
      const masterKey = await deriveMasterKey(masterPass, salt);
      const authHash = await createAuthHash(masterKey);

      // Dummy route must implement later
      const registerResponse = await fetch(`http://localhost:8080/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          saltHex: buf2hex(salt),
          authHash
        })
      });

      if (registerResponse.ok) {
        setStatus("Registration successful!");
        await triggerWebhook('Registered User', { username, timestamp: Date.now() });
      } else {
        setStatus("Registration failed");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Registration error:", error.message);
      } else {
        console.error("Likely that something crashed", error);
      }
      setStatus("An error occurred during registration.");
    }
  };

  // Add separate CSS later temp classnames and style for now
  return (
    <div className="register-component">
      <h3>Create Account</h3>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="New Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Strong Master Password"
          value={masterPass}
          onChange={(e) => setMasterPass(e.target.value)}
          required
          minLength={15}
        />
        <button type="button" onClick={handleRegister}>Register</button>
      </form>
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}