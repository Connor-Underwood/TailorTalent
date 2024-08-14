import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as pdfjs from 'pdfjs-dist';
import { PaperAirplaneIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import './App.css'
import { extractTextFromPDF, extractTextFromTeX } from './FileHandler';

const ResumeUploader = () => {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [originalResume, setOriginalResume] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [error, setError] = useState('');
  const [isFileUpload, setIsFileUpload] = useState(true);
  const [fileType, setFileType] = useState('')

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 
              'application/x-tex': ['.tex'] },
    multiple: false
  });

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

    let fileTextContent = '';

    if (isFileUpload) {
      if (file) {
        if (file.name.endsWith('.pdf')) {
          fileTextContent = await extractTextFromPDF(file);
          setResumeText(fileTextContent);
        } else {
          fileTextContent = await extractTextFromTeX(file);
          setResumeText(fileTextContent)
        }
        
      } else {
        setError('No file selected. Please select a file before submitting.');
        setIsLoading(false);
        return;
      }
    } else {
      if (resumeText) {
        setResumeText(resumeText);
      } else {
        setError('No resume text entered. Please enter your resume text before submitting.');
        setIsLoading(false);
        return;
      }
    }

    setOriginalResume(fileTextContent);
    setTailoredResume(fileTextContent);
    
    try {
      const response = await axios.post('http://localhost:5001/api', { 
        resumeText: resumeText,
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



  return (

    <div className="resume-uploader">
      <h1>Resume Tailoring Tool</h1>
      
      <div className="toggle-container">
        <span>Upload</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={!isFileUpload}
            onChange={() => setIsFileUpload(!isFileUpload)}
          />
          <span className="slider round"></span>
        </label>
        <span>Paste Resume</span>
      </div>

      

      <form onSubmit={handleSubmit}>
        {isFileUpload ? (
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="upload-icon" />
            <p>Click to upload or drag and drop</p>
            <p className="file-info">Only *.pdf and *.tex files will be accepted (MAX. 800x400px)</p>
            {file && <p className="file-name">{file.name}</p>}
          </div>
        ) : (
          <textarea
            value={resumeText}
            onChange={handleResumeTextChange}
            placeholder="Paste your resume here..."
            className="resume-text-area"
          />
        )}

        <textarea
          value={inputText}
          onChange={handleTextChange}
          placeholder="Enter the job description here..."
          className="job-description-area"
        />

        <button type="submit" disabled={isLoading} className="submit-button">
          <PaperAirplaneIcon className="button-icon" />
          Analyze Resume
        </button>
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

export default ResumeUploader;