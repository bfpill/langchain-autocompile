import openCompiler from "../../simulated/openCompiler";
import fs from 'fs';
import path from 'path';

class CompilerService {
  compilers = new Map();

  init(key: string, language: string) {
    if(!this.getCompiler(key)){
        const compiler = new openCompiler();
        compiler.init(key, language);
        this.compilers.set(key, compiler);
        return compiler;
    }
    else{
        console.log("Compiler with key: " + key + " is already initialized");
        return("Compiler with key: " + key + " is already initialized");
    }
  }

  getCompiler(key: string) {
    return this.compilers.get(key);
  }

  async compile(key: string, code: string) {
    console.log("Got request to compile: " + code);
    const compiler = this.getCompiler(key);
    if (!compiler) {
      throw new Error(`Compiler not found for key: ${key}`);
    }

    const relPath = './autoCompiledCode/code' + key + '.txt'
    const absolutePath = path.resolve(relPath);
    fs.writeFile(absolutePath, code, 'utf8', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });

    const data = fs.readFileSync(absolutePath, 'utf8');
    console.log(data);

    const output = compiler.compile(data);
    console.log("Output from compiler: " + output)
    return output;
  }
}

export default new CompilerService();