import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { findLoginFields, fillField } from './content/index';
import { decryptAES256, determineStrength, encryptAES256, generatePassword, hex2buf, importMasterKey } from './utils/encrypt';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Shame from './components/Shame/Shame';
import LoginList from './components/LoginList/LoginList';
import { stringify } from 'querystring';

interface LoginState {
  masterUser?: string,
  masterKey?: CryptoKey,
  saltedHashedPass?: string,
  salt?: string
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

  const [loggedInUser, setLoggedInUser] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'autofill' | 'list' | 'choose_login'>('login');
  const [availableLogins, setAvailableLogins] = useState(new Map<string, string>);

  const offset = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const oldUserPass = useRef({ username: '', password: '' });
  const lastChangeTime = useRef<number>(Date.now());
  const alreadyChecked = useRef(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: "CHECK_LOGIN_STATUS" });
        if (response && response.isLoggedIn && response.username && response.key) {
          loginState.masterUser = response.username;
          loginState.masterKey = await importMasterKey(response.key);

          setLoggedInUser(response.username);
          setOutput(`Welcome Back, ${response.username}`);
          setCurrentView('list');

          console.log("Session successfully restored from background!");
        }
      } catch (error) {
        console.log("No background session found or extension context invalidated.", error);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "TOGGLE_UI") {
        setIsVisible((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

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

    if (!domain) {
      setOutput("Could not identify site domain");
      return;
    }

    const loginsMap = await getPasswords(domain);

    if (!loginsMap) {
      setOutput("Error fetching applicable login information");
      return;
    }

    if (loginsMap.size === 0) {
      setOutput("No logins saved for this site yet!");
      return;
    }

    setAvailableLogins(loginsMap);

    if (loginsMap.size > 1) {
      setCurrentView("choose_login");
      return;
    }

    const chosenUser = loginsMap.keys().next().value;

    if (!chosenUser) {
      console.error("Could not get login username value");
      return;
    }

    const encryptionResult = loginsMap.get(chosenUser);
    
    if (!encryptionResult) {
      console.error("Could not get login password value");
      return;
    }

    await replaceLoginFields(chosenUser, encryptionResult);
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

    const encryptionResult = await encryptAES256(loginState.masterKey, password);

    const newLogin = {
      username: username,
      passwordAndIv: encryptionResult.encryptedPass + "#" + encryptionResult.iv,
      masterPassword: loginState.saltedHashedPass
    }

    const addMessage = {
      type: "ADD_PASSWORD",
      masterUser: loginState.masterUser,
      domain: domain,
      newLogin: newLogin,
      masterPassword: loginState.saltedHashedPass
    };

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
        const password = fields.passwordField.value;

        if (fields.passwordField.autocomplete.includes("current-password")) {
          return;
        }

        const issue = await determineStrength(password, loginState.masterUser, loginState.masterKey, loginState.saltedHashedPass);
        if (issue.length != 0) {
          setOutput("That was very shameful :(");
          setShowShame(true);
          setIssues(issue);
        } else {
          setShowShame(false);
        }
      }
    } catch (error: any) {
      setOutput("Bad login do better next time >:( " + (error.message || "Unknown error"));
    }
  }

  const handleChooseLogin = async (chosenUser: string) => {
    for (const [user, encryptionResult] of availableLogins.entries()) {
      if (user === chosenUser) {
        availableLogins.clear();
        replaceLoginFields(chosenUser, encryptionResult);
      }
    }
  }

  const handleLogOut = async () => {
    loginState.masterUser = undefined;
    loginState.masterKey = undefined;
    loginState.salt = undefined;
    loginState.saltedHashedPass = undefined;
    setLoggedInUser(undefined);
    setOutput("Welcome Back");
    setCurrentView('login');
    await chrome.runtime.sendMessage({ type: "LOGOUT" });
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const replaceLoginFields = async (chosenUser: string, encryptionResult: string) => {
    const split = encryptionResult.split("#");
    const encryptedPass = split[0];
    const iv = split[1];

    if (!loginState.masterKey) {
      console.error("Master key not found");
      return;
    }

    const decryptedPass = await decryptAES256(loginState.masterKey, hex2buf(encryptedPass).buffer, hex2buf(iv));

    const credentials = {
      username: chosenUser,
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

    setCurrentView('autofill');
  }

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
            {loggedInUser && (
              <button
                onClick={() => handleLogOut()}
                className="action-button logout-button"
                aria-label="Log Out"
              >
                Log Out
              </button>
            )}
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
            {!loggedInUser ? (
              <>
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
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('autofill')}
                  className={`nav-button ${currentView === 'autofill' ? 'active' : ''}`}
                >
                  Autofill
                </button>
                <button
                  onClick={() => setCurrentView('list')}
                  className={`nav-button ${currentView === 'list' ? 'active' : ''}`}
                >
                  List
                </button>
              </>
            )}
          </div>

          {currentView === 'login' && (
            <Login onLoginSuccess={(user) => {
              setOutput(`Welcome Back, ${user}`);
              setLoggedInUser(user);
              setCurrentView('list');
            }} />
          )}
          {currentView === 'register' && (
            <Register onRegisterSuccess={(user) => {
              setOutput(`Welcome, ${user}`);
              setLoggedInUser(user);
              setCurrentView('list');
            }} />
          )}

          {currentView === 'choose_login' && (
            <div>
              <p className="status-text">Choose the login whose information you want to autofill.</p>

              {Array.from(availableLogins.keys()).map((user) =>
                <button
                  className="choose-login-button"
                  onClick={() => handleChooseLogin(user)}
                >
                  {user}
                </button>
              )}
            </div>
          )}

          {currentView === 'autofill' && (
            <div className="action-button-group">
              <button
                className="autofill-button"
                onClick={handleAutofill}
              >
                Autofill Current Site
              </button>

              <button
                className="save-login-button"
                onClick={() => {
                  const fields = findLoginFields();
                  if (fields && fields.usernameField && fields.passwordField) {
                    if (!fields.usernameField.value || !fields.passwordField.value) {
                      setOutput("Please fill in both username and password before saving.");
                    } else {
                      handleSave(fields.usernameField.value, fields.passwordField.value);
                    }
                  } else {
                    setOutput("Couldn't find login fields on this page to save.");
                  }
                }}
              >
                Save Current Login
              </button>
            </div>
          )}

          {currentView === 'list' && (
            loggedInUser ? (
              <LoginList masterUsername={loggedInUser} saltedHashedPass={loginState.saltedHashedPass || ""} />
            ) : (
              <p className="status-text">Please log in to view your passwords.</p>
            )
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
    domain: domain,
    masterPassword: loginState.saltedHashedPass
  }

  const response = await chrome.runtime.sendMessage(getMessage);

  if (!response.success) {
    return;
  }

  const loginsMap = new Map<string, string>(Object.entries(JSON.parse(response.data)));
  return loginsMap;
}