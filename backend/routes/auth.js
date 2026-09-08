import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

const getOAuthClient = () => {
    return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
};

const createToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '7d' }
    );
};

const formatUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
    address: user.address,
    role: user.role,
});

// Regular Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
        });

        const token = createToken(user);

        res.status(201).json({
            success: true,
            token,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

// Regular Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = createToken(user);

        res.status(200).json({
            success: true,
            token,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Google Login
router.post('/google-login', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ success: false, message: 'Credential is required' });
    }

    try {
        const client = getOAuthClient();
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                avatar: picture,
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            if (!user.avatar && picture) user.avatar = picture;
            await user.save();
        }

        const token = createToken(user);

        res.status(200).json({
            success: true,
            token,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(400).json({ success: false, message: 'Google authentication failed' });
    }
});

export default router;