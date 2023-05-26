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

import { MotorheadMemory } from "langchain/memory";
import { Tool } from "langchain/tools";

class CustomOutputParser extends AgentActionOutputParser {
    async parse(text: string): Promise<AgentAction | AgentFinish> {
        if (text.includes("Final Text:")) {
            const parts = text.split("Final Text:");
            const input = parts[parts.length - 1].trim();
            const finalAnswers = { output: input };
            return { log: text, returnValues: { text } };
        }

        const match = /Action: (.*)\nAction Input: (.*)/s.exec(text);
        if (!match) {
            throw new Error(`Could not parse LLM output: ${text}`);
        }

        return {
            tool: "",
            toolInput: "",
            log: text,
        };
    }

    getFormatInstructions(): string {
        throw new Error("Not implemented");
    }
}

class CustomPromptTemplate extends BaseChatPromptTemplate {
    tools: Tool[];

    prefix = (personaData: string) => `You are a programmer. You have access to a compiler to run your code. 
    To access the compiler, you can use this tool: `;

    formatInstructions = (
    toolNames: string
    ) => {
    `Use the following format in your response:

        Question: the input question you must answer
        Thought: you should always think about what to do
        Action: the action to take, should be one of [${toolNames}]
        Action Input: the input to the action
        Observation: the result of the action
        ... (this Thought/Action/Action Input/Observation can repeat N times)
        Thought: I now know the final answer
        Final Answer: the final answer to the original input question`;
    }

    suffix = "Begin!"

    constructor(args: { tools: Tool[], inputVariables: string[] }) {
        super({ inputVariables: args.inputVariables });
        this.tools = args.tools;
    }

    _getPromptType(): string {
        throw new Error("Not implemented");
    }

    formatMemory = (inputVariables: InputValues) => {
        const chatHistory = inputVariables.chat_history;
        let response = "Here is the conversation history so far: \n"
        chatHistory.forEach(message => {
            let chat = message._getType() === "human" ? "Human: " + message.text : "You: " + message.text;
            response += chat + "\n"
        });

        return response;
    }

    async formatMessages(inputVariables: InputValues): Promise<BaseChatMessage[]> {
        console.log(inputVariables);
        const toolNames = this.tools.map((tool) => tool.name).join("\n");
        /** Construct the final template */
        const instructions = this.formatInstructions(toolNames);
        const memory = this.formatMemory(inputVariables);
        console.log(memory);
        const template = [this.prefix, memory, instructions, this.suffix].join("\n\n");

        console.log(template);
        /** Construct the agent_scratchpad */
        const intermediateSteps = inputVariables.intermediate_steps as AgentStep[];

        const agentScratchpad = intermediateSteps.reduce(
            (thoughts, { action, observation }) =>
                thoughts +
                [action.log, `\nObservation: ${observation}`, "Thought:"].join("\n"),
            ""
        );
        const newInput = { agentScrathpad: agentScratchpad, ...inputVariables };
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

    async init(key: string) {
        if (!this.initialized) {
            console.log("Not initialized, running initalization");
            this.key = key;

            this.tools = await this.initializeTools();
            this.personalityPrompt = await this.initializePrompt(this.tools);

            this.memory = await this.initializeMemory();  //motorhead / buffer.. switch between for testing
            this.chain = await this.constructChain(this.personalityPrompt);
            this.agent = await this.initializeAgent(this.chain);

            this.executor = await this.intializeAgentExecutor(this.agent, this.tools);
        }
    }

    async initializePrompt(tools: Tool[] ) {
        const prompt =
            new CustomPromptTemplate({
                tools,
                inputVariables: ["input", "chat_history"],
            });

        return prompt;
    }

    async initializeTools() {
        return [];
    }

    async initializeMemory() {
        const memory = new BufferMemory({
            returnMessages: true,
            memoryKey: "chat_history",
            inputKey: "input",
            outputKey: 'output',
        });

        memory.chatHistory.addUserMessage("Hey! What's your name?");
        memory.chatHistory.addAIChatMessage("My name is Emily!");

        return memory;
    }

    async constructChain(prompt: BasePromptTemplate) {
        const model = new ChatOpenAI();
        const memory = this.memory;
        console.log(memory);
        const chain = new ConversationChain({
            llm: model,
            memory: memory, // These params have to be explicitly named
            prompt
        });
        return chain;
    }

    async initializeAgent(llmChain: ConversationChain) {
        const agent = new LLMSingleActionAgent({
            llmChain,
            outputParser: new CustomOutputParser()
        });
        return agent;
    }

    async intializeAgentExecutor(agent: LLMSingleActionAgent, tools: any) {
        const executor = new AgentExecutor({ agent, tools });
        return executor;
    }

    async respondToMessage(message: string) {
        let executor = this.getExecutor();
        if (executor === null) {
            console.log("Please initialize the clone.");
        }
        else {
            const res = await executor.call({ message });
            console.log(res);
        }
    }

    getExecutor = () => {
        return this.executor;
    }
}
