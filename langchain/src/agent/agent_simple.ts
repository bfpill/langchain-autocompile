import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AgentExecutor, AgentActionOutputParser, LLMSingleActionAgent, BaseSingleActionAgent } from "langchain/agents";
import { DynamicTool, Tool } from "langchain/tools";
import {
  BaseChatPromptTemplate,
  BasePromptTemplate,
  SerializedBasePromptTemplate,
  renderTemplate,
} from "langchain/prompts";

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AgentAction, AgentFinish, AgentStep, BaseChatMessage, HumanChatMessage, InputValues, PartialValues } from "langchain/schema";
import chalk from 'chalk';


const compile = async (agentInput) => {
  try {
    const { key, code } = extractKeyCode(agentInput);
    console.log(key + " : " + code);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename)

    const filePath = path.join(__dirname + '/code/code' + key + '.txt');
    console.log(code);
    fs.writeFileSync(filePath, code, 'utf8');

    console.log("Attemping to compile from:  " + filePath)

    const url = "http://localhost:3000/api/v1/openCompiler";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "codePath": filePath
      }),
    })
    const res = await response.json();
    console.log("Got output" + res.output)
    return res.output;
  }
  catch (error) {
    return ("Could not connect to server")
  }
}

const initializeCompiler = async (agentInput) => {
  try {
    const { key, language } = extractKeyLanguage(agentInput);
    console.log(key + " : " + language);
    const url = "http://localhost:3000/api/v1/openCompiler";

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "key": key,
        "language": language
      }),
    })
    const res = await response.json();
    return res.message;
  }
  catch (error) {
    return ("Could not initialize compiler. Check your input format and try again.")
  }
}

const extractKeyCode = (input: string): { key: string, code: string } => {
  const regex = /key:\s*(.*?),\s*code:\s*([\s\S]*)/;
  const match = input.match(regex);

  if (match) {
    const key = match[1].trim();
    const code = match[3].trim();

    return { key, code };
  } else {
    throw Error('Invalid input format.');
  }
}

const extractKeyLanguage = (input: string): { key: string, language: string } => {
  const regex = /key:\s*(.*?),\s*language:\s*(.*)/;
  const match = input.match(regex);

  if (match) {
    const key = match[1].trim();
    const language = match[2].trim();

    return { key, language };
  } else {
    throw Error('Invalid input format.');
  }
}

const PREFIX = `You are a programmer. You have access to a compiler and a compiler initializer. 
You must use the compiler to compile your code. You can ONLY use the provided compiler. 
ALWAYS run your code using the compiler tool.
You have all neccessary packages installed already. 
If the output is not want you want / expected, rewrite your code and compile again.
Once the compiled code is correct, send the compilers output.`;
const formatInstructions = (
  toolNames: string
) => `Use the following format in your response:

Question: The code you have been asked to write
Thought: you should always think about what to do
Action: the action to take, should be one of [Compiler], [CompilerInitializer]
Action Input: the Action input the compiler or compilerInitializer takes
Observation: the result of running your code
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I've gotten the correct output from the compiler
Final Answer: the output of the code you wrote.`;
const SUFFIX = `Begin!

Question: {input}
Thought:{agent_scratchpad}`;

class CustomPromptTemplate extends BaseChatPromptTemplate {
  tools: Tool[];

  constructor(args: { tools: Tool[]; inputVariables: string[] }) {
    super({ inputVariables: args.inputVariables });
    this.tools = args.tools;
  }

  _getPromptType(): string {
    throw new Error("Not implemented");
  }

  async formatMessages(values: InputValues): Promise<BaseChatMessage[]> {
    if (values.intermediate_steps.length >= 1) {
      console.log(chalk.blue(values.intermediate_steps[values.intermediate_steps.length - 1].action.toolInput + " : " + values.intermediate_steps[values.intermediate_steps.length - 1].observation));
    }
    /** Construct the final template */
    const toolStrings = this. tools
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join("\n");
    const toolNames = this.tools.map((tool) => tool.name).join("\n");
    const instructions = formatInstructions(toolNames);
    const template = [PREFIX, toolStrings, instructions, SUFFIX].join("\n\n");
    /** Construct the agent_scratchpad */
    const intermediateSteps = values.intermediate_steps as AgentStep[];
    const agentScratchpad = intermediateSteps.reduce(
      (thoughts, { action, observation }) =>
        thoughts +
        [action.log, `\nObservation: ${observation}`, "Thought:"].join("\n"),
      ""
    );
    const newInput = { agent_scratchpad: agentScratchpad, ...values };
    /** Format the template. */
    const formatted = renderTemplate(template, "f-string", newInput);
    return [new HumanChatMessage(formatted)];
  }

  partial(_values: PartialValues): Promise<BasePromptTemplate> {
    throw new Error("Not implemented");
  }

  serialize(): SerializedBasePromptTemplate {
    throw new Error("Not implemented");
  }
}

class CustomOutputParser extends AgentActionOutputParser {
  async parse(text: string): Promise<AgentAction | AgentFinish> {
    console.log(text);
    if (text.includes("Final Answer:")) {
      const parts = text.split("Final Answer:");
      const input = parts[parts.length - 1].trim();
      const finalAnswers = { output: input };
      console.log(text);
      return { log: text, returnValues: finalAnswers };
    }

    const match = /Action: (.*)\nAction Input:(.*)/s.exec(text);
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

export default class Agent {
  key: string;
  tools: Tool[];
  prompt: BaseChatPromptTemplate;
  chain: LLMChain;
  agent: BaseSingleActionAgent;
  executor: AgentExecutor;

  constructor(key: string) {
    this.key = key;
    this.tools = this.createTools();
    this.prompt = this.createPrompt(this.tools);
    this.chain = this.createChain(this.prompt);
    this.agent = this.createAgent(this.chain);
    this.executor = this.createExecutor(this.agent, this.tools);
  }

  createTools = () => {
    const tools = [
      new DynamicTool({
        name: "Compiler",
        description:
          `You must use this compiler to execute your code. 
          
          To use, format your Action input like so:
          key: (key), code: (code)`,
        func: async (agentInput) => await compile(agentInput),
      }),
      new DynamicTool({
        name: "CompilerInitializer",
        //be careful not to overlap with the customOutputParser when describing the tools!!
        description:
          `Use this to initialize a compiler with a key and a programming language you want it to use. 
          
          To use, format your Action input like so: 
          key: (number), language: (language)
          
          Do NOT include your key or language in your Action, only your ActionInput`,
        func: async (agentInput) => await initializeCompiler(agentInput),
      }),
    ]
    return tools;
  }

  createPrompt = (tools: Tool[]) => {
    const prompt = new CustomPromptTemplate({
      tools,
      inputVariables: ["input", "agent_scratchpad"],
    })
    return prompt;
  }

  createChain = (prompt: BasePromptTemplate) => {
    const chat = new ChatOpenAI({});

    const llmChain = new LLMChain({
      prompt: prompt,
      llm: chat,
    });

    return llmChain;
  }

  createAgent = (llmChain: LLMChain<string>) => {
    const agent = new LLMSingleActionAgent({
      outputParser: new CustomOutputParser(),
      llmChain,
      stop: ["\nObservation"],
    });

    return agent;
  }

  createExecutor = (agent: BaseSingleActionAgent, tools: Tool[]) => {
    const executor = AgentExecutor.fromAgentAndTools({ agent, tools });
    return executor;
  }

  run = async (input: string) => {
    const response = await this.executor.call({ input });
    console.log(response);
    return response;
  }
};
