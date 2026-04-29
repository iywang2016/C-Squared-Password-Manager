import { useState, useEffect, useRef } from 'react';
import './App.css';
import { findLoginFields, fillField } from './content/index';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [output, setOutput] = useState("Welcome Back");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  // mouse offset
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "TOGGLE_UI") {
        setIsVisible((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Autofill logic
  const handleAutofill = async () => {
    const credentials = {
      username: "Testing Username",
      password: "1234"
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

  // Draggable Logic
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

      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y
      });
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
      className="floating-container"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed'
      }}
    >
      <div className="drag-handle" onMouseDown={handleMouseDown}></div>

      <div className="popup-content">
        <h2>C_Squared PM</h2>
        <p className="status-text">{output}</p>

        <button
          className="autofill-button"
          onClick={handleAutofill}
        >
          Autofill Current Site
        </button>
      </div>
    </div>
  );
}