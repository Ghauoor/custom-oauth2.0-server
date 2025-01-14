import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    id: { type: String, required: true },
    secret: { type: String, required: true },
    userId: { type: String, required: true },
});

const Client = mongoose.model("Client", ClientSchema);
export default Client;