# Langchain / ChatGPT Compiler Plugin

Welcome to the Langchain / ChatGPT Compiler Plugin project. This tool is designed to bridge the gap between the Language Learning Model (LLM) and the world of code compilation. It's a simple, yet effective tool that allows the LLM to interact with a compiler and compile their own code.

The compiler we're using here isn't a traditional compiler. It's a simulated compiler built using Langchain and GPT. While it might not be a full-fledged compiler in the traditional sense, it does a pretty good job at what it's supposed to do. It's actually quite accurate and pretty cool. In theorey, AI written code might run, iterestingly, on AI compiled code.

As it stands, the tool provides endpoints for running a single file's worth of code. You send your code to the endpoint, and it gets compiled. Simple as that.

I'm planning to add support for interacting with a terminal through the tool. This will allow the LLM to create multiple files and run commands, giving it some freedom.

Currently, there are two servers that need to be run to get this thing going, the agent that under /langchain that is used for testing the tool, and the OpenCompiler. Just fork and start the servers with 'run dev' in both the langchain and compiler ~monorepos. You should also be able to run the open-compiler tool on your own machine and then use the endpoints in a langchain tool or build it into a GPT plugin. 
