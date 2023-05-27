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
    //memory: any;
    model = new OpenAI({ temperature: 0 });

    constructor() {
        this.initialized = false;
        this.key = "";
        this.language = "";
        this.prompt;
        this.tools;
        this.chain;
        //this.memory;
    }

    async init(key: string, language: string) {
        if (!this.initialized) {
            console.log("Not initialized, running initalization");
            this.key = key;
            this.language = language;

            this.prompt = this.getPromptData(this.language);
            //this.memory = this.initializeMotorheadMemory();  //motorhead / buffer.. switch between for testing
            this.chain = this.constructChain(this.prompt, this.model);
            this.initialized = true;
            console.log("Initalization of compiler {key: "+ key + " , language: " + language + "} complete");
        }
    }

    initializeMotorheadMemory= () => {
        const memory = new BufferMemory();
        return memory;
    }

    getPromptData = (language: string) => {
        return (
            PromptTemplate.fromTemplate(`You are a highly accurate simulation of a ` + language + ` executor. Please run the following code in ` + language + `and output the result, be it an error or output. 
            Here is the code: 
                {code}
            `)
        )
    }

    constructChain = (prompt: PromptTemplate, model: BaseLanguageModel) => {
        const chain = new ConversationChain({ prompt, llm: model });
        return chain;
    }

    compile = async (input: string) => {
        try { 
            if(this.chain !== undefined) {
                console.log(input);
                const res = await this.chain.call({ code: input });
                return res;
            }
        } catch {
            return ("Could not compile, compiler is not initialized")
        }
    }
}
