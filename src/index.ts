import express from 'express';
import bodyParser from "body-parser";
import * as dotenv from 'dotenv';
import v1SimulatedCompileRouter from "../server/routes/v1SimulatedCompilerRouter"

// Get environment variables
dotenv.config() 

// Express Server initialization
const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(bodyParser.json());

//v1 api
app.use("/api/v1/personalities", v1SimulatedCompileRouter);

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});