import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { findLoginFields, fillField } from './content/index';
import Login from './components/Login';
import Register from './components/Register';
import { fetchPasswords } from "./utils/database";
import { decryptAES256 } from './utils/encrypt';
import { deriveMasterKey } from './utils/encrypt';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [output, setOutput] = useState("Welcome Back");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  const [currentView, setCurrentView] = useState<'login' | 'register' | 'autofill'>('login');

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
    console.log("Starting autofill");
    const newLogin = {
      username: "TestingUsername",
      password: "TestingPassword"
    };

    const message = {
      type: "ADD_PASSWORD",
      masterUser: "TestingMasterUsername",
      domain: "TestingDomain",
      newLogin: newLogin
    };

    console.log("Sending ADD_PASSWORD message");

    const response = await chrome.runtime.sendMessage(message);

    console.log("Added password", response);

    // const response = await fetch(`/database/get_passwords/${masterUser}/${domain}`);
    // console.log(response);
    const credentials = {
        username: "placeholder",
        password: "placeholder"
      }
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
      </div>
    </div>
  );
}