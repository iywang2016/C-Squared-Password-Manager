import React, { useState } from 'react';
import type { MouseEvent } from 'react';
import { hex2buf, deriveMasterKey, createAuthHash } from '../utils/encrypt';

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
      const response = await fetch(`http://localhost:8080/api/users/${username}/salt`);

      if (!response.ok) {
        throw new Error("Failed to fetch user salt");
      }

      const { saltHex } = (await response.json()) as SaltResponse;


      const salt = hex2buf(saltHex);
      const masterKey = await deriveMasterKey(masterPass, salt);
      const authHash = await createAuthHash(masterKey);

      const loginResponse = await fetch(`http://localhost:8080/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authHash })
      });

      if (loginResponse.ok) {
        setStatus("Success! Key loaded in memory");

        await triggerWebhook('USER_LOGIN_SUCCESS', { username, timestamp: Date.now() });
      } else {
        setStatus("Login failed");
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