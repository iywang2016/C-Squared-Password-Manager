import { useState, useEffect } from 'react';


export default function Shame(props:any) {
  const [feedbackText, setFeedbackText] = useState('');
  let shameNumber = Math.floor(Math.random() * 2);
  if (shameNumber != 1) {
    shameNumber = 1;
  }
  let size = 12;

  // useEffect(() => {
  // const interval = setInterval(() => {
  //   size = size + size;
  // }, 2000);

  // return () => clearInterval(interval);
  // }, []);
  
  useEffect(() => {
    if (feedbackText === "I understand my password was weak, I promise to do better next time.") {
      props.setShame(false);
    }
  }, [feedbackText]);

  if (shameNumber == 1) {
    return (
      <div className="shame-text-input">
          <p style={{ color: 'red', fontSize: size }}>Please acknowledge your password was weak.
                        The password should be at least of length 15 characters.
                        Type "I understand my password was weak, I promise to do better next time."
                        to proceed.</p>
          <textarea
            style={{ width: '100%', height: '60px', fontSize: '12px' }}
            onPaste={(e)=>{e.preventDefault(); setFeedbackText("No pasting allowed >:(");
              return false;
            }}
            value={feedbackText}
            onChange={(e) => {setFeedbackText(e.target.value);}}
            placeholder='Acknowledge here.'
          />
      </div>
    );
  } else {
    return ( 
      <div className="shame-drag-drop">
        
      </div>
    )
  }
}