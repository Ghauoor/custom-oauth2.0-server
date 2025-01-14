import User from "../models/user.js";

// Create a new user
const postUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "Username and password are required fields." });
        }

        // Create and save the user
        const user = new User({ username, password });
        await user.save();

        res
            .status(201)
            .json({ message: "New user added successfully!", data: user });
    } catch (err) {
        res.status(500).json({
            error: "An error occurred while adding the user.",
            details: err.message,
        });
    }
};

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({
            error: "An error occurred while fetching users.",
            details: err.message,
        });
    }
};

export default { getUsers, postUser };