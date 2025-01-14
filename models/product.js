import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    price: { type: Number, required: true },
    userId: { type: String, required: true },
});

const Product = mongoose.model("Product", ProductSchema);
export default Product;