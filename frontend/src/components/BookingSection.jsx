import { useState } from 'react';
import { Video, MapPin, Calendar, CheckCircle2, ArrowRight, Lock, CheckCircle, AlertCircle, Phone, Briefcase } from 'lucide-react';
import MockPaymentGateway from './MockPaymentGateway';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
const SERVICE_PRICES = { virtual: 1000, onsite: 1500, commercial: 20000 };

export default function BookingSection({
    experts = [],
    selectedExpert = '',
    setSelectedExpert = () => { },
    isLoggedIn = false,
    user = null,
    onUserUpdate = () => { },
    onRequireLogin = () => { },
}) {
    const [bookingType, setBookingType] = useState('virtual');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [phone, setPhone] = useState(() => user?.phone || '');
    const [address, setAddress] = useState(() => user?.address || '');

    // Keep the form in sync when the saved profile changes elsewhere (e.g. edited in the profile modal).
    // Adjusted during render (not an effect) so it applies before paint without an extra render pass.
    const userContactKey = user ? `${user.phone || ''}|${user.address || ''}` : '';
    const [syncedContactKey, setSyncedContactKey] = useState(userContactKey);
    if (userContactKey !== syncedContactKey) {
        setSyncedContactKey(userContactKey);
        setPhone(user?.phone || '');
        setAddress(user?.address || '');
    }

    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: string }
    const [pendingPayment, setPendingPayment] = useState(null); // booking payload once ready for checkout

    const needsAddress = bookingType === 'onsite' || bookingType === 'commercial';

    // On-site/Commercial: 4 slots per day (9AM-3PM, every 2h) | Virtual: 1 slot per hour (9AM-4PM)
    const onsiteSlots = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM'];
    const virtualSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    const timeSlots = bookingType === 'virtual' ? virtualSlots : onsiteSlots;

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage(null);

        // Check if user is logged in
        if (!isLoggedIn) {
            onRequireLogin();
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            onRequireLogin();
            return;
        }

        setLoading(true);

        const bookingPhone = phone.trim();
        const bookingAddress = address.trim();

        if (!BD_PHONE_REGEX.test(bookingPhone)) {
            setStatusMessage({ type: 'error', text: 'Phone number must be 11 digits starting with 013-019' });
            setLoading(false);
            return;
        }

        try {
            const savedPhone = user?.phone || '';
            const savedAddress = user?.address || '';
            const profileAddress = needsAddress ? bookingAddress : savedAddress;
            if (bookingPhone !== savedPhone || profileAddress !== savedAddress) {
                const profileRes = await fetch(`${API_URL}/api/auth/update-profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ phone: bookingPhone, address: profileAddress }),
                });
                const profileData = await profileRes.json();
                if (!profileRes.ok || !profileData.success) {
                    throw new Error(profileData.message || 'Could not save your contact information');
                }
                localStorage.setItem('user', JSON.stringify(profileData.user));
                onUserUpdate(profileData.user);
            }

            // Open the checkout UI; the booking itself is only created once
            // payment there completes (see MockPaymentGateway / mock-pay).
            setPendingPayment({
                serviceType: bookingType,
                expertRole: selectedExpert,
                date: selectedDate,
                time: selectedTime,
                phone: bookingPhone,
                address: needsAddress ? bookingAddress : undefined,
            });
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text: err.message || 'Booking submission failed. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (booking) => {
        setPendingPayment(null);
        setStatusMessage({
            type: 'success',
            text: `Booking Confirmed! An expert will connect with you on ${booking.date} at ${booking.time}.`,
        });
        setSelectedDate('');
        setSelectedTime('');
        setAddress('');
    };

    return (
        <section id="booking" className="py-20 relative">
            <div className="max-w-xl mx-auto px-4 sm:px-6">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-8 relative">

                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Online Appointment</span>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Book an IT Expert</h2>
                        </div>
                        {!isLoggedIn && (
                            <button
                                type="button"
                                onClick={onRequireLogin}
                                className="text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 transition-colors"
                            >
                                <Lock className="w-3 h-3" /> Login Required
                            </button>
                        )}
                    </div>

                    {statusMessage && (
                        <div
                            className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm ${statusMessage.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                        >
                            {statusMessage.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-snug">{statusMessage.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleBookingSubmit} className="space-y-6">

                        {/* Service Type Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                1. Select Service Type
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setBookingType('virtual'); setSelectedTime(''); setPhone(user?.phone || phone); }}
                                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${bookingType === 'virtual'
                                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 text-sky-900 animate-pop'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                                        }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between w-full mb-2">
                                            <Video className={`w-5 h-5 ${bookingType === 'virtual' ? 'text-sky-600' : 'text-slate-400'}`} />
                                            {bookingType === 'virtual' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                                        </div>
                                        <div className="font-semibold text-sm">Virtual Call Support</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Online HD Video Meeting</div>
                                    </div>
                                    <div className="mt-3 leading-tight">
                                        <div className="text-base font-extrabold text-slate-900">৳ 1,000</div>
                                        <div className="text-[10px] font-normal text-slate-500">Fixed</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setBookingType('onsite'); setSelectedTime(''); setPhone(user?.phone || phone); setAddress(user?.address || ''); }}
                                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${bookingType === 'onsite'
                                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 text-sky-900 animate-pop'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                                        }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between w-full mb-2">
                                            <MapPin className={`w-5 h-5 ${bookingType === 'onsite' ? 'text-sky-600' : 'text-slate-400'}`} />
                                            {bookingType === 'onsite' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                                        </div>
                                        <div className="font-semibold text-sm">On-Site Office Visit</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Technician visits office</div>
                                    </div>
                                    <div className="mt-3 leading-tight">
                                        <div className="text-base font-extrabold text-slate-900">৳ 1,500</div>
                                        <div className="text-[10px] font-normal text-slate-500">Fixed</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setBookingType('commercial'); setSelectedTime(''); setPhone(user?.phone || phone); setAddress(user?.address || ''); }}
                                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${bookingType === 'commercial'
                                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 text-sky-900 animate-pop'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                                        }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between w-full mb-2">
                                            <Briefcase className={`w-5 h-5 ${bookingType === 'commercial' ? 'text-sky-600' : 'text-slate-400'}`} />
                                            {bookingType === 'commercial' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                                        </div>
                                        <div className="font-semibold text-sm">Commercial Support</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Business / enterprise IT support</div>
                                    </div>
                                    <div className="mt-3 leading-tight">
                                        <div className="text-base font-extrabold text-slate-900">৳ 20,000</div>
                                        <div className="text-[10px] font-normal text-slate-500">Starts from</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Specialty Dropdown */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                2. Select Required IT Specialty / Expert
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedExpert}
                                    onChange={(e) => setSelectedExpert(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer appearance-none"
                                >
                                    {experts?.map((exp) => (
                                        <option key={exp.id || exp.role} value={exp.role}>
                                            {exp.role}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400 text-xs">
                                    ▼
                                </div>
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Contact Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="tel"
                                    required
                                    placeholder="e.g., 01700000000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                    pattern="01[3-9][0-9]{8}"
                                    maxLength={11}
                                    title="Phone number must be 11 digits starting with 013-019"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">11 digits, starting with 013-019</p>
                        </div>

                        {/* Address Field */}
                        {needsAddress && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    {bookingType === 'commercial' ? 'Full Business Address' : 'Full Office Address'}
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Level 4, Road 12, Dhanmondi, Dhaka"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Date & Time */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    3. Select Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        required
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Select Available Time
                                    <span className="ml-2 normal-case font-normal text-slate-400">
                                        ({bookingType === 'virtual' ? 'Hourly · 9AM–4PM' : '4 slots/day · 9AM–4PM'})
                                    </span>
                                </label>
                                <div className={`grid gap-2 ${bookingType === 'virtual' ? 'grid-cols-4 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
                                    {timeSlots.map((slot) => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setSelectedTime(slot)}
                                            className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all ${selectedTime === slot
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !phone.trim() || !selectedDate || !selectedTime || (needsAddress && !address.trim())}
                            className="w-full py-4 px-6 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 group mt-6"
                        >
                            <span>
                                {loading
                                    ? 'Please wait...'
                                    : isLoggedIn
                                        ? `Proceed to Payment (${bookingType === 'virtual' ? '৳1,000' : bookingType === 'onsite' ? '৳1,500' : 'Starts from ৳20,000'})`
                                        : 'Login & Proceed to Payment'}
                            </span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>

            <MockPaymentGateway
                isOpen={Boolean(pendingPayment)}
                amount={pendingPayment ? SERVICE_PRICES[pendingPayment.serviceType] : 0}
                bookingPayload={pendingPayment}
                onClose={() => {
                    setPendingPayment(null);
                    setStatusMessage({ type: 'error', text: 'Payment was cancelled. Your booking was not confirmed.' });
                }}
                onSuccess={handlePaymentSuccess}
            />
        </section>
    );
}
