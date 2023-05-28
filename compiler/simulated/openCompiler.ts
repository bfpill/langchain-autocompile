import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { ConversationChain } from "langchain/chains";
import { BaseLanguageModel } from "langchain/dist/base_language";
import { MotorheadMemory } from "langchain/memory"
  
export default class OpenCompiler {
    initialized: boolean;
    key: string;
    language: string;
    promptData: any;
    prompt: any;
    tools: any;
    chain: any;
    memory: any;
    model = new OpenAI({ temperature: 0 });

    constructor() {
        this.initialized = false;
        this.key = "";
        this.language = "";
        this.prompt;
        this.tools;
        this.chain;
        this.memory;
    }

    async init(key: string, language: string) {
        if (!this.initialized) {
            console.log("Not initialized, running initalization");
            this.key = key;
            this.language = language;

            this.prompt = this.getPromptData(this.language);
            this.memory = this.initializeMotorheadMemory();  //motorhead / buffer.. switch between for testing
            this.chain = this.constructChain(this.memory, this.prompt, this.model);
            this.initialized = true;
            console.log("Initalization of compiler {key: "+ key + " , language: " + language + "} complete");
        }
    }

    initializeMotorheadMemory= () => {
        const memory = new MotorheadMemory({
            sessionId: "user-id",
            motorheadURL: "localhost:8080",
            returnMessages: true, 
            memoryKey: "chat_history"
        });
        
        const context = memory.context
          ? `
        Here's previous context: ${memory.context}`
          : "";
        
        return context;
    }

    getPromptData = (language: string) => {
        return (
            PromptTemplate.fromTemplate(`You are a highly accurate simulation of a ` + language + ` executor. Please run the following code in 
            ` + language + `and output the result exactly as a ` + language + ` compiler would with no other text whatsoever'
            Here is the code you have been asked to run first: {chat_history}
            Here is the code: 
                {code}
            `)
        )
    }

    constructChain = (memory: any ,prompt: PromptTemplate, model: BaseLanguageModel) => {
        const chain = new ConversationChain({ memory, prompt, llm: model });
        return chain;
    }

    compile = async (input: string) => {
        try { 
            if(this.chain !== undefined) {
                console.log(input);
                const res = await this.chain.call({ code: input });
                console.log(res);
                return res;
            }
        } catch {
            return ("Could not compile, compiler is not initialized")
        }
    }
}
