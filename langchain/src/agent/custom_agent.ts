import {
    AgentActionOutputParser,
    AgentExecutor,
    LLMSingleActionAgent,
  } from "langchain/agents";
  import { LLMChain } from "langchain/chains";
  import { ChatOpenAI } from "langchain/chat_models/openai";
  import {
    BaseChatPromptTemplate,
    BasePromptTemplate,
    SerializedBasePromptTemplate,
    renderTemplate,
  } from "langchain/prompts";
  import {
    AgentAction,
    AgentFinish,
    AgentStep,
    BaseChatMessage,
    HumanChatMessage,
    InputValues,
    PartialValues,
  } from "langchain/schema";
  import { DynamicTool, Tool } from "langchain/tools";
  
  const PREFIX = `Answer the following questions as best you can. You have access to the following tools:`;
  const formatInstructions = (
    toolNames: string
  ) => `Use the following format in your response:
  
  Question: the input question you must answer
  Thought: you should always think about what to do
  Action: the action to take, should be one of [${toolNames}]
  Action Input: the input to the action
  Observation: the result of the action
  ... (this Thought/Action/Action Input/Observation can repeat N times)
  Thought: I now know the final answer
  Final Answer: the final answer to the original input question`;
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
      if (text.includes("Final Answer:")) {
        const parts = text.split("Final Answer:");
        const input = parts[parts.length - 1].trim();
        const finalAnswers = { output: input };
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
    const model = new ChatOpenAI({ temperature: 0 });
    const tools = [
        new DynamicTool({
            name: "FOO",
            description:
              "call this to get the value of foo. input should be an empty string.",
            func: async () => "baz",
        }),
    ];
  
    const llmChain = new LLMChain({
      prompt: new CustomPromptTemplate({
        tools,
        inputVariables: ["input", "agent_scratchpad"],
      }),
      llm: model,
    });
  
    const agent = new LLMSingleActionAgent({
      llmChain,
      outputParser: new CustomOutputParser(),

      stop: ["\nObservation"],
    });
    const executor = new AgentExecutor({
      agent,
      tools,
    });
    console.log("Loaded agent.");
  
    const input = `What is the value of foo?`;
  
    console.log(`Executing with input "${input}"...`);
  
    const result = await executor.call({ input });
  
    console.log(`Got output ${result.output}`);
  };