import mongoose from "mongoose";

const CodeSchema = new mongoose.Schema({
    value: { type: String, required: true },
    redirectUri: { type: String, required: true },
    userId: { type: String, required: true },
    clientId: { type: String, required: true },
});

const Code = mongoose.model("Code", CodeSchema);

export default Code;