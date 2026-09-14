import express from 'express';
import jwt from 'jsonwebtoken';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import SEED_REVIEWS from '../data/reviewSeed.js';

const router = express.Router();

// Same auth pattern used across the other routes.
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized access! Token missing.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.userId = decoded.userId || decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token!' });
    }
};

// A booking counts as "completed" once its scheduled slot has passed and
// payment cleared — there's no separate technician sign-off step yet.
const getBookingDateTime = (dateStr, timeStr) => {
    const match = timeStr?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return new Date(dateStr);

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};

const isBookingCompleted = (booking) =>
    booking.status === 'confirmed' &&
    booking.paymentStatus === 'paid' &&
    getBookingDateTime(booking.date, booking.time) <= new Date();

// Public: seed reviews + every real review, with the live overall average.
router.get('/', async (req, res) => {
    try {
        const dbReviews = await Review.find().sort({ createdAt: -1 }).lean();
        const realReviews = dbReviews.map((r) => ({
            id: r._id,
            name: r.name,
            rating: r.rating,
            comment: r.comment,
            date: r.createdAt,
        }));

        const reviews = [...realReviews, ...SEED_REVIEWS];
        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        const average = reviews.length ? total / reviews.length : 0;

        res.json({
            success: true,
            reviews,
            average: Math.round(average * 10) / 10,
            count: reviews.length,
        });
    } catch (err) {
        console.error('Get Reviews Error:', err);
        res.status(500).json({ success: false, message: 'Failed to load reviews' });
    }
});

// Bookings the logged-in user can still leave a review for: completed
// (paid + slot already passed) and not already reviewed.
router.get('/eligible-bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.userId, status: 'confirmed', paymentStatus: 'paid' })
            .sort({ createdAt: -1 });

        const completed = bookings.filter(isBookingCompleted);
        const reviewed = await Review.find({ user: req.userId }).select('booking');
        const reviewedIds = new Set(reviewed.map((r) => r.booking.toString()));

        const eligible = completed
            .filter((b) => !reviewedIds.has(b._id.toString()))
            .map((b) => ({ id: b._id, expertRole: b.expertRole, date: b.date, time: b.time }));

        res.json({ success: true, bookings: eligible });
    } catch (err) {
        console.error('Get Eligible Bookings Error:', err);
        res.status(500).json({ success: false, message: 'Failed to load eligible bookings' });
    }
});

// Submit a review for a completed booking (one review per booking).
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;
        const trimmedComment = comment?.trim();

        if (!bookingId || !rating || !trimmedComment) {
            return res.status(400).json({ success: false, message: 'bookingId, rating, and comment are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const booking = await Booking.findOne({ _id: bookingId, user: req.userId });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (!isBookingCompleted(booking)) {
            return res.status(400).json({ success: false, message: 'You can only review a completed booking' });
        }

        const existing = await Review.findOne({ booking: bookingId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
        }

        const user = await User.findById(req.userId);
        const review = await Review.create({
            user: req.userId,
            name: user?.name || 'TechSheba Customer',
            booking: bookingId,
            rating,
            comment: trimmedComment,
        });

        res.status(201).json({ success: true, message: 'Review submitted', review });
    } catch (err) {
        console.error('Create Review Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to submit review' });
    }
});

export default router;
