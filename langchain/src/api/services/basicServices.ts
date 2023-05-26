import Agent from "../../agent/agent";
import { run } from "../../agent/custom_agent"
class BasicAgentService {
  agents = new Map();

  init(key: string) {
    if(!this.getAgent(key)){
        const agent = new Agent();
        agent.init(key);
        this.agents.set(key, agent);
        return agent;
    }
    else{
        return("Agent with key: " + key + " is already initialized");
    }
  }

  getAgent(key: string) {
    return this.agents.get(key);
  }

  async respondToMessage(key: string, input: string) {
    const agent = this.getAgent(key);
    try{
        const output = agent.respondToMessage(input);
        return output;
    } catch(error){
        console.log(error)
        return(`Compiler not found for key: ${key}`)
    }
  }

  async run() {
    try{
        const output = run();
        return output;
    } catch(error){
        console.log(error)
        return(error)
    }
  }
}

export default new BasicAgentService();