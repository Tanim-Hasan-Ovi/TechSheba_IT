import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquarePlus, X, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function Stars({ rating, size = 'w-4 h-4' }) {
    const rounded = Math.round(rating);
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${size} ${n <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                />
            ))}
        </div>
    );
}

export default function ReviewSection({ isLoggedIn = false }) {
    const [reviews, setReviews] = useState([]);
    const [average, setAverage] = useState(0);
    const [count, setCount] = useState(0);

    const [eligibleBookings, setEligibleBookings] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState('');
    const [formRating, setFormRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState(null); // { type: 'success' | 'error', text: string }

    const loadReviews = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/review`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.reviews);
                setAverage(data.average);
                setCount(data.count);
            }
        } catch {
            // The section just shows nothing if the API is briefly unavailable.
        }
    }, []);

    const loadEligibleBookings = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/review/eligible-bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setEligibleBookings(data.bookings);
                setSelectedBookingId((prev) => prev || data.bookings[0]?.id || '');
            }
        } catch {
            // Silently skip — the "Write a Review" prompt just won't show.
        }
    }, []);

    useEffect(() => {
        const requestId = window.setTimeout(() => { void loadReviews(); }, 0);
        return () => window.clearTimeout(requestId);
    }, [loadReviews]);

    useEffect(() => {
        if (!isLoggedIn) return undefined;
        const requestId = window.setTimeout(() => { void loadEligibleBookings(); }, 0);
        return () => window.clearTimeout(requestId);
    }, [isLoggedIn, loadEligibleBookings]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!selectedBookingId || !comment.trim()) return;

        setSubmitting(true);
        setFormMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ bookingId: selectedBookingId, rating: formRating, comment: comment.trim() }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setFormMessage({ type: 'error', text: data.message || 'Failed to submit review.' });
                return;
            }

            setFormMessage({ type: 'success', text: 'Thanks for your feedback!' });
            setComment('');
            setFormRating(5);
            setSelectedBookingId('');
            await Promise.all([loadReviews(), loadEligibleBookings()]);
            setTimeout(() => {
                setShowForm(false);
                setFormMessage(null);
            }, 1500);
        } catch {
            setFormMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="reviews" className="py-16 bg-white border-y border-slate-200/60 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What Our Customers Say</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-3xl font-extrabold text-slate-900">{average.toFixed(1)}</span>
                            <div>
                                <Stars rating={average} size="w-5 h-5" />
                                <p className="text-xs text-slate-500 mt-0.5">Based on {count} reviews</p>
                            </div>
                        </div>
                    </div>

                    {isLoggedIn && eligibleBookings.length > 0 && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all self-start"
                        >
                            <MessageSquarePlus className="w-4 h-4" />
                            Write a Review
                        </button>
                    )}
                </div>

                <div className="flex gap-5 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-transparent">
                    {reviews.map((r, idx) => (
                        <div
                            key={r.id || idx}
                            className="snap-start min-w-[260px] sm:min-w-[300px] max-w-[300px] bg-slate-50/60 rounded-2xl p-5 border border-slate-200/80 shrink-0"
                        >
                            <Stars rating={r.rating} />
                            <p className="text-sm text-slate-700 mt-3 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                            <p className="text-xs font-semibold text-sky-600 mt-4 uppercase tracking-wide">{r.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            {showForm && isLoggedIn && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Write a Review</h3>

                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            {eligibleBookings.length > 1 && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                        Which booking?
                                    </label>
                                    <select
                                        value={selectedBookingId}
                                        onChange={(e) => setSelectedBookingId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                    >
                                        {eligibleBookings.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.expertRole} — {b.date} at {b.time}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Your Rating
                                </label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button type="button" key={n} onClick={() => setFormRating(n)}>
                                            <Star className={`w-7 h-7 transition-colors ${n <= formRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Your Feedback
                                </label>
                                <textarea
                                    required
                                    maxLength={240}
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience..."
                                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
                                />
                            </div>

                            {formMessage && (
                                <p className={`text-sm font-medium ${formMessage.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {formMessage.text}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit Review
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
