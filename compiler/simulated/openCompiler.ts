import { Configuration, OpenAIApi} from "openai"
import { OpenAI } from "langchain/llms/openai";
import { BasePromptTemplate, PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

export default class OpenCompiler {
    initialized: boolean;
    key: string;

    promptData: any;
    prompt: any;
    tools: any;

    chain: any;
    memory: any;
    model = new OpenAI({ temperature: 0 });

    constructor() {
        this.initialized = false;
        this.key = "";

        this.prompt;
        this.tools;
        this.chain;
        this.memory;
    }

    async init(key: string) {
        if (!this.initialized) {
          console.log("Not initialized, running initalization");
          this.key = key;
    
          this.prompt = await this.getPromptData();
          this.memory = await this.initializeBufferMemory();  //motorhead / buffer.. switch between for testing
          this.chain = await this.constructChain(this.prompt);
        }
    }

    async initializeBufferMemory() {
        const memory = new BufferMemory();
        return memory;
    }

    constructChain = (prompt: BasePromptTemplate) => {
        const memory = this.memory
        const chain = new LLMChain({ llm: this.model, prompt, memory });
        return chain
    }

    getPromptData = () =>{
        return (
            "You are a Python Compiler. Compile any code that you are given and return the output"
        )
    }
}
