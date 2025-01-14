import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    clientId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

export class TokenService {
    constructor(config) {
        this.accessTokenSecret = config.accessTokenSecret;
        this.refreshTokenSecret = config.refreshTokenSecret;
        this.accessTokenExpiration = config.accessTokenExpiration || '1h';
        this.refreshTokenExpiration = config.refreshTokenExpiration || '7d';
    }

    generateAccessToken(payload) {
        return jwt.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiration,
        });
    }

    async generateRefreshToken(userId, clientId) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

        const refreshToken = new RefreshToken({
            token,
            userId,
            clientId,
            expiresAt,
        });

        await refreshToken.save();
        return token;
    }

    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.accessTokenSecret);
        } catch (err) {
            return null;
        }
    }

    async verifyRefreshToken(token) {
        const refreshToken = await RefreshToken.findOne({
            token,
            expiresAt: { $gt: new Date() },
        });
        return refreshToken;
    }

    async revokeRefreshToken(token) {
        await RefreshToken.deleteOne({ token });
    }
}