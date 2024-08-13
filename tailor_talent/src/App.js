import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as pdfjs from 'pdfjs-dist';
import './ResumeUploader.css';  // Make sure this path is correct

function App() {
  const [file, setFile] = useState();
  const [inputText, setInputText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [originalResume, setOriginalResume] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [error, setError] = useState('');
  const [isFileUpload, setIsFileUpload] = useState(true);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, []);

  const handleFileChange = (event) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  }

  const handleTextChange = (event) => {
    setInputText(event.target.value);
  };

  const handleResumeTextChange = (event) => {
    setResumeText(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    let pdfText = '';

    if (isFileUpload) {
      if (file) {
        pdfText = await extractTextFromPDF(file);
      } else {
        setError('No file selected. Please select a file before submitting.');
        setIsLoading(false);
        return;
      }
    } else {
      if (resumeText) {
        pdfText = resumeText;
      } else {
        setError('No resume text entered. Please enter your resume text before submitting.');
        setIsLoading(false);
        return;
      }
    }

    setOriginalResume(pdfText);
    setTailoredResume(pdfText);

    try {
      const response = await axios.post('http://localhost:5001/api', { 
        pdfText: pdfText,
        inputText: inputText
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data.suggestions)) {
        setSuggestions(response.data.suggestions);
      } else {
        setError('Invalid response format from server');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error sending data to server:', error);
      setError('Error communicating with server');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }

  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        try {
          const typedarray = new Uint8Array(fileReader.result);
          const pdfText = await loadPdf(typedarray);
          resolve(pdfText);
        } catch (error) {
          reject(error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  const handleSuggestionAction = (index, accept) => {
    const suggestion = suggestions[index];
    if (accept) {
      setTailoredResume(prevResume => {
        const stripToLetters = (text) => text.replace(/[^a-zA-Z]/g, '').toLowerCase();
        
        const strippedBefore = stripToLetters(suggestion.before);
        const strippedResume = stripToLetters(prevResume);
        const afterText = suggestion.after;
        
        const startIndex = strippedResume.indexOf(strippedBefore);
        
        if (startIndex !== -1) {
          let letterCount = 0;
          let actualStartIndex = 0;
          let actualEndIndex = 0;
          
          for (let i = 0; i < prevResume.length; i++) {
            if (/[a-zA-Z]/.test(prevResume[i])) {
              if (letterCount === startIndex) {
                actualStartIndex = i;
              }
              letterCount++;
              if (letterCount === startIndex + strippedBefore.length) {
                actualEndIndex = i + 1;
                break;
              }
            }
          }
          
          const newResume = prevResume.substring(0, actualStartIndex) + 
                            afterText + 
                            prevResume.substring(actualEndIndex);
          
          return newResume;
        } else {
          console.log('Could not find the "before" text in the resume, even after stripping to letters. No changes made.');
          return prevResume;
        }
      });
    }
    setSuggestions(prevSuggestions => prevSuggestions.filter((_, i) => i !== index));
  };

  const loadPdf = async (rawFile) => {
    try {
      const loadingTask = pdfjs.getDocument(rawFile);
      const pdf = await loadingTask.promise;
      
      let allText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += `Page ${pageNum}:\n${pageText}\n\n`;
      }
      
      return allText;
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Error loading PDF');
      return '';
    }
  };

  return (
    <div className="resume-uploader">
      <div className="toggle-container">
        <div className={`toggle-switch ${isFileUpload ? 'left' : 'right'}`}>
          <div
            className={`toggle-option ${isFileUpload ? 'active' : ''}`}
            onClick={() => setIsFileUpload(true)}
          >
            File Upload
          </div>
          <div
            className={`toggle-option ${!isFileUpload ? 'active' : ''}`}
            onClick={() => setIsFileUpload(false)}
          >
            Text Input
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {isFileUpload ? (
          <input type="file" accept=".pdf" onChange={handleFileChange} />
        ) : (
          <textarea 
            value={resumeText} 
            onChange={handleResumeTextChange} 
            placeholder="Paste your resume text here"
          />
        )}
        <input 
          type="text" 
          value={inputText} 
          onChange={handleTextChange} 
          placeholder="Enter job description"
        />
        <button type="submit" disabled={isLoading}>Submit</button>
      </form>

      {isLoading && <p>Processing your request...</p>}
      {error && <p className="error-message">{error}</p>}

      {suggestions && suggestions.length > 0 && (
        <div className="suggestions-container">
          <h2>Suggestions:</h2>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <h3>Suggestion {index + 1}:</h3>
              <div className="suggestion-content">
                <div className="suggestion-before">
                  <h4>Before:</h4>
                  <p>{suggestion.before}</p>
                </div>
                <div className="suggestion-after">
                  <h4>After:</h4>
                  <p>{suggestion.after}</p>
                </div>
              </div>
              <div className="suggestion-actions">
                <button onClick={() => handleSuggestionAction(index, true)}>Accept</button>
                <button onClick={() => handleSuggestionAction(index, false)}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {originalResume && tailoredResume && (
        <div className="resume-display">
          <div className="original-resume">
            <h2>Original Resume:</h2>
            <pre>{originalResume}</pre>
          </div>
          <div className="tailored-resume">
            <h2>Tailored Resume:</h2>
            <pre>{tailoredResume}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;