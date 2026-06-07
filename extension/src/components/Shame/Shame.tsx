import { useState, useEffect, useMemo } from 'react';
import * as Constants from '../../utils/constants';
import './Shame.css';
import { trace } from 'console';

interface WordObject {
  id: string;
  text: string;
}

export default function Shame(props:any) {
  const [feedbackText, setFeedbackText] = useState('');
  const issueList: string[] = [];
  const [availableWords, setAvailableWords] = useState<WordObject[]>([]);
  const [droppedWords, setDroppedWords] = useState<WordObject[]>([]);
  const [targetSentence, setTargetSentence] = useState('');

  const shameNumber = useMemo(() => {
    const storedIndex = localStorage.getItem('c_squared_shame_index') || '0';
    const index = parseInt(storedIndex, 10);
    localStorage.setItem('c_squared_shame_index', (index + 1).toString());
    return index % 3; 
  }, []);

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
  const shameSentence = issueList.join("").trim();

  // tracing logic
  const [isTracing, setIsTracing] = useState(false);
  const [tracedPath, setTracedPath] = useState<number[]>([]);
  
  const traceGridLetters = ['W', 'E', 'A', 'S', 'S', 'K', ':(', 'A', 'P'];
  const targetTracePath = [0, 1, 2, 5, 8, 7, 4, 3, 6];
  let traceSentence = "WEAKPASS:(";

  useEffect(() => {
    let isMatch = false;
    if (tracedPath.length === targetTracePath.length) {
      isMatch = true;
      for (let i = 0; i < targetTracePath.length; i++) {
        if (tracedPath[i] !== targetTracePath[i]) {
          isMatch = false;
          break;
        }
      }
    }
    if (isMatch) {
      props.setShame(false);
    }
  }, [tracedPath, shameNumber, props]);

  const handleTraceStart = (index: number) => {
    setIsTracing(true);
    setTracedPath([index]);
  };

  const handleTraceEnter = (index: number) => {
    if (isTracing) {
      let alreadyVisited = false;
      for (let i = 0; i < tracedPath.length; i++) {
        if (tracedPath[i] === index) {
          alreadyVisited = true;
          break;
        }
      }

      if (!alreadyVisited) {
        const newPath = [];
        for (let i = 0; i < tracedPath.length; i++) {
          newPath.push(tracedPath[i]);
        }
        newPath.push(index);
        setTracedPath(newPath);
      }
    }
  };

  const handleTraceEnd = () => {
    setIsTracing(false);
    
    let isMatch = false;
    if (tracedPath.length === targetTracePath.length) {
      isMatch = true;
      for (let i = 0; i < targetTracePath.length; i++) {
        if (tracedPath[i] !== targetTracePath[i]) {
          isMatch = false;
          break;
        }
      }
      if (!isMatch) setTracedPath([]);
    }
  };


  // drag and drop logic
  useEffect(() => {
    setTargetSentence(shameSentence);
    
    const allWords = shameSentence.split(" ");
    const words = [];
    let validWordCount = 0;

    for (let i = 0; i < allWords.length; i++) {
      const currentWord = allWords[i];
      if (currentWord.trim().length > 0) {
        words.push({ 
          id: `word-${validWordCount}`, 
          text: currentWord 
        });
        validWordCount++;
      }
    }

    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    setAvailableWords(shuffled);
    setDroppedWords([]);
  }, [shameSentence]);

  useEffect(() => {
    if (shameNumber === 1 && feedbackText === shameSentence) {
      props.setShame(false);
    }
  }, [feedbackText, shameSentence, shameNumber, props]);

  useEffect(() => {
    if (shameNumber === 0 && availableWords.length === 0 && droppedWords.length > 0) {
      
      let formedSentence = "";
      for (let i = 0; i < droppedWords.length; i++) {
        formedSentence += droppedWords[i].text;
        if (i < droppedWords.length - 1) {
          formedSentence += " ";
        }
      }

      if (formedSentence === targetSentence) {
        props.setShame(false);
      }
    }
  }, [droppedWords, availableWords, targetSentence, shameNumber, props]);

  const handleDragStart = (e: React.DragEvent, item: WordObject, source: 'bank' | 'answer') => {
    e.dataTransfer.setData("item", JSON.stringify(item));
    e.dataTransfer.setData("source", source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnAnswer = (e: React.DragEvent) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData("item");
    
    const item: WordObject = JSON.parse(itemData);
    const source = e.dataTransfer.getData("source");

    if (source === 'bank') {      
      setAvailableWords((prev) => {
        const newAvailable = [];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].id !== item.id) {
            newAvailable.push(prev[i]);
          }
        }
        return newAvailable;
      });

      setDroppedWords((prev) => [...prev, item]);
    }
  };

  const handleDropOnBank = (e: React.DragEvent) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData("item");
    
    const item: WordObject = JSON.parse(itemData);
    const source = e.dataTransfer.getData("source");

    if (source === 'answer') {
      setDroppedWords((prev) => {
        const newDropped = [];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].id !== item.id) {
            newDropped.push(prev[i]);
          }
        }
        return newDropped;
      });
      setAvailableWords((prev) => [...prev, item]);
    }
  };

  if (shameNumber == 2) {
    return (
      <div className="shame-text-input">
          <p className="shame-warning">
            Please acknowledge your password was weak.
            Type "{shameSentence}" to proceed.
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
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <p className="status-text" style={{ marginBottom: '8px' }}>
              Or, let us fix it for you
            </p>
            <button
              className="autofill-button"
              onClick={props.onFixPassword}
            >
              Generate Strong Password
            </button>
          </div>
      </div>
    );
  } else if (shameNumber === 0){
    return (
      <div className="shame-drag-drop">
        <p className="shame-warning">
          Please acknowledge your password was weak.
            Form the sentence "{shameSentence}" to proceed.
        </p>
        
        {}
        <div 
          className="shame-drop-zone answer-zone"
          onDragOver={handleDragOver}
          onDrop={handleDropOnAnswer}
          style={{ minHeight: '100px', border: '2px dashed #ccc', padding: '10px', marginBottom: '20px' }}
        >
          {droppedWords.length === 0 && <span style={{color: '#888'}}>Drag and drop words in this box.</span>}
          {droppedWords.map((word) => (
            <span
              key={word.id}
              draggable
              onDragStart={(e) => handleDragStart(e, word, 'answer')}
              className="shame-draggable-word"
              style={{ display: 'inline-block', padding: '5px 10px', margin: '4px', backgroundColor: '#e0e0e0', cursor: 'grab', borderRadius: '4px' }}
            >
              {word.text}
            </span>
          ))}
        </div>

        {}
        <div 
          className="shame-drop-zone bank-zone"
          onDragOver={handleDragOver}
          onDrop={handleDropOnBank}
          style={{ minHeight: '100px', border: '1px solid #ccc', padding: '10px' }}
        >
          {availableWords.map((word) => (
            <span
              key={word.id}
              draggable
              onDragStart={(e) => handleDragStart(e, word, 'bank')}
              className="shame-draggable-word"
              style={{ display: 'inline-block', padding: '5px 10px', margin: '4px', backgroundColor: '#ffcccc', cursor: 'grab', borderRadius: '4px' }}
            >
              {word.text}
            </span>
          ))}
        </div>

        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <p className="status-text" style={{ marginBottom: '8px' }}>
            Or, let us fix it for you
          </p>
          <button
            className="autofill-button"
            onClick={props.onFixPassword}
          >
            Generate Strong Password
          </button>
        </div>
      </div>
    );
  } else {
      return (
        <div 
          className="shame-trace-game" 
          onMouseUp={handleTraceEnd} 
          onMouseLeave={handleTraceEnd}
          style={{ userSelect: 'none' }}
        >
          <p className="shame-warning">
            Please acknowledge your password was weak and read to yourself: {shameSentence} <br/><br/> Trace the phrase "{traceSentence}" to proceed.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 60px)', 
            gap: '10px', 
            justifyContent: 'center',
            marginTop: '20px'
          }}>
            {traceGridLetters.map((char, i) => {
              let isTraced = false;
              for(let j = 0; j < tracedPath.length; j++){
                if (tracedPath[j] === i) isTraced = true;
              }

              return (
                <div
                  key={i}
                  onMouseDown={() => handleTraceStart(i)}
                  onMouseEnter={() => handleTraceEnter(i)}
                  style={{
                    width: '60px', 
                    height: '60px',
                    backgroundColor: isTraced ? '#ff4d4d' : '#e0e0e0',
                    color: isTraced ? 'white' : 'black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'crosshair',
                    transition: 'background-color 0.1s'
                  }}
                >
                  {char}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <p className="status-text" style={{ marginBottom: '8px' }}>
              Or, let us fix it for you
            </p>
            <button
              className="autofill-button"
              onClick={props.onFixPassword}
            >
              Generate Strong Password
            </button>
          </div>
        </div>
      );
    }
  }
