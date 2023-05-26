import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ZeroShotAgent, AgentExecutor } from "langchain/agents";
import { DynamicTool, SerpAPI } from "langchain/tools";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";

const compile = () => {
    const url = "http://localhost:3000/api/v1/openCompiler";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "key": key
        }),
      })
      return response.json();
    }
    catch (error) {
      return ("Could not connect to server")
    }
}


export const run = async () => {
    const tools = [
        new DynamicTool({
            name: "Compiler",
            description:
              "call this to run your code",
            func: async () => ,
          }),
    ]

  const prompt = ZeroShotAgent.createPrompt(tools, {
    prefix: `Answer the following questions as best you can, but speaking as a pirate might speak. You have access to the following tools:`,
    suffix: `Begin! Remember to speak as a pirate when giving your final answer. Use lots of "Args"`,
  });

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    new SystemMessagePromptTemplate(prompt),
    HumanMessagePromptTemplate.fromTemplate(`{input}

    This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
    {agent_scratchpad}`),
  ]);

  const chat = new ChatOpenAI({});

  const llmChain = new LLMChain({
    prompt: chatPrompt,
    llm: chat,
  });

  const agent = new ZeroShotAgent({
    llmChain,
    allowedTools: tools.map((tool) => tool.name),
  });

  const executor = AgentExecutor.fromAgentAndTools({ agent, tools });

  const response = await executor.run(
    "What is the value of foo?"
  );

  console.log(response);
};