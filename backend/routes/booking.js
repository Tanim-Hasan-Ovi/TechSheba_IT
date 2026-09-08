import express from 'express';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';

const router = express.Router();

// Middleware for Auth
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized access! Token missing.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.userId = decoded.userId || decoded.id;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token!' });
    }
};

// Create Booking
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { serviceType, expertRole, amount, date, time, address } = req.body;

        if (!serviceType || !expertRole || amount === undefined || !date || !time) {
            return res.status(400).json({ success: false, message: 'Please provide all required booking fields' });
        }

        const booking = new Booking({
            user: req.userId,
            serviceType,
            expertRole,
            amount: Number(amount),
            date,
            time,
            address,
        });

        await booking.save();
        res.status(201).json({ success: true, message: 'Booking Successful!', booking });
    } catch (err) {
        console.error('Create Booking Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get User Bookings
router.get('/my-bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (err) {
        console.error('Get Bookings Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;