import openCompiler from "../../simulated/openCompiler"
const compiler = new openCompiler;

const init = async (key: string) =>{
    const result = compiler.init(key)
    return result;
}

const compile = async (input) => {
    const output = compiler.compile(input)
    return output;
}

export default {
    init, compile
}