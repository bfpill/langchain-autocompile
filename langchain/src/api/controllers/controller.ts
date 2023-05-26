import basicServices from "../services/basicServices";

const newChatMessage = async (req, res) => {
    const { body } = req;
    if (
        !body.key || 
        !body.message
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                        "Error occurred because you failed to provide a clone key or a message"
                },
            });
        return;
    }
    const {key, message} = body;
    const messageResponse = await basicServices.respondToMessage(key, message);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

const init = async (req: any, res: any) => {
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
                        "Error occurred because you failed to provide a clone key or a message"
                },
            });
        return;
    }
    const {key} = body;
    const result = await basicServices.init(key);

    res.status(201).send({ status: "OK", data: {result} });
};

const run = async (req: any, res: any) => {
    const result = await basicServices.run();

    res.status(201).send({ status: "OK", data: {result} });
};


export default {
    newChatMessage,
    init, 
    run
};