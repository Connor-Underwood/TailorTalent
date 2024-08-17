import * as pdfjs from 'pdfjs-dist';

// Set the workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const extractTextFromPDF = async (file) => {
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
    throw new Error('Error loading PDF');
  }
};

export const extractTextFromTeX = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        const texContent = fileReader.result;
        resolve(texContent);
      } catch (error) {
        reject(error);
      }
    };
    fileReader.readAsText(file);
  });
};



