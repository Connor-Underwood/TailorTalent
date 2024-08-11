import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios'
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';

function App() {
  const [file, setFile] = useState();
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
    var fileReader = new FileReader();  

    fileReader.onload = async () => {
      // Step 4: Turn array buffer into typed array
      const typedarray = new Uint8Array(fileReader.result);

      // Step 5: Load PDF and extract text
      const text = await loadPdf(typedarray);

      // Step 6: Send the extracted text to the backend
      try {
          const response = await axios.post('http://localhost:5001/api', { text }, {
            headers: {
              'Content-Type' : 'text/plain'
            }
          });
          console.log('PDF Received back from Backend:', response.data);
      } catch (error) {
          console.error('Error sending text to server:', error);
      }
    };
    fileReader.readAsArrayBuffer(file)
  }

  const handleTextChange = async (event) => {
    console.log(event)
  }

  // Load PDF and extract text
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
        <input type="submit" value="Submit"/>
        <input type="text" value="Text" onChange={handleTextChange}/>
      </form>
      
    </div>
  );
}

export default App;
