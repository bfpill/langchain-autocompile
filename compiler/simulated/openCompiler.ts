import { Configuration, OpenAIApi } from "openai"
import { OpenAI } from "langchain/llms/openai";
import { BasePromptTemplate, PromptTemplate } from "langchain/prompts";
import { ConversationChain, LLMChain, LLMChainInput } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { BaseLanguageModel } from "langchain/dist/base_language";

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
            this.memory = await this.initializeBufferMemory();  //motorhead / buffer.. switch between for testing
            this.chain = this.constructChain(this.prompt, this.model, this.memory);
            this.initialized = true;
            console.log("Initalization complete");
        }
    }

    async initializeBufferMemory() {
        const memory = new BufferMemory();
        return memory;
    }

    getPromptData = (language: string) => {
        return (
            PromptTemplate.fromTemplate("You are a " + language + ` Compiler. Compile {code} and return the output. 
            If there are any errors in the code, syntax or runtime, return the error exactly as a real compiler would. Make sure to compile the code in` + language)
        )
    }

    constructChain = (prompt: PromptTemplate, model: BaseLanguageModel, memory: any) => {
        const chain = new ConversationChain({ prompt, llm: model, memory: memory });
        return chain;
    }

    compile = async (input: any) => {
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
