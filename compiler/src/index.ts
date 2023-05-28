import express from 'express';
import bodyParser from "body-parser";
import * as dotenv from 'dotenv';
import openCompileRouter from "../server/v1/routes"
import chalk from 'chalk'

// Get environment variables
dotenv.config() 

// Express Server initialization
const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(bodyParser.json());

//v1 api
app.use("/api/v1/openCompiler", openCompileRouter);

app.listen(PORT, () => {
  console.log(chalk.blue(
    `Welcome to OpenCompiler v1.0
    Connected to server...`
  ));
});
