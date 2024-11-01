import OpenAI from "openai";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'

dotenv.config()
const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
// Use JSON middleware instead of text
app.use(express.json({ limit: '50mb' }));

app.use(cors({
    origin: ['https://tailor-talent.vercel.app', 'http://localhost:3000'], // Allow both origins
    methods: ['POST', 'GET'], // Allow these HTTP methods
    allowedHeaders: ['Content-Type'] // Allow these headers
}));

// Add a GET handler for /api
app.get('/', (req, res) => {
    res.status(200).send(`
      <html>
        <head>
          <title>API Endpoint</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #6366f1; }
            p { font-size: 18px; color: #333; }
          </style>
        </head>
        <body>
          <h1>Welcome to the Tailor Talent API</h1>
          <p>This endpoint is for POST requests only.</p>
          <p>Please send a POST request with JSON data to use this API.</p>
        </body>
      </html>
    `);
  });
app.post('/', async (req, res) => {
    const { resumeText, inputText } = req.body;

    if (!resumeText || !inputText) {
        return res.status(400).json({ error: 'Both PDF text and input text are required' });
    }

    console.log(`Received PDF Text: ${resumeText.substring(0, 100)}...`); // Log first 100 characters
    console.log(`Received Job Description: ${inputText}`);
    
    try {
        const suggestions = await call_openai(resumeText, inputText);
        res.setHeader('Content-Type', 'application/json');
        res.json({ suggestions: suggestions }); 
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

const call_openai = async (resume_text, job_description) => {
    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "You are a professional resume editor. Your job is to provide suggestions to tailor a resume when given a job description and an existing resume from a client." },
            { role: "system", content: "For each suggestion, provide the title of the experience/project being modified (TITLE), the original text (BEFORE), the suggested modification (AFTER), and the reasoning for the change (REASONING) in the following format: TITLE: [experience/project title] BEFORE: [original text] AFTER: [suggested modification] REASONING: [explanation for the change]" },
            { role: "system", content: "Provide 3 to 5 suggestions. Each suggestion should be separated by a blank line." },
            { role: "system", content: "Use keywords from the job description to shape your suggestions." },
            { role: "system", content: "Focus on enhancing existing bullet points or suggesting new ones. Do not create entirely new experiences for the client." },
            { role: "user", content: `Here is the job description: ${job_description}` },
            { role: "user", content: `Here is the resume text: ${resume_text}` }
        ],
        model: "gpt-3.5-turbo",
    });

    const aiResponse = completion.choices[0].message.content;
    return parseSuggestions(aiResponse);
};

const parseSuggestions = (aiResponse) => {
    const suggestions = aiResponse.split('\n\n').map(suggestionBlock => {
        const lines = suggestionBlock.split('\n');
        const suggestion = {};
        
        lines.forEach(line => {
            if (line.startsWith('TITLE:')) {
                suggestion.title = line.replace('TITLE:', '').trim();
            } else if (line.startsWith('BEFORE:')) {
                suggestion.before = line.replace('BEFORE:', '').trim();
            } else if (line.startsWith('AFTER:')) {
                suggestion.after = line.replace('AFTER:', '').trim();
            } else if (line.startsWith('REASONING:')) {
                suggestion.reasoning = line.replace('REASONING:', '').trim();
            }
        });
        
        return suggestion;
    });

    return suggestions.filter(s => s.title && s.before && s.after && s.reasoning);
};

// app.listen(5001, () => {
//     console.log("Started!")
// })


export default app;