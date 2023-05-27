import openCompiler from "../../simulated/openCompiler";
import fs from 'fs';
import path from 'path';

class CompilerService {
  compilers = new Map();

  init(key: string, language: string) {
    if (!this.getCompiler(key)) {
      const compiler = new openCompiler();
      compiler.init(key, language);
      this.compilers.set(key, compiler);
      return compiler;
    }
    else {
      console.log("Compiler with key: " + key + " is already initialized");
      return ("Compiler with key: " + key + " is already initialized");
    }
  }

  getCompiler(key: string) {
    return this.compilers.get(key);
  }

  async compile(key: string, codePath: string) {
    console.log("Got request to compile from : " + codePath);
    const compiler = this.getCompiler(key);
    if (!compiler) {
      throw new Error(`Compiler not found for key: ${key}`);
    }

    const data = fs.readFileSync(codePath, 'utf8');

    const relPath = './autoCompiledCode/code' + key + '.txt'
    const absolutePath = path.resolve(relPath);

    fs.writeFileSync(absolutePath, data, 'utf8');
    console.log("Wrote to file: " + absolutePath)
    
    const code = fs.readFileSync(absolutePath, 'utf8');

    const output = await compiler.compile(code);
    console.log(output.response)
    return output.response;
  }
}

export default new CompilerService();