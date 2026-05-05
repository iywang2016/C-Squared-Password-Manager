import { useState, useEffect } from 'react';


export default function Shame(props:any) {
  const [feedbackText, setFeedbackText] = useState('');
  
  useEffect(() => {
    if (feedbackText === "I understand my password was weak, I promise to do better next time.") {
      props.setShame(false);
    }
  }, [feedbackText]);

  return (
    <div className="shame-container">
        <p style={{ color: 'red', fontSize: '12px' }}>Please acknowledge your password was weak.
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
}