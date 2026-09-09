import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

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

        if (phone && !BD_PHONE_REGEX.test(phone)) {
            return res.status(400).json({ success: false, message: 'Phone number must be 11 digits starting with 013-019' });
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
        res.status(400).json({ success: false, message: error.message || 'Google authentication failed' });
    }
});

// Update Profile (phone & address)
router.put('/update-profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const phone = req.body.phone?.trim();
        const address = req.body.address?.trim();
        const updates = {};
        const fieldsToRemove = {};

        if (phone && !BD_PHONE_REGEX.test(phone)) {
            return res.status(400).json({ success: false, message: 'Phone number must be 11 digits starting with 013-019' });
        }

        if (phone) updates.phone = phone;
        else fieldsToRemove.phone = 1;
        if (address) updates.address = address;
        else fieldsToRemove.address = 1;

        const user = await User.findByIdAndUpdate(
            decoded.userId,
            {
                ...(Object.keys(updates).length && { $set: updates }),
                ...(Object.keys(fieldsToRemove).length && { $unset: fieldsToRemove }),
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, user: formatUserResponse(user) });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to update profile' });
    }
});

export default router;
