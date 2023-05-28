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
    const res = await response.json();
    console.log("Got output" + res.output)
    return res.output;
  }
  catch (error) {
    return ("Could not connect to server")
  }
}

const PREFIX = `You are a programmer. You only have access to a compiler tool, which you must use to compile your code. You can ONLY use the provided compiler. 
ALWAYS run your code using the compiler tool.
You have all neccessary packages installed already. 
If the output is not want you want / expected, rewrite your code and compile again.
Once the compiled code is correct, send the compilers output.`;
const formatInstructions = (
  toolNames: string
) => `Use the following format in your response:

Question: The code you have been asked to write
Thought: you should always think about what to do
Action: the action to take, should be one of [${toolNames}]
Action Input: the code you want to compile
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
    console.log(values);
    /** Construct the final template */
    const toolStrings = this.tools
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
          "You must use this compiler to execute your code.",
        func: async (code) => await compile(code),
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
