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
    const { fileTextContent, inputText} = req.body; // do some action based on file type (change prompt based on latex vs pdf text)


    if (!fileTextContent || !inputText) {
        return res.status(400).json({ error: 'Both PDF text and input text are required' });
    }

    console.log(`Received Resume Text: ${fileTextContent.substring(0, 25)}...`); // Log first 100 characters
    console.log(`Received Job Description: ${inputText.substring(0,25)}`);
    
    try {
        const suggestions = await call_openai(fileTextContent, inputText);
        res.json({ suggestions: suggestions });
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

const call_openai = async (resume_text, job_description, file_type) => {

    const job_description_kwds = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "Extract the most relevant keywords from this job description. Put each keyword on a new line. Keywords should be one to two words maximum, technical, specific, non-general, and no adjectives."},
            { role: "user", content: `Here is the job description: ${job_description}` },
        ],
        model: "gpt-3.5-turbo",
    });

    const keywords = job_description_kwds.choices[0].message.content
    

    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: "You are a professional resume editor. Your job is to provide suggestions to tailor a resume when given important keywords and an existing resume from a client." },
            { role: "system", content: "For each suggestion, provide the title of the experience/project being modified (TITLE), the original text (BEFORE), the suggested modification (AFTER), and the reasoning for the change (REASONING) in the following format: TITLE: [experience/project title] BEFORE: [original text] AFTER: [suggested modification] REASONING: [explanation for the change]" },
            { role: "system", content: "Provide 3 to 5 suggestions. Each suggestion should be separated by a blank line." },
            { role: "system", content: "A modification is defined as adding important keywords to a client's resume"},
            { role: "system", content: "Do not create entirely new experiences for the client." },
            { role: "user", content: `Here are the keywords: ${keywords}` },
            { role: "user", content: `Here is the client's resume: ${resume_text}` }
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

export default app;