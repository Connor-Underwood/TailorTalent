import OpenAI from "openai";
import express from 'express';
import cors from 'cors';

const app = express();
const port = 5001;
const openai = new OpenAI();

// Use JSON middleware instead of text
app.use(express.json({ limit: '50mb' }));

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both origins
    methods: ['POST', 'GET'], // Allow these HTTP methods
    allowedHeaders: ['Content-Type'] // Allow these headers
}));

app.listen(port, () => {
    console.log(`Listening on port ${port} right now`);
});

app.post('/api', async (req, res) => {
    const { resumeText, inputText } = req.body;

    if (!resumeText || !inputText) {
        return res.status(400).json({ error: 'Both PDF text and input text are required' });
    }

    console.log(`Received PDF Text: ${resumeText.substring(0, 100)}...`); // Log first 100 characters
    console.log(`Received Job Description: ${inputText}`);
    
    try {
        const suggestions = await call_openai(resumeText, inputText);
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
            { role: "system", content: "For each suggestion, provide the original text (BEFORE) and the suggested modification (AFTER) in the following format: BEFORE: [original text] AFTER: [suggested modification]" },
            { role: "system", content: "Provide 3 to 5 suggestions. Each suggestion should be on a new line." },
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
    const lines = aiResponse.split('\n');
    const suggestions = [];
    let currentSuggestion = {};

    for (const line of lines) {
        if (line.startsWith('BEFORE:')) {
            if (currentSuggestion.before) {
                suggestions.push(currentSuggestion);
                currentSuggestion = {};
            }
            currentSuggestion.before = line.replace('BEFORE:', '').trim();
        } else if (line.startsWith('AFTER:')) {
            currentSuggestion.after = line.replace('AFTER:', '').trim();
        }
    }

    if (currentSuggestion.before && currentSuggestion.after) {
        suggestions.push(currentSuggestion);
    }

    return suggestions;
};

export default app;