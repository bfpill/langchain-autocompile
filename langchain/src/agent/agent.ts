// Import necessary modules from the langchain library
import {
    AgentActionOutputParser,
    AgentExecutor,
    LLMSingleActionAgent,
} from "langchain/agents";
import { ConversationChain, LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import {
    BaseChatPromptTemplate,
    BasePromptTemplate,
    MessagesPlaceholder,
    SerializedBasePromptTemplate,
    renderTemplate,
} from "langchain/prompts";
import {
    AIChatMessage,
    AgentAction,
    AgentFinish,
    AgentStep,
    BaseChatMessage,
    HumanChatMessage,
    InputValues,
    PartialValues,
} from "langchain/schema";

import { DynamicTool } from "langchain/tools";
import { Tool } from "langchain/tools";

// Define a custom output parser class
class CustomOutputParser extends AgentActionOutputParser {
    // Parse the output text and return an AgentAction or AgentFinish object
    async parse(text: string): Promise<AgentAction | AgentFinish> {
        // If the text includes "Final Answer:", split the text and return the last part as the input
        if (text.includes("Final Answer:")) {
            const parts = text.split("Final Answer:");
            const input = parts[parts.length - 1].trim();
            const finalAnswers = { output: input };
            // change to returnValues: { text } if you want to see full output 
            console.log(text)
            return { log: text, returnValues: { text } };
        }

        // If the text doesn't match the expected format, throw an error
        const match = /Action: (.*)\nAction Input: (.*)/s.exec(text);
        if (!match) {
            throw new Error(`Could not parse LLM output: ${text}`);
        }

        // Return an object with the parsed tool, toolInput, and log
        return {
            tool: "",
            toolInput: "",
            log: text,
        };
    }

    // Throw an error if getFormatInstructions is called, as it's not implemented in this class
    getFormatInstructions(): string {
        throw new Error("Not implemented");
    }
}

// Define a custom prompt template class
class CustomPromptTemplate extends BaseChatPromptTemplate {
    // Define the tools, prefix, and formatInstructions properties
    tools: Tool[];
    prefix = `To get the value of foo, use this tool: `;
    formatInstructions = (
        toolNames: string
    ) => {
        return (
            `Use the following format in your response:

            Question: the input question you must answer
            Thought: you should always think about what to do
            Action: the action to take, should be one of [${toolNames}]
            Action Input: the input to the action
            Observation: the result of the action
            ... (this Thought/Action/Action Input/Observation can repeat N times)
            Thought: I now know the final answer
            Final Answer: the final answer to the original input question`
        );
    }
    suffix = "Begin!"

    // Define the constructor for the class
    constructor(args: { tools: Tool[], inputVariables: string[] }) {
        super({ inputVariables: args.inputVariables });
        this.tools = args.tools;
    }

    // Throw an error if _getPromptType is called, as it's not implemented in this class
    _getPromptType(): string {
        throw new Error("Not implemented");
    }

    // Format the memory based on the input variables
    formatMemory = (inputVariables: InputValues) => {
        const chatHistory = inputVariables.chat_history;
        // The ternary makes sure the 
        let response = chatHistory.length === 0 ? "human_input: " + inputVariables.message : "Here is the conversation history so far: \n"
        chatHistory.forEach(message => {
            let chat = message._getType() === "human" ? "Human: " + message.text : "You: " + message.text;
            response += chat + "\n"
        });
        return response;
    }

    // Format the messages based on the input variables
    async formatMessages(inputVariables: InputValues): Promise<BaseChatMessage[]> {
        console.log(inputVariables)
        const toolStrings = this.tools
        .map((tool) => `${tool.name}: ${tool.description}`)
        .join("\n");
        const toolNames = this.tools.map((tool) => tool.name).join("\n");
        /** Construct the final template */
        const instructions = this.formatInstructions(toolNames);
        const memory = this.formatMemory(inputVariables);
        const template = [this.prefix, toolStrings, instructions, memory, this.suffix].join("\n\n"); // Put everything together


        console.log(template);
        /** Construct the agent_scratchpad */
        const intermediateSteps = inputVariables.intermediate_steps as AgentStep[];

        const agentScratchpad = intermediateSteps.reduce(
            (thoughts, { action, observation }) =>
                thoughts +
                [action.log, `\nObservation: ${observation}`, "Thought:"].join("\n"),
            ""
        );
        const newInput = { agentScratchpad: agentScratchpad, ...inputVariables };
        /** Format the template. */
        const formatted = renderTemplate(template, "f-string", newInput);
        return [new HumanChatMessage(formatted)];
    }

    // Throw an error if partial is called, as it's not implemented in this class
    partial(_values: PartialValues): Promise<BasePromptTemplate> {
        throw new Error("Not implemented");
    }

    // Throw an error if serialize is called, as it's not implemented in this class
    serialize(): SerializedBasePromptTemplate {
        throw new Error("Not implemented");
    }
}

// Define the main class
export default class Clone {
    initialized: boolean;
    key: string;

    promptData: any;
    personalityPrompt: any;
    tools: any;

    chain: any;
    memory: any;
    chatPrompt: any;
    agent: any;
    executor: any;

    // Define the constructor for the class
    constructor() {
        this.initialized = false;
        this.key = "";
        this.personalityPrompt;
        this.tools;
        this.chain;
        this.memory;
        this.chatPrompt;
        this.agent;
        this.executor;
    }

    // Define the init method, which initializes the class if it hasn't been initialized yet
    async init(key: string) {
        if (!this.initialized) {
            console.log("Not initialized, running initalization");
            this.key = key;

            this.tools = this.initializeTools();
            this.personalityPrompt = this.initializePrompt(this.tools);
            this.memory = await this.initializeMemory();  //motorhead / buffer.. switch between for testing
            this.chain = await this.constructChain(this.personalityPrompt);
            this.agent = await this.initializeAgent(this.chain);

            this.executor = await this.intializeAgentExecutor(this.agent, this.tools);
        }
    }

    // Define the initializePrompt method, which creates a new CustomPromptTemplate
    initializePrompt(tools: Tool[]) {
        const prompt =
            new CustomPromptTemplate({
                tools,
                inputVariables: ["human_input"],
            });

        return prompt;
    }

    // Define the initializeTools method, which currently returns an empty array
    initializeTools = () => {
        const tools = [
            new DynamicTool({
                name: "FOO",
                description:
                  "call this to get the value of foo. input should be an empty string.",
                func: async () => "baz",
              }),
        ]
        return tools;
    }

    // Define the initializeMemory method, which creates a new BufferMemory
    async initializeMemory() {
        const memory = new BufferMemory({
            returnMessages: true,
            memoryKey: "chat_history", //
            inputKey: "human_input",
            outputKey: 'Final Answer:',
        });
        return memory;
    }

    // Define the constructChain method, which creates a new ConversationChain
    async constructChain(prompt: BasePromptTemplate) {
        const model = new ChatOpenAI();
        const memory = this.memory;
        const chain = new ConversationChain({
            llm: model,
            memory: memory, // These params have to be explicitly named
            prompt
        });
        return chain;
    }

    // Define the initializeAgent method, which creates a new LLMSingleActionAgent
    async initializeAgent(llmChain: ConversationChain) {
        const agent = new LLMSingleActionAgent({
            llmChain,
            outputParser: new CustomOutputParser(),
            stop: ["\nObservation"],
        });
        return agent;
    }

    // Define the intializeAgentExecutor method, which creates a new AgentExecutor
    async intializeAgentExecutor(agent: LLMSingleActionAgent, tools: any) {
        const executor = new AgentExecutor({ agent, tools });
        return executor;
    }

    // Define the respondToMessage method, which calls the executor with the given message
    async respondToMessage(message: string) {
        let executor = this.getExecutor();
        if (executor === null) {
            console.log("Please initialize the clone.");
        }
        else {
            const res = await executor.call({ message });
            return res
        }
    }

    // Define the getExecutor method, which returns the executor
    getExecutor = () => {
        return this.executor;
    }
}
