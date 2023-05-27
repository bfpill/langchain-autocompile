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

export default {
    newChatMessage,
};