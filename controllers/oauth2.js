import oauth2orize from "oauth2orize";
import Client from "../models/client.js";

import Code from "../models/code.js";
import { TokenService } from "../models/token.js";

const server = oauth2orize.createServer();

// Serialize client information into session
server.serializeClient((client, callback) => {
    callback(null, client._id);
});

// Deserialize client information from session
server.deserializeClient(async (id, callback) => {
    try {
        const client = await Client.findById(id);
        callback(null, client);
    } catch (err) {
        callback(err);
    }
});

// Grant authorization codes
server.grant(
    oauth2orize.grant.code(async (client, redirectUri, user, ares, callback) => {
        try {
            const code = new Code({
                value: generateUID(16),
                clientId: client._id,
                redirectUri,
                userId: user._id,
            });

            await code.save();
            callback(null, code.value);
        } catch (err) {
            callback(err);
        }
    })
);

// Exchange authorization codes for access tokens
server.exchange(
    oauth2orize.exchange.code(async (client, code, redirectUri, callback) => {
        try {
            const authCode = await Code.findOne({ value: code });

            if (!authCode ||
                authCode.clientId.toString() !== client._id.toString() ||
                authCode.redirectUri !== redirectUri) {
                return callback(null, false);
            }

            await authCode.deleteOne();

            const tokenService = new TokenService({
                accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
                refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
            });

            const payload = {
                userId: authCode.userId,
                clientId: authCode.clientId,
                scope: '*'
            };

            const accessToken = tokenService.generateAccessToken(payload);
            const refreshToken = await tokenService.generateRefreshToken(
                authCode.userId,
                authCode.clientId
            );

            callback(null, accessToken, refreshToken, { expires_in: 3600 });
        } catch (err) {
            callback(err);
        }
    })
);

// Authorization endpoint
export const authorization = [
    server.authorization(async (clientId, redirectUri, callback) => {
        try {
            const client = await Client.findOne({ id: clientId });
            callback(null, client, redirectUri);
        } catch (err) {
            callback(err);
        }
    }),
    (req, res) => {
        res.render("dialog", {
            transactionID: req.oauth2.transactionID,
            user: req.user,
            client: req.oauth2.client,
        });
    },
];

export const refreshToken = async (req, res) => {
    try {
        // Get client credentials from Basic Auth header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'Missing client authentication' });
        }

        // Extract and decode client credentials
        const credentials = Buffer.from(authHeader.split(' ')[1], 'base64')
            .toString('utf-8')
            .split(':');
        const [clientId, clientSecret] = credentials;

        // Verify client
        const client = await Client.findOne({ id: clientId, secret: clientSecret });
        if (!client) {
            return res.status(401).json({ error: 'Invalid client credentials' });
        }

        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const tokenService = new TokenService({
            accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
            refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
        });

        const refreshTokenDoc = await tokenService.verifyRefreshToken(refresh_token);
        if (!refreshTokenDoc || refreshTokenDoc.clientId !== client._id.toString()) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const payload = {
            userId: refreshTokenDoc.userId,
            clientId: refreshTokenDoc.clientId,
            scope: '*'
        };

        const accessToken = tokenService.generateAccessToken(payload);
        const newRefreshToken = await tokenService.generateRefreshToken(
            refreshTokenDoc.userId,
            client._id.toString()
        );

        // Revoke the old refresh token
        await tokenService.revokeRefreshToken(refresh_token);

        res.json({
            access_token: accessToken,
            refresh_token: newRefreshToken,
            expires_in: 3600,
            token_type: 'Bearer'
        });
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};


export const decision = [server.decision()];


export const token = [server.token(), server.errorHandler()];


const generateUID = (length) => {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[getRandomInt(0, chars.length - 1)];
    }
    return result;
};


const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;