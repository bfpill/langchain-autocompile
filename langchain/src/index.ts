import express from 'express';
import bodyParser from 'body-parser';

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
  console.log(`Server started on port ${PORT}`);
});