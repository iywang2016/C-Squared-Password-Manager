import React, { useState } from 'react';
import type { MouseEvent } from 'react';
import { sha256, deriveMasterKey, hex2buf, exportMasterKey } from '../../utils/encrypt';
import type { WebhookPayload } from '../../types';
import { loginState } from '../../App';
import './Login.css';

interface LoginProps {
  onLoginSuccess?: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
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
      const getSaltMessage = {
        type: "GET_SALT",
        masterUser: username
      };
      const getSaltResponse = await chrome.runtime.sendMessage(getSaltMessage);

      if (!getSaltResponse.success) {
        setStatus("Could not find account information. Error: " + getSaltResponse.error);
      } else {
        if (!getSaltResponse.data || getSaltResponse.data.length == 0) {
          setStatus("Could not find username " + username);
        } else {
          const salt = getSaltResponse.data;
          
          if (!salt) {
            console.error("Error logging in with username: " + username + ". Please try again");
          } else {
            const saltedHashedPass = await sha256(salt + masterPass);
            const getMasterMessage = {
              type: "GET_MASTER",
              masterUser: username,
              masterPassword: saltedHashedPass
            };
            const getMasterResponse = await chrome.runtime.sendMessage(getMasterMessage);
            
            if (!getMasterResponse.success) {
              setStatus("Could not log in. Error: " + getMasterResponse.error);
            } else if (!getMasterResponse.data || getMasterResponse.data.length == 0) {
              setStatus("Could not find username " + username);
              console.error(getMasterResponse);
            } else if (getMasterResponse.data == "false") {
              setStatus("Login information incorrect, please try again");
            } else {
              setStatus("Successfully logged in as " + username);

              const key = await deriveMasterKey(masterPass, hex2buf(salt));
              loginState.masterUser = username;
              loginState.salt = salt;
              loginState.saltedHashedPass = saltedHashedPass;
              loginState.masterKey = key;

              const exportedKey = await exportMasterKey(key);
              await chrome.runtime.sendMessage({
                type: "STORE_MASTER_KEY",
                key: exportedKey,
                username: username
              });

              await triggerWebhook('USER_LOGIN_SUCCESS', { username, timestamp: Date.now() });

              if (onLoginSuccess) {
                onLoginSuccess(username);
              }
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