import openCompiler from "../../simulated/openCompiler";
import fs from 'fs';
import path from 'path';
import chalk from 'chalk'
import OpenCompiler from "../../simulated/openCompiler";

const compilers = new Map<string, OpenCompiler>();

const initializeCompiler = (key: string, language: string) =>{
  if (!getCompiler(key)) {
    const compiler = new openCompiler();
    compiler.init(key, language);
    compilers.set(key, compiler);
    return ("Compiler with key: " + key + " succesfully initialized")
  }
  else {
    console.log(chalk.blue("Compiler with key: " + key + " is already initialized"));
    return ("Compiler with key: " + key + " is already initialized");
  }
}

const getCompiler = (key: string) => {
  const compiler = compilers.get(key);
  return compiler;
}

const compile = async(key: string, codePath: string) => {
  console.log(key)
  console.log(chalk.blue("Got request to compile from : " + codePath));
  const compiler = getCompiler(key);
  if (!compiler || compiler.key !== key) {
    throw new Error(chalk.red(`Compiler not found for key: ${key}`));
  }
  else if(compiler.initialized){
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

export default {initializeCompiler, compile}