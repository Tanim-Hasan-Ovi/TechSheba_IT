import express from 'express';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';

const router = express.Router();

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

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
        const { serviceType, expertRole, amount, date, time, phone, address } = req.body;

        if (!serviceType || !expertRole || amount === undefined || !date || !time) {
            return res.status(400).json({ success: false, message: 'Please provide all required booking fields' });
        }

        if (phone && !BD_PHONE_REGEX.test(phone)) {
            return res.status(400).json({ success: false, message: 'Phone number must be 11 digits starting with 013-019' });
        }

        const booking = new Booking({
            user: req.userId,
            serviceType,
            expertRole,
            amount: Number(amount),
            date,
            time,
            phone,
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

// Update the contact details saved specifically with a booking.
router.put('/:bookingId/contact', authMiddleware, async (req, res) => {
    try {
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
        const booking = await Booking.findOneAndUpdate(
            { _id: req.params.bookingId, user: req.userId },
            {
                ...(Object.keys(updates).length && { $set: updates }),
                ...(Object.keys(fieldsToRemove).length && { $unset: fieldsToRemove }),
            },
            { new: true, runValidators: true }
        );

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.status(200).json({ success: true, booking });
    } catch (err) {
        console.error('Update Booking Contact Error:', err);
        res.status(400).json({ success: false, message: err.message || 'Failed to update booking contact details' });
    }
});

export default router;
