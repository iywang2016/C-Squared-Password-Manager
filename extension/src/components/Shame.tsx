import { useState, useEffect } from 'react';
import * as Constants from '../utils/constants';


export default function Shame(props:any) {
  const [feedbackText, setFeedbackText] = useState('');
  const issueList: string[] = [];
  let shameNumber = Math.floor(Math.random() * 2);
  if (shameNumber != 1) {
    shameNumber = 1;
  }

  useEffect(() => {
    console.log(issueList.join(""));
    if (feedbackText === issueList.join("")) {
      props.setShame(false);
    }
  }, [feedbackText]);

  for (let i = 0 ; i < props.issues.length; i++) {
    if (i > 0) {
      issueList.push(" ");
    }
    if (props.issues[i] === Constants.ISSUE_SHORT_PASS_PHRASE) {
      issueList.push("I understand my password was too short. I will use a length of at least " + Constants.MIN_PASSWORD_LENGTH + " characters.");
    } else if (props.issues[i] === Constants.ISSUE_SEQUENCE_PHRASE) {
      issueList.push("I understand I should not use a sequence of numbers in my password.")
    }
  }

  if (shameNumber == 1) {
    return (
      <div className="shame-text-input">
          <p style={{ color: 'red', fontSize: '12px' }}>Please acknowledge your password was weak.
                        Type "{issueList.join("")}"
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