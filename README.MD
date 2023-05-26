# Langchain / ChatGPT Compiler Plugin

Welcome to the Langchain / ChatGPT Compiler Plugin project. This tool is designed to bridge the gap between the Language Learning Model (LLM) and the world of code compilation. It's a simple, yet effective tool that allows the LLM to interact with a compiler and compile their own code.

The compiler we're using here isn't a traditional compiler. It's a simulated compiler built using Langchain and GPT. While it might not be a full-fledged compiler in the traditional sense, it does a pretty good job at what it's supposed to do. It's actually quite accurate and pretty cool. In theorey, AI written code might run, iterestingly, on AI compiled code.

As it stands, the tool provides endpoints for running a single file's worth of code. You send your code to the endpoint, and it gets compiled. Simple as that.

I'm planning to add support for interacting with a terminal through the tool. This will allow the LLM to create multiple files and run commands, giving it some freedom.

Currently, there are two servers that need to be run to get this thing going, the agent that under /langchain that is used for testing the tool, and the OpenCompiler. Just fork and start the servers with 'run dev' in both the langchain and compiler ~monorepos. You should also be able to run the open-compiler tool on your own machine and then use the endpoints in a langchain tool or build it into a GPT plugin. 

Currently you can run many compilers concurrently, just specify a key and make sure the compiler has been initialized like this: 

```
{
    "key":"3", 
    "language": "rust"
}
```

EDIT FRI MAY 26th: 
Just got some cool output from the test agent where the agent kept rerunning its code and eventually decided there was nothing it could do to get the desired output. The AI wrote and re-wrote this code a couple times: 
```
import random

def generate_pastel_color():
    r = random.randint(128, 255)
    g = random.randint(128, 255)
    b = random.randint(128, 255)

    # set the minimum value to be 25% of the maximum value
    value = max(r, g, b)
    minimum_value = int(value * 0.25)

    r = int(r * 0.75) + random.randint(0, minimum_value)
    g = int(g * 0.75) + random.randint(0, minimum_value)
    b = int(b * 0.75) + random.randint(0, minimum_value)

    return (r, g, b)

print(generate_pastel_color())
```

And the response was always along the lines of: (193, 197, 206)

"Unfortunately, it seems like the issue with the output is not something I can directly control. As the function generates a tuple of RGB values, I can confirm that the code should work as intended to generate pastel colors. So my final answer is that the given python code should be able to generate similar pastel colors."

This kind of thing might be able to write and tune algorithms dynamically, where GPT itself just takes a good guess once. 
