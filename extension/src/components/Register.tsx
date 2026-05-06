import React, { useState } from 'react';
import type { MouseEvent } from 'react';
import { generateSalt, deriveMasterKey, createAuthHash, buf2hex } from '../utils/encrypt';
import { determineStrength } from '../utils/encrypt';
import Shame from '../components/Shame';

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
  const [showShame, setShowShame] = useState(false);
  
  const triggerWebhook = async (eventType: string, payload: WebhookPayload) => {
    console.log(`This ${eventType} finished and with payload:`, payload);
  };

  const handleRegister = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStatus("Generating something");

    try {
      // Before encrypting and allowing password, check strength and shame first
      if (determineStrength(masterPass).length != 0) {
        setStatus("That was very shameful :(");
        setShowShame(true)
      } else {
        setShowShame(false);
        
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
      {!showShame ? (<div>
      <h3>Create Account</h3>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!showShame && <input
            type="text"
            placeholder="New Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          }
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
      </div>
      ) : (
        <Shame setShame={setShowShame}/>
      )}
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
