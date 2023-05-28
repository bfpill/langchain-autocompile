import Agent from "../../agent/agent_simple";

class BasicAgentService {
  agents = new Map();

  getAgent(key: string) {
    return this.agents.get(key);
  }

  createAndStoreAgent(key: string){
    const agent = new Agent(key);
    this.agents.set(key, agent);
    return agent;
  }

  async respondToMessage(key: string, input: string) {
    if(!this.getAgent(key)){
      this.createAndStoreAgent(key);
    }
    const agent = this.getAgent(key);
    try{
        const output = agent.run(input);
        return output;
    } catch(error){
        console.log(error)
        return(`Agent not found for key: ${key}`)
    }
  }
}

export default new BasicAgentService();