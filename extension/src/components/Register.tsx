import React, { useState } from 'react';
import type { MouseEvent } from 'react';
import { generateSalt, deriveMasterKey, createAuthHash, buf2hex, sha256 } from '../utils/encrypt';
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
    setStatus("Registering...");

    try {
      // Before encrypting and allowing password, check strength and shame first
      if (determineStrength(masterPass).length != 0) {
        setStatus("That was very shameful :(");
        setShowShame(true);
      } else {
        if (!username) {
          setStatus("Master username must be at least 1 character");
          return;
        }
        setShowShame(false);
        
        const salt = buf2hex(generateSalt());
        const saltedPass = salt + masterPass;
        const saltedHashedPass = await sha256(saltedPass);

        const newMaster = {
          pass: saltedHashedPass,
          salt: salt,
          auth: "TESTING_AUTH"
        };

        const registerMessage = {
          type: "ADD_MASTER",
          masterUser: username,
          newMaster: newMaster
        };

        const registerResponse = await chrome.runtime.sendMessage(registerMessage);

        if (registerResponse.success) {
          setStatus("Registration successful!");
          await triggerWebhook('Registered User', { username, timestamp: Date.now() });
        } else {
          setStatus("Registration failed. Error: " + registerResponse.error);
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
