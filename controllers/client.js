import Client from "../models/client.js";

const getClients = async (req, res) => {
    try {
        const clients = await Client.find({ userId: req.user._id });
        res.json(clients);
    } catch (err) {
        res.status(500).send(err);
    }
};

const postClient = async (req, res) => {
    try {
        const client = new Client({
            name: req.body.name,
            id: req.body.id,
            secret: req.body.secret,
            userId: req.user._id,
        });

        await client.save();
        res.json({ message: "Client added successfully!", data: client });
    } catch (err) {
        res.status(500).send(err);
    }
};

export default { getClients, postClient };