import openCompiler from "../../simulated/openCompiler";

class CompilerService {
  compilers = new Map();

  init(key: string, language: string) {
    const compiler = new openCompiler();
    compiler.init(key, language);
    this.compilers.set(key, compiler);
    return compiler;
  }

  getCompiler(key: string) {
    return this.compilers.get(key);
  }

  async compile(key: string, input: string) {
    const compiler = this.getCompiler(key);
    if (!compiler) {
      throw new Error(`Compiler not found for key: ${key}`);
    }
    const output = compiler.compile(input);
    return output;
  }
}

export default new CompilerService();