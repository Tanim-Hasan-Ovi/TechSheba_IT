import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

const router = express.Router();

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

const SERVICE_PRICES = { virtual: 1000, onsite: 1500, commercial: 20000 };

const SSLCOMMERZ_IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const SSLCOMMERZ_INIT_URL = SSLCOMMERZ_IS_LIVE
    ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
const SSLCOMMERZ_VALIDATION_URL = SSLCOMMERZ_IS_LIVE
    ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
    : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Verifies a completed payment with SSLCommerz's server-to-server validation API
// and marks the matching booking confirmed. Safe to call more than once for the
// same transaction (from both the browser redirect and the IPN callback).
const verifyAndConfirmPayment = async ({ tran_id, val_id }) => {
    const booking = await Booking.findOne({ transactionId: tran_id });
    if (!booking) return { ok: false, reason: 'Booking not found for this transaction' };
    if (booking.paymentStatus === 'paid') return { ok: true, booking };
    if (!val_id) return { ok: false, reason: 'Missing val_id' };

    const params = new URLSearchParams({
        val_id,
        store_id: process.env.SSLCOMMERZ_STORE_ID,
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
        format: 'json',
    });

    const verifyRes = await fetch(`${SSLCOMMERZ_VALIDATION_URL}?${params.toString()}`);
    const verifyData = await verifyRes.json();

    const isValidStatus = verifyData.status === 'VALID' || verifyData.status === 'VALIDATED';
    const amountMatches = Math.round(parseFloat(verifyData.amount)) === Math.round(booking.amount);
    const currencyMatches = verifyData.currency_type === 'BDT' || verifyData.currency === 'BDT';

    if (!isValidStatus || !amountMatches || !currencyMatches) {
        booking.paymentStatus = 'failed';
        await booking.save();
        return { ok: false, reason: 'Payment could not be validated', booking };
    }

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    await booking.save();
    return { ok: true, booking };
};

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

// Start a booking + SSLCommerz payment session. The booking is created with
// paymentStatus 'pending' and only flips to 'confirmed' once payment clears.
router.post('/init-payment', authMiddleware, async (req, res) => {
    try {
        const { serviceType, expertRole, date, time, phone, address } = req.body;
        const amount = SERVICE_PRICES[serviceType];

        if (!amount || !expertRole || !date || !time) {
            return res.status(400).json({ success: false, message: 'Please provide all required booking fields' });
        }

        const trimmedPhone = phone?.trim();
        if (!trimmedPhone || !BD_PHONE_REGEX.test(trimmedPhone)) {
            return res.status(400).json({ success: false, message: 'Phone number must be 11 digits starting with 013-019' });
        }

        const needsAddress = serviceType !== 'virtual';
        const trimmedAddress = address?.trim();
        if (needsAddress && !trimmedAddress) {
            return res.status(400).json({ success: false, message: 'Address is required for this service type' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
            return res.status(500).json({ success: false, message: 'Payment gateway is not configured' });
        }

        const tranId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const booking = await Booking.create({
            user: req.userId,
            serviceType,
            expertRole,
            amount,
            date,
            time,
            phone: trimmedPhone,
            address: needsAddress ? trimmedAddress : undefined,
            status: 'pending',
            paymentStatus: 'pending',
            transactionId: tranId,
        });

        const initParams = new URLSearchParams({
            store_id: process.env.SSLCOMMERZ_STORE_ID,
            store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
            total_amount: String(amount),
            currency: 'BDT',
            tran_id: tranId,
            success_url: `${BACKEND_URL}/api/booking/payment/success`,
            fail_url: `${BACKEND_URL}/api/booking/payment/fail`,
            cancel_url: `${BACKEND_URL}/api/booking/payment/cancel`,
            ipn_url: `${BACKEND_URL}/api/booking/payment/ipn`,
            shipping_method: 'NO',
            product_name: `${expertRole} - ${serviceType} IT support`,
            product_category: 'Service',
            product_profile: 'general',
            cus_name: user.name || 'Customer',
            cus_email: user.email,
            cus_add1: needsAddress ? trimmedAddress : 'N/A',
            cus_city: 'Dhaka',
            cus_country: 'Bangladesh',
            cus_phone: trimmedPhone,
        });

        const gatewayRes = await fetch(SSLCOMMERZ_INIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: initParams.toString(),
        });
        const gatewayData = await gatewayRes.json();

        if (gatewayData.status !== 'SUCCESS' || !gatewayData.GatewayPageURL) {
            booking.paymentStatus = 'failed';
            await booking.save();
            return res.status(502).json({ success: false, message: gatewayData.failedreason || 'Failed to start payment session' });
        }

        res.status(200).json({ success: true, gatewayUrl: gatewayData.GatewayPageURL, tranId });
    } catch (err) {
        console.error('Init Payment Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to start payment session' });
    }
});

// SSLCommerz redirects the customer's browser here after payment; validate
// server-to-server before trusting it, then hand back to the frontend.
router.post('/payment/success', async (req, res) => {
    const { tran_id, val_id } = req.body;
    try {
        const result = await verifyAndConfirmPayment({ tran_id, val_id });
        const redirectStatus = result.ok ? 'success' : 'fail';
        res.redirect(`${FRONTEND_URL}/?payment=${redirectStatus}&tran_id=${encodeURIComponent(tran_id || '')}`);
    } catch (err) {
        console.error('Payment Success Handler Error:', err);
        res.redirect(`${FRONTEND_URL}/?payment=fail&tran_id=${encodeURIComponent(tran_id || '')}`);
    }
});

router.post('/payment/fail', async (req, res) => {
    const { tran_id } = req.body;
    try {
        await Booking.findOneAndUpdate({ transactionId: tran_id, paymentStatus: 'pending' }, { paymentStatus: 'failed' });
    } catch (err) {
        console.error('Payment Fail Handler Error:', err);
    }
    res.redirect(`${FRONTEND_URL}/?payment=fail&tran_id=${encodeURIComponent(tran_id || '')}`);
});

router.post('/payment/cancel', async (req, res) => {
    const { tran_id } = req.body;
    try {
        await Booking.findOneAndUpdate({ transactionId: tran_id, paymentStatus: 'pending' }, { paymentStatus: 'cancelled' });
    } catch (err) {
        console.error('Payment Cancel Handler Error:', err);
    }
    res.redirect(`${FRONTEND_URL}/?payment=cancel&tran_id=${encodeURIComponent(tran_id || '')}`);
});

// Server-to-server confirmation, independent of whether the customer's browser
// makes it back to success_url. SSLCommerz just needs a 200 response here.
router.post('/payment/ipn', async (req, res) => {
    const { tran_id, val_id } = req.body;
    try {
        await verifyAndConfirmPayment({ tran_id, val_id });
    } catch (err) {
        console.error('Payment IPN Error:', err);
    }
    res.status(200).send('OK');
});

// Demo-only stand-in for the real gateway: skips SSLCommerz entirely and just
// confirms the booking directly, for the in-page mock checkout UI. No real
// payment is ever taken here.
router.post('/mock-pay', authMiddleware, async (req, res) => {
    try {
        const { serviceType, expertRole, date, time, phone, address } = req.body;
        const amount = SERVICE_PRICES[serviceType];

        if (!amount || !expertRole || !date || !time) {
            return res.status(400).json({ success: false, message: 'Please provide all required booking fields' });
        }

        const trimmedPhone = phone?.trim();
        if (!trimmedPhone || !BD_PHONE_REGEX.test(trimmedPhone)) {
            return res.status(400).json({ success: false, message: 'Phone number must be 11 digits starting with 013-019' });
        }

        const needsAddress = serviceType !== 'virtual';
        const trimmedAddress = address?.trim();
        if (needsAddress && !trimmedAddress) {
            return res.status(400).json({ success: false, message: 'Address is required for this service type' });
        }

        const booking = await Booking.create({
            user: req.userId,
            serviceType,
            expertRole,
            amount,
            date,
            time,
            phone: trimmedPhone,
            address: needsAddress ? trimmedAddress : undefined,
            status: 'confirmed',
            paymentStatus: 'paid',
            transactionId: `MOCK_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        });

        res.status(201).json({ success: true, booking });
    } catch (err) {
        console.error('Mock Pay Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Payment simulation failed' });
    }
});

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
        const bookings = await Booking.find({
            user: req.userId,
            paymentStatus: { $nin: ['failed', 'cancelled'] },
        }).sort({ createdAt: -1 });
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
