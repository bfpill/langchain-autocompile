import { Configuration, OpenAIApi} from "openai"
import { OpenAI } from "langchain/llms/openai";
import { BasePromptTemplate, PromptTemplate } from "langchain/prompts";
import { ConversationChain, LLMChain, LLMChainInput } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { BaseLanguageModel } from "langchain/dist/base_language";

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
    
          this.prompt = this.getPromptData();
          this.memory = await this.initializeBufferMemory();  //motorhead / buffer.. switch between for testing
          this.chain = this.constructChain(this.prompt, this.model, this.memory);
          console.log("Initalization complete");
        }
    }

    async initializeBufferMemory() {
        const memory = new BufferMemory();
        return memory;
    }

    getPromptData = () =>{
        return (
            PromptTemplate.fromTemplate("You are a Python Compiler. Compile {code} and return the output")
        )
    }

    constructChain = (prompt: PromptTemplate, model: BaseLanguageModel, memory: any) => {
        const chain = new ConversationChain({ prompt, llm: model, memory: memory });
        return chain;
    }

    compile = async (input: any) => {
        if(this.chain !== undefined){
            console.log(input);
            const res = await this.chain.call({ code: input});
            console.log(res);
            return res;
        } else{
            return("Could not compile, compiler is not initialized")
        }
    }
}
