import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { findLoginFields, fillField } from './content/index';
import { determineStrength, generatePassword } from './utils/encrypt';
import Login from './components/Login';
import Register from './components/Register';
import Shame from './components/Shame';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [output, setOutput] = useState("Welcome Back");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showShame, setShowShame] = useState(false);
  const showShameRef = useRef(showShame);

  const [currentView, setCurrentView] = useState<'login' | 'register' | 'autofill' | 'save'>('login');

  const offset = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const masterUser = "TestingMasterUsername";
  const testingDomain = "TestingDomain";

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
  const oldUserPass = useRef({ username: '', password: '' });
  const lastChangeTime = useRef<number>(Date.now());
  const alreadyChecked = useRef(false)
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
            ) {
            handleSave();
          }
        }
      }
    }, 1000);
  }, []);

  const handleAutofill = async () => {
    console.log("Starting autofill");

    const getMessage = {
      type: "GET_PASSWORDS",
      masterUser: masterUser,
      domain: testingDomain
    }

    console.log("Sending GET_PASSWORDS message");

    const response = await chrome.runtime.sendMessage(getMessage);

    console.log("Fetched passwords", response);

    if (!response.success) {
      setOutput("Could not find applicable login information: " + response.error);
      return;
    }

    const loginsMap = new Map<string, string>(Object.entries(JSON.parse(response.data)));

    const credentials = {
      username: loginsMap.keys().next().value,
      password: loginsMap.values().next().value,
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
      const fields = findLoginFields();

      if (fields) {
        if (!fields.usernameField || !fields.passwordField ||
            !fields.usernameField.value || !fields.passwordField.value ||
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

          // TODO: encryption
          const newLogin = {
            username: username,
            password: password
          }

          const addMessage = {
            type: "ADD_PASSWORD",
            masterUser: masterUser,
            domain: testingDomain,
            newLogin: newLogin
          };
    
          console.log("Sending ADD_PASSWORD message");
    
          const response = await chrome.runtime.sendMessage(addMessage);
    
          if (response.success) {
            setOutput("Successfully saved username " + username + " and password " + password); 
          } else {
            setOutput("Failed to save username :( error: " + response.error);
          }
        }
      }
    } catch (error: any) {
      setOutput("Bad login do better next time >:( " + (error.message || "Unknown error"));
    }
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
        <div>
          {!showShame ? (<div>
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
          </div>) : (<Shame setShame={setShowShame}/>)}
        </div>
      </div>
    </div>
  );
}