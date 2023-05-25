import express from 'express';
import * as dotenv from 'dotenv';

// Get environment variables
dotenv.config() 

// Express Server initialization
const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

app.get('/api/compiler', async (req, res) => {
    // Code to generate answers to questions with OpenAI
  });