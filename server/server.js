import OpenAI from "openai";
import express from 'express'
import cors from 'cors'
const app = express()
const port =  5001
const openai = new OpenAI();

app.use(express.text())

app.use(cors({
    origin: 'http://localhost:3000', // Allow front-end 
    methods: 'POST, GET', // Allow only these HTTP methods
    allowedHeaders: 'Content-Type' // Allow these headers
}));

app.listen(port, () => {
    console.log(`Listening on port ${port} right now`)
})

app.post('/api', async (req, res) => {
    console.log(`Received Text: ${req.body}`);

    const resume_text = req.body // Grab plain text
    const job_description = req.? // need to figure out how vijay is going to send
    ai_response = await call_openai(resume_text, job_description)
    res.send(`OpenAI Response ${ai_response}`)
});

const call_openai = async (resume_text, job_description) => {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a professional resume editor and it is your job to output a tailored resume when given a job description and an existing resume from a client.", 
                     role: "system", content: "Use keywords from the job description to shape how you will enhance the original resume.",
                     role: "system", content: "Only enhance the bullet point sentences. You may not modify or create new experiences for the client.",
                     role: "user", content: `Here is the job description. ${job_description}`,
                     role: "user", content: `Here is the resume text ${resume_text}`}],
        model: "gpt-4o-mini",
      });
    const openai_response = completion.choices[0]
    return openai_response
}


