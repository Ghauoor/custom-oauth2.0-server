import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";

import productController from "./controllers/product.js";
import userController from "./controllers/user.js";
import authController from "./controllers/auth.js";
import clientController from "./controllers/client.js";
import { authorization, decision, refreshToken, token } from "./controllers/oauth2.js";

dotenv.config();

const app = express();

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("DB is connected"))
    .catch((err) => console.error("DB connection error:", err));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(
    session({
        secret: process.env.SESSION_SECRET || "Super Secret Session Key",
        saveUninitialized: true,
        resave: true,
    })
);
app.use(passport.initialize());

const router = express.Router();

router
    .route("/products")
    .post(authController.isAuthenticated, productController.postProduct)
    .get(authController.isAuthenticated, productController.getProducts);

router
    .route("/products/:product_id")
    .get(authController.isAuthenticated, productController.getProduct)
    .delete(authController.isAuthenticated, productController.deleteProduct);

router
    .route("/users")
    .get(authController.isAuthenticated, userController.getUsers)
    .post(userController.postUser);

router
    .route("/clients")
    .post(authController.isAuthenticated, clientController.postClient)
    .get(authController.isAuthenticated, clientController.getClients);

// OAuth2 routes
router
    .route("/oauth2/authorize")
    .get(authController.isAuthenticated, authorization)
    .post(authController.isAuthenticated, decision);

router.route("/oauth2/token").post(authController.isClientAuthenticated, token);
router.post(
    '/oauth2/refresh',
    // authController.isClientAuthenticated,
    refreshToken
);

// Use API routes
app.use("/api", router);

// Start the server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});