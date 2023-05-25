import openCompilerServices from "../services/services"

const initCompiler = async (req, res) => {
    const { body } = req;

    if (
        !body.key
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                        "Error occurred because you failed to provide a compiler key"
                },
            });
        return;
    }

    const key = body.key;
    const result = await openCompilerServices.init(key);
    console.log(result);
    res.send({ status: "OK", data: result });
}

const compile = async (req, res) => {
    const { body } = req;

    if (
        !body.input
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                        "Error occurred because you failed to provide an input to compile"
                },
            });
        return;
    }

    const input = body.key;
    const output = await openCompilerServices.compile(input);
    console.log(output);
    res.send({ status: "OK", data: output });
}

export default {
    initCompiler, compile
};