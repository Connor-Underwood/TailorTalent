import OpenAI from "openai";
import express from 'express';
import cors from 'cors';

const app = express();
const port = 5001;
const openai = new OpenAI();

// Use JSON middleware instead of text
app.use(express.json({ limit: '50mb' }));

app.use(cors({
    origin: 'http://localhost:3001', // Allow front-end 
    methods: 'POST, GET', // Allow only these HTTP methods
    allowedHeaders: 'Content-Type' // Allow these headers
}));

app.listen(port, () => {
    console.log(`Listening on port ${port} right now`);
});

app.post('/api', async (req, res) => {
    const { pdfText, inputText } = req.body;

    if (!pdfText || !inputText) {
        return res.status(400).json({ error: 'Both PDF text and input text are required' });
    }

    console.log(`Received PDF Text: ${pdfText.substring(0, 100)}...`); // Log first 100 characters
    console.log(`Received Job Description: ${inputText}`);
    
    try {
        const ai_response = await call_openai(pdfText, inputText);
        res.json({ response: ai_response });
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

const call_openai = async (resume_text, job_description) => {
    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "You are a professional resume editor. Your job is to output a tailored resume when given a job description and an existing resume from a client." },
            { role: "system", content: "Use keywords from the job description to shape how you will enhance the original resume." },
            { role: "system", content: "Only enhance the bullet point sentences. You may not modify or create new experiences for the client." },
            { role: "user", content: `Here is the job description: ${job_description}` },
            { role: "user", content: `Here is the resume text: ${resume_text}` }
        ],
        model: "gpt-4",  // or use "gpt-3.5-turbo" if you don't have access to GPT-4
    });
    return completion.choices[0].message.content;
};

export default app;