import openCompiler from "../../simulated/openCompiler";
import fs from 'fs';
import path from 'path';
import chalk from 'chalk'

class CompilerService {
  compilers = new Map();

  init(key: string, language: string) {
    if (!this.getCompiler(key)) {
      const compiler = new openCompiler();
      compiler.init(key, language);
      this.compilers.set(key, compiler);
      return  ("Compiler with key: " + key + " succesfully initialized")
    }
    else {
      console.log(chalk.blue("Compiler with key: " + key + " is already initialized"));
      return ("Compiler with key: " + key + " is already initialized");
    }
  }

  getCompiler(key: string) {
    return this.compilers.get(key);
  }

  async compile(key: string, codePath: string) {
    console.log(chalk.blue("Got request to compile from : " + codePath));
    const compiler = this.getCompiler(key);
    if (compiler.key !== key) {
      throw new Error(chalk.red(`Compiler not found for key: ${key}`));
    }
    else{
      const data = fs.readFileSync(codePath, 'utf8');

      const relPath = './autoCompiledCode/code' + key + '.txt'
      const absolutePath = path.resolve(relPath);
  
      fs.writeFileSync(absolutePath, data, 'utf8');
      console.log(chalk.bgBlue("Wrote to file: " + absolutePath + "\n"));
      
      const code = fs.readFileSync(absolutePath, 'utf8');
      console.log(chalk.greenBright("Recieved Code: " + code));
  
      const output = await compiler.compile(code);
      console.log(output.response)
      return output.response;
    }
  }
}

export default new CompilerService();