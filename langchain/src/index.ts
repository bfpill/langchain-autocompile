import express from 'express';
import bodyParser from 'body-parser';
import chalk from 'chalk'
import * as dotenv from 'dotenv';

// Get environment variables
dotenv.config() 

// Import routes
import routes from "./api/v1/routes/routes"

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000; 

// Set up middleware
app.use(bodyParser.json());

// Mount routes
app.use('/langchain-autocompile/v1', routes);

// Start server
app.listen(PORT, () => {
  console.log(chalk.yellow(`Agent server started on port ${PORT}`));
});