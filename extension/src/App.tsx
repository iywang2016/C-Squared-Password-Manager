import { useState, useEffect } from 'react';

export default function App() {
  const [output, setOutput] = useState("Hashing in progress");

  // TODO: replace later with actual input and stuff just to test connects rn
  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: "hash", password: "password" },
      (response) => {
        if (response && response.success) {
          setOutput("Congrats on your new hash: " + response.hash);
        } else {
          setOutput("Bad password do better next time >:( " + response.message);
        }
      }
    );
  }, []);

  return (
    <div style={{ width: "fit-content", padding: "20px", fontFamily: "sans-serif" }}>
    <h2>Testing Password Manager Yo!</h2>
    <p>{output}</p>
    </div>
  );
}