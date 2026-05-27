import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { findLoginFields, fillField } from './content/index';
import { decryptAES256, determineStrength, encryptAES256, encryptAES256WithIV, generatePassword, hex2buf, buf2hex } from './utils/encrypt';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Shame from './components/Shame/Shame';

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
  const showShameRef = useRef(showShame);
  const [issues, setIssues] = useState<string[]>([]);

  const [currentView, setCurrentView] = useState<'login' | 'register' | 'autofill'>('login');

  const offset = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const oldUserPass = useRef({ username: '', password: '' });
  const lastChangeTime = useRef<number>(Date.now());
  const alreadyChecked = useRef(false);

  window.addEventListener('beforeunload', () => {
    const fields = findLoginFields();

    if (!fields) {
      return;
    }

    if (!fields.usernameField || !fields.passwordField) {
      return;
    }
    if (!fields.usernameField.value || !fields.passwordField.value ||
        fields.usernameField.value.length == 0 || fields.passwordField.value.length == 0) {
      setOutput("You don't have a username and password filled in <:(");
      return;
    }

    if (fields.passwordField.autocomplete.includes("current-password")) {
      return;
    }

    const username = fields.usernameField.value;
    const password = fields.passwordField.value;

    handleSave(username, password);
  });

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "TOGGLE_UI") {
        setIsVisible((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // logic for watching password field maybe should change bc it runs every 1s
  useEffect(() => {
    showShameRef.current = showShame;
  }, [showShame]);

  useEffect(() => {
    const checkFieldsInterval = setInterval(() => {
      const fields = findLoginFields();

      if (fields && fields.usernameField != null) {
        const currentUsername = fields.usernameField.value;
        const currentPassword = fields.passwordField.value;

        if (currentUsername !== oldUserPass.current.username ||
            currentPassword !== oldUserPass.current.password) {
          oldUserPass.current = { username: currentUsername,
                                  password: currentPassword };
          lastChangeTime.current = Date.now();
          alreadyChecked.current = false;
        } else {
          const lastChanged = Date.now() - lastChangeTime.current;
          if (lastChanged > 2000
            && !showShameRef.current
            && oldUserPass.current.password !== ''
            && oldUserPass.current.username !== ''
            && !alreadyChecked.current) {
            alreadyChecked.current = true;
            handleCheckPassword();
          }
        }
      }
    }, 1000);
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

    const loginsMap = await getPasswords(domain);

    if (!loginsMap) {
      setOutput("Error fetching applicable login information");
      return;
    }

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

  const handleSave = async (username: string, password: string) => {
    if (!loginState.masterUser || !loginState.masterKey) {
      console.error("Must log in to save passwords!");
      return;
    }

    const domain = window.location.hostname;

    if (!domain) {
      setOutput("Could not identify site domain");
      return;
    }

    const getSaltMessage = {
      type: "GET_MASTER",
      masterUser: loginState.masterUser
    };

    const getSaltResponse = await chrome.runtime.sendMessage(getSaltMessage);

    if (!getSaltResponse.success) {
      setOutput("Could not fetch account information. Error: " + getSaltResponse.error);
      return;
    }

    if (!getSaltResponse.data) {
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

  const handleCheckPassword = async () => {
    try {
      if (!loginState.masterUser || !loginState.masterKey) {
        console.error("Must log in to check passwords!");
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

        if (fields.passwordField.autocomplete.includes("current-password")) {
          return;
        }

        // TODO?: maybe display why the password is bad? since
        // determineStrength returns a list of potential issues

        const issue = await determineStrength(password, loginState.masterUser, loginState.masterKey);
        if (issue.length != 0) {
          setOutput("That was very shameful :(");
          setShowShame(true);
          setIssues(issue);
          // Set password input field to CSPRN
          const betterPassword = generatePassword();
          fillField(fields.passwordField, betterPassword);
        } else {
          setShowShame(false);
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
      <div className="popup-content">
        <div className="header-row">
          <h2>C_Squared PM</h2>

          <div className="header-actions">
            <button
              onClick={() => handleLogOut()}
              className="action-button logout-button"
              aria-label="Log Out"
            >
              Log Out
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="action-button close-button"
              aria-label="Close"
            >
              X
            </button>
          </div>
        </div>

        <div>
          <p className="status-text">{output}</p>
          {!showShame ? (<div>

          <div className="nav-container">
            <button
              onClick={() => setCurrentView('login')}
              className={`nav-button ${currentView === 'login' ? 'active' : ''}`}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentView('register')}
              className={`nav-button ${currentView === 'register' ? 'active' : ''}`}
            >
              Register
            </button>
            <button
              onClick={() => setCurrentView('autofill')}
              className={`nav-button ${currentView === 'autofill' ? 'active' : ''}`}
            >
              Autofill
            </button>
          </div>

          {currentView === 'login' && <Login />}
          {currentView === 'register' && <Register />}
          {currentView === 'autofill' && (
            <button
              className="autofill-button"
              onClick={handleAutofill}
            >
              Autofill Current Site
            </button>
          )}
          </div>) : (<Shame setShame={setShowShame} issues={issues}/>)}
        </div>
      </div>
    </div>
  );
}

export async function getPasswords(domain: string): Promise<Map<string, string> | undefined> {
  const getMessage = {
    type: "GET_PASSWORDS",
    masterUser: loginState.masterUser,
    domain: domain
  }

  console.log("Sending GET_PASSWORDS message");

  const response = await chrome.runtime.sendMessage(getMessage);

  console.log("Fetched passwords", response);

  if (!response.success) {
    return;
  }

  const loginsMap = new Map<string, string>(Object.entries(JSON.parse(response.data)));
  return loginsMap;
}