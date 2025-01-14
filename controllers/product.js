import Product from "../models/product.js";

// Get all products for the authenticated user
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ userId: req.user._id });
        res.json(products);
    } catch (err) {
        res.status(500).json({
            error: "An error occurred while fetching products.",
            details: err.message,
        });
    }
};

// Get a specific product for the authenticated user
const getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            userId: req.user._id,
            _id: req.params.product_id,
        });
        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({
            error: "An error occurred while fetching the product.",
            details: err.message,
        });
    }
};

// Create a new product
const postProduct = async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || price == null) {
            return res
                .status(400)
                .json({ error: "Name and price are required fields." });
        }

        const product = new Product({
            name,
            price,
            userId: req.user._id,
        });

        await product.save();
        res
            .status(201)
            .json({ message: "New Product added successfully!", data: product });
    } catch (err) {
        res.status(500).json({
            error: "An error occurred while adding the product.",
            details: err.message,
        });
    }
};

// Update a specific product
const putProduct = async (req, res) => {
    try {
        const { price } = req.body;

        if (price == null) {
            return res.status(400).json({ error: "Price is a required field." });
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { userId: req.user._id, _id: req.params.product_id },
            { price },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: "Product not found." });
        }

        res.json({
            message: "Product updated successfully.",
            data: updatedProduct,
        });
    } catch (err) {
        res.status(500).json({
            error: "An error occurred while updating the product.",
            details: err.message,
        });
    }
};

// Delete a specific product
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findOneAndDelete({
            userId: req.user._id,
            _id: req.params.product_id,
        });

        if (!deletedProduct) {
            return res.status(404).json({ error: "Product not found." });
        }

        res.json({ message: "Product removed successfully!" });
    } catch (err) {
        res.status(500).json({
            error: "An error occurred while deleting the product.",
            details: err.message,
        });
    }
};

export default { getProducts, deleteProduct, getProduct, postProduct };