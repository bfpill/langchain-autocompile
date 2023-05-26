import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ZeroShotAgent, AgentExecutor } from "langchain/agents";
import { DynamicTool, SerpAPI } from "langchain/tools";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";

import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';

const port = 8000;
const app = express();

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

const compile = async (code: string) => {
    const key = "5";

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename)

    const filePath = path.join(__dirname + '/code/code' + key + '.txt');
    console.log(code);
    fs.writeFileSync(filePath, code, 'utf8');

    app.use(express.static('code'));

    console.log("Attemping to compile from:  " + filePath)

    const url = "http://localhost:3000/api/v1/openCompiler";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "key": key, 
          "codePath": filePath
        }),
      })
      return response.json();
    }
    catch (error) {
      return ("Could not connect to server")
    }
}


export const run = async () => {
    const tools = [
        new DynamicTool({
            name: "Compiler",
            description:
              "Use to compile your code",
            func: async (code) => await compile(code),
          }),
    ]

  const prompt = ZeroShotAgent.createPrompt(tools, {
    prefix: `You are a programmer. You have access to a compiler, which can run your code:`,
    suffix: `Begin!`,
  });

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    new SystemMessagePromptTemplate(prompt),
    HumanMessagePromptTemplate.fromTemplate(`{input}

    This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
    {agent_scratchpad}`),
  ]);

  const chat = new ChatOpenAI({});

  const llmChain = new LLMChain({
    prompt: chatPrompt,
    llm: chat,
  });

  const agent = new ZeroShotAgent({
    llmChain,
    allowedTools: tools.map((tool) => tool.name),
  });

  const executor = AgentExecutor.fromAgentAndTools({ agent, tools });

  const response = await executor.run(
    `Write python code prints "UGLY DUCKLING" 5 times using a for loop.
    Format your code to be one line, and then run your code using the compiler tool. Wait for the compilers output and then send the output.`
  );

  console.log(response);
};