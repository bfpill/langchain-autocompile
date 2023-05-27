import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ZeroShotAgent, AgentExecutor, AgentActionOutputParser } from "langchain/agents";
import { DynamicTool } from "langchain/tools";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AgentAction, AgentFinish } from "langchain/schema";

const compile = async (code: string) => {
    const key = "5";

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename)

    const filePath = path.join(__dirname + '/code/code' + key + '.txt');
    console.log(code);
    fs.writeFileSync(filePath, code, 'utf8');

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
      const out = await response.json();
      console.log("Got output" + out.output)
      return out;
    }
    catch (error) {
      return ("Could not connect to server")
    }
}

class CustomOutputParser extends AgentActionOutputParser {
    async parse(text: string): Promise<AgentAction | AgentFinish> {
      if (text.includes("Final Answer:")) {
        const parts = text.split("Final Answer:");
        const input = parts[parts.length - 1].trim();
        const finalAnswers = { output: input };
        console.log(text);
        return { log: text, returnValues: finalAnswers };
      }
  
      const match = /Action: (.*)\nAction Input: (.*)/s.exec(text);
      if (!match) {
        throw new Error(`Could not parse LLM output: ${text}`);
      }
  
      return {
        tool: match[1].trim(),
        toolInput: match[2].trim().replace(/^"+|"+$/g, ""),
        log: text,
      };
    }
  
    getFormatInstructions(): string {
      throw new Error("Not implemented");
    }
  }

export const run = async () => {
    const tools = [
        new DynamicTool({
            name: "Compiler",
            description:
              "You must use this compiler to execute your code.",
            func: async (code) => await compile(code),
          }),
    ]

  const prompt = ZeroShotAgent.createPrompt(tools, {
    prefix: `You are a programmer. You have access to this compiler, which you use to run yor code:`,
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
    outputParser : new CustomOutputParser(),
    llmChain,
    allowedTools: tools.map((tool) => tool.name),
  });

  const executor = AgentExecutor.fromAgentAndTools({ agent, tools });

  const response = await executor.run(
    `Write python code that sorts a list of movies alphabetically and then prints the movies in reverse order"
    ALWAYS Run your code using the compiler tool.
    If the output is not want you want / expected, rewrite your code and compile again.
    Once the compiled code is correct, send the compilers output.`
  );

  console.log(response);
};