import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios'
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';

function App() {
  const [file, setFile] = useState();
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    console.log("File was changed")
  }, [file]);

  const handleFileChange = (event) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (file) {
      var fileReader = new FileReader();  

      fileReader.onload = async () => {
        const typedarray = new Uint8Array(fileReader.result);
        const pdfText = await loadPdf(typedarray);

        try {
          const response = await axios.post('http://localhost:5001/api', { 
            pdfText: pdfText,
            inputText: inputText
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log('Response from Backend:', response.data);
        } catch (error) {
          console.error('Error sending data to server:', error);
        }
      };
      fileReader.readAsArrayBuffer(file)
    } else {
      console.log('No file selected. Please select a file before submitting.');
    }
  }
// dawnjida
  const handleTextChange = (event) => {
    setInputText(event.target.value);
  };

  const loadPdf = async (rawFile) => {
    try {
        const loadingTask = pdfjs.getDocument(rawFile);
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded: ${pdf.numPages} pages`);
        
        let allText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            console.log(`Processing page ${pageNum}`);
            
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            allText += `Page ${pageNum}:\n${pageText}\n\n`;
        }
        return allText
    } catch (error) {
        console.error('Error loading PDF:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <input type="text" value={inputText} onChange={handleTextChange}/>
        <input type="submit" value="Submit"/>
      </form>
    </div>
  );
}

export default App;