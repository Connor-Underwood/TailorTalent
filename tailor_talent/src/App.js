import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { extractTextFromPDF, extractTextFromTeX } from './HelperFunctions.js';
import  ClipLoader  from 'react-spinners/ClipLoader.js'
import { FileUploadOrPaste } from './FileUploadOrPaste.js';
import { ToggleSwitch } from './ToggleSwitch.js';
import { Suggestions } from './Suggestions.js';
import * as pdfjs from 'pdfjs-dist';
import './App.css'

const App = () => {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [originalResume, setOriginalResume] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [error, setError] = useState('');
  const [isFileUpload, setIsFileUpload] = useState(true);
  const [fromFormat, setFromFormat] = useState('');
  const [toFormat, setToFormat] = useState('');
  const [fileType, setFileType] = useState('');

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
          setFileType("pdf");
        } else {
          fileTextContent = await extractTextFromTeX(file);
          setResumeText(fileTextContent)
          setFileType("tex")
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
    setOriginalResume(resumeText);
    setTailoredResume(resumeText);

    try {
      
      const response = await axios.post('http://localhost:5001/api', { 
        fileTextContent: fileTextContent,
        inputText: inputText      
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const { raw_response, suggestions} = response.data
      
      console.log(suggestions)

      if (response.data && Array.isArray(suggestions)) {
        setSuggestions(suggestions);
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
    <div className="resume-container">
      <div className="resume-uploader">
        <h1>AI Resume Tailoring Tool</h1>

        <ToggleSwitch
          isFileUpload={isFileUpload}
          setIsFileUpload={setIsFileUpload}
        />

        <form onSubmit={handleSubmit}>
          <FileUploadOrPaste 
            isFileUpload={isFileUpload}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            file={file}
            resumeText={resumeText}
            handleResumeTextChange={handleResumeTextChange}
          />

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

        {isLoading && <ClipLoader className="clip-loader" color='white' />}
        {error && <p className="error-message">{error}</p>}
      </div>

      <Suggestions
        suggestions={suggestions}
        handleSuggestionAction={handleSuggestionAction}
      />
  </div>
  );
}

export default App;