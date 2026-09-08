import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, enum: ['virtual', 'onsite'], required: true },
    expertRole: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    address: { type: String },
    status: { type: String, default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);