import passport from "passport";
import { BasicStrategy } from "passport-http";
import { Strategy as BearerStrategy } from "passport-http-bearer";

import User from "../models/user.js";
import Client from "../models/client.js";

import { TokenService } from "../models/token.js";

// Basic authentication for users
passport.use(
    new BasicStrategy(async (username, password, callback) => {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return callback(null, false, { message: "User not found" });
            }

            const isMatch = await user.verifyPassword(password);
            if (!isMatch) {
                return callback(null, false, { message: "Invalid credentials" });
            }

            return callback(null, user);
        } catch (err) {
            return callback(err);
        }
    })
);

// Basic authentication for clients
passport.use(
    "client-basic",
    new BasicStrategy(async (username, password, callback) => {
        try {
            const client = await Client.findOne({ id: username });
            if (!client || client.secret !== password) {
                return callback(null, false, { message: "Invalid client credentials" });
            }

            return callback(null, client);
        } catch (err) {
            return callback(err);
        }
    })
);

// Bearer token strategy
passport.use(new BearerStrategy(async (accessToken, callback) => {
    try {
        const tokenService = new TokenService({
            accessTokenSecret: process.env.ACCESS_TOKEN_SECRET
        });

        const payload = tokenService.verifyAccessToken(accessToken);
        if (!payload) {
            return callback(null, false, { message: 'Invalid access token' });
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            return callback(null, false, { message: 'User not found' });
        }

        return callback(null, user, { scope: payload.scope });
    } catch (err) {
        return callback(err);
    }
}));

// Middleware to authenticate users
const isAuthenticated = passport.authenticate(["basic", "bearer"], {
    session: false,
});

// Middleware to authenticate clients
const isClientAuthenticated = passport.authenticate("client-basic", {
    session: false,
});

// Middleware to authenticate bearer tokens
const isBearerAuthenticated = passport.authenticate("bearer", {
    session: false,
});

export default {
    isAuthenticated,
    isClientAuthenticated,
    isBearerAuthenticated,
};