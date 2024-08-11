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
    const text = req.body // Grab plain text
    ai_response = await call_openai(text)
    res.send(`OpenAI Response ${ai_response}`)
});

const call_openai = async (text) => {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a professional resume editor and it is your job to output a tailored resume when given a job description \
            and an existing resume from a client.", 
                    role: "user", content: `Here is the job description. ${job_description}`}],
        model: "gpt-4o-mini",
      });
    const response = completion.choices[0]
}


