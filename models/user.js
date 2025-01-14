import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, unique: true, required: true },
        password: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

// Hash the password before saving the user
UserSchema.pre("save", async function (next) {
    try {
        // Only hash the password if it has been modified or is new
        if (!this.isModified("password")) {
            return next();
        }

        // Generate a salt
        const salt = await bcrypt.genSalt(10);

        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);

        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare a provided password with the hashed password
UserSchema.methods.verifyPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", UserSchema);