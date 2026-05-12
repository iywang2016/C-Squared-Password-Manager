import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { findLoginFields, fillField } from './content/index';
import { decryptAES256, deriveMasterKey, determineStrength, encryptAES256, generatePassword, hex2buf } from './utils/encrypt';
import Login from './components/Login';
import Register from './components/Register';
import Shame from './components/Shame';

interface LoginState {
  masterUser?: string,
  masterKey?: CryptoKey
};

export const loginState : LoginState = {};

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [output, setOutput] = useState("Welcome Back");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showShame, setShowShame] = useState(false);

  const [currentView, setCurrentView] = useState<'login' | 'register' | 'autofill' | 'save'>('login');

  const offset = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "TOGGLE_UI") {
        setIsVisible((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleAutofill = async () => {
    if (!loginState.masterUser || !loginState.masterKey) {
      setOutput("Must log in to use autofill!");
      return;
    }

    const domain = window.location.hostname;
    console.log("Found domain: " + domain);

    if (!domain) {
      setOutput("Could not identify site domain");
      return;
    }

    console.log("Starting autofill");

    const getMessage = {
      type: "GET_PASSWORDS",
      masterUser: loginState.masterUser,
      domain: domain
    }

    console.log("Sending GET_PASSWORDS message");

    const response = await chrome.runtime.sendMessage(getMessage);

    console.log("Fetched passwords", response);

    if (!response.success) {
      setOutput("Error fetching applicable login information: " + response.error);
      return;
    }

    const loginsMap = new Map<string, string>(Object.entries(JSON.parse(response.data)));

    if (loginsMap.size === 0) {
      setOutput("No logins saved for this site yet!");
      return;
    }

    // TODO: display all possible logins for user to choose from; only
    // get first one in map for now

    const encryptionResult = loginsMap.values().next().value;
    if (!encryptionResult) {
      console.error("Could not get login password value");
      return;
    }

    const split = encryptionResult.split("#");
    const encryptedPass = split[0];
    const iv = split[1];
    const decryptedPass = await decryptAES256(loginState.masterKey, hex2buf(encryptedPass).buffer, hex2buf(iv));

    const credentials = {
      username: loginsMap.keys().next().value,
      password: decryptedPass,
    };

    // if (response) {
    //   const masterKey = await deriveMasterKey("placeholder", window.crypto.getRandomValues(new Uint8Array(16)));
    //   const ciphertextArray = new TextEncoder().encode(response.logins.values().next().value).buffer;
  
    //   const credentials = {
    //     username: response.logins.keys().next().value,
    //     // TODO: placeholder AES key and IV
    //     password: await decryptAES256(masterKey, ciphertextArray, window.crypto.getRandomValues(new Uint8Array(16)))
    //   };
    // }

    try {
      const fields = findLoginFields();

      if (fields) {
        if (fields.usernameField && credentials.username) {
          fillField(fields.usernameField, credentials.username);
        }
        if (fields.passwordField && credentials.password) {
          fillField(fields.passwordField, credentials.password);
        }
        setOutput("Successful Autofill!");
      } else {
        setOutput("Bad autofill do better next time >:( Couldn't find fields");
      }
    } catch (error: any) {
      setOutput("Bad login do better next time >:( " + (error.message || "Unknown error"));
    }
  };

  const handleSave = async () => {
    try {
      if (!loginState.masterUser || !loginState.masterKey) {
        setOutput("Must log in to save passwords!");
        return;
      }

      const domain = window.location.hostname;

      if (!domain) {
        setOutput("Could not identify site domain");
        return;
      }

      const fields = findLoginFields();

      if (fields) {
        if (!fields.usernameField || !fields.passwordField) {
          setOutput("Could not find username or password field");
          return;
        }
        if (!fields.usernameField.value || !fields.passwordField.value ||
            fields.usernameField.value.length == 0 || fields.passwordField.value.length == 0) {
          setOutput("You don't have a username and password filled in <:(");
          return;
        }
        const username = fields.usernameField.value;
        const password = fields.passwordField.value;

        if (determineStrength(password).length != 0) {
          setOutput("That was very shameful :(");
          setShowShame(true);
          // Set password input field to CSPRN
          const betterPassword = generatePassword();
          fillField(fields.passwordField, betterPassword);
        } else {
          setShowShame(false);

          const getSaltMessage = {
            type: "GET_MASTER",
            masterUser: loginState.masterUser
          };

          const getSaltResponse = await chrome.runtime.sendMessage(getSaltMessage);

          if (!getSaltResponse.success) {
            setOutput("Could not fetch account information. Error: " + getSaltResponse.error);
            return;
          }

          if (!getSaltResponse.data || getSaltResponse.data.length == 0) {
            // Couldn't find master user in database
            setOutput("Could not find master username " + loginState.masterUser);
            return;
          }

          const saltAndPass = new Map<string, string>(Object.entries(JSON.parse(getSaltResponse.data)));
          const salt = saltAndPass.keys().next().value;
          if (!salt) {
            setOutput("Could not get salt for master username " + loginState.masterUser);
            return;
          }

          const encryptionResult = await encryptAES256(loginState.masterKey, password);

          // TODO: encryption
          const newLogin = {
            username: username,
            passwordAndIv: encryptionResult.encryptedPass + "#" + encryptionResult.iv,
          }

          const addMessage = {
            type: "ADD_PASSWORD",
            masterUser: loginState.masterUser,
            domain: domain,
            newLogin: newLogin
          };
    
          console.log("Sending ADD_PASSWORD message");
    
          const response = await chrome.runtime.sendMessage(addMessage);
    
          if (response.success) {
            setOutput("Successfully saved username and password for " + username); 
          } else {
            setOutput("Failed to save username :( error: " + response.error);
          }
        }
      }
    } catch (error: any) {
      setOutput("Bad login do better next time >:( " + (error.message || "Unknown error"));
    }
  }

  const handleLogOut = async () => {
    loginState.masterUser = undefined;
    loginState.masterKey = undefined;
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      let newX = e.clientX - offset.current.x;
      let newY = e.clientY - offset.current.y;

      if (popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect();

        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
      }

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className="floating-container"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed'
      }}
    >
      <div className="drag-handle" onMouseDown={handleMouseDown}></div>
      <div className="popup-content" style={{ position: 'relative' }}>

        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '5px'
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <button
          onClick={() => handleLogOut()}
          style={{
            position: 'absolute',
            top: '10px',
            right: '40px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: '5px'
          }}
          aria-label="Log Out"
        >
          Log Out
        </button>

        <h2>C_Squared PM</h2>
        <p className="status-text">{output}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => setCurrentView('login')}
            style={{ fontWeight: currentView === 'login' ? 'bold' : 'normal' }}
          >
            Login
          </button>
          <button
            onClick={() => setCurrentView('register')}
            style={{ fontWeight: currentView === 'register' ? 'bold' : 'normal' }}
          >
            Register
          </button>
          <button
            onClick={() => setCurrentView('autofill')}
            style={{ fontWeight: currentView === 'autofill' ? 'bold' : 'normal' }}
          >
            Autofill
          </button>
          <button
            onClick={() => setCurrentView('save')}
            style={{ fontWeight: currentView === 'save' ? 'bold' : 'normal' }}
          >
            Save Password
          </button>
        </div>

        {currentView === 'login' && <Login />}
        {currentView === 'register' && <Register />}
        {currentView === 'autofill' && (
          <button
            className="autofill-button"
            onClick={handleAutofill}
            style={{ width: '100%', padding: '10px' }}
          >
            Autofill Current Site
          </button>
        )}
        {currentView === 'save' && (
          <div className="register-component">
            {!showShame ? (<button
                className="save-button"
                onClick={handleSave}
                style={{ width: '100%', padding: '10px' }}
              >
                Save Password On Current Site
              </button>
            ) : (
              <Shame setShame={setShowShame}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}