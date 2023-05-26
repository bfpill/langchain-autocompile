import Agent from "../../agent/agent";

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
}

export default new BasicAgentService();