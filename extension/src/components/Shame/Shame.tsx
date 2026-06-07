import { useState, useEffect } from 'react';
import * as Constants from '../../utils/constants';
import './Shame.css';

export default function Shame(props:any) {
  const [feedbackText, setFeedbackText] = useState('');
  const issueList: string[] = [];
  let shameNumber = Math.floor(Math.random() * 2);
  if (shameNumber != 1) {
    shameNumber = 1;
  }

  useEffect(() => {
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
      issueList.push("I understand I should not use a sequence of numbers in my password.");
    } else if (props.issues[i] === Constants.ISSUE_REPEATED_PHRASE) {
      issueList.push("I understand my password should not repeat a phrase.");
    } else if (props.issues[i] === Constants.ISSUE_REUSED_PASS) {
      issueList.push("I understand I should not reuse passwords between accounts or between sites.");
    }
  }

  if (shameNumber == 1) {
    return (
      <div className="shame-text-input">
          <p className="shame-warning">
            Please acknowledge your password was weak.
            Type "{issueList.join("").trim()}" to proceed.
          </p>
          <textarea
            className="shame-textarea"
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