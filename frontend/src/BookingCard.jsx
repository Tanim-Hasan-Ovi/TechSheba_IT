import { useState } from 'react';
import { Video, MapPin, Calendar, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

const BookingCard = () => {
    const [bookingType, setBookingType] = useState('virtual'); // 'virtual' অথবা 'onsite'
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [address, setAddress] = useState('');

    const timeSlots = ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            type: bookingType,
            date: selectedDate,
            time: selectedTime,
            ...(bookingType === 'onsite' && { address }),
        };
        console.log('Booking details:', payload);
        alert(`Appointment booked for ${bookingType.toUpperCase()} support on ${selectedDate} at ${selectedTime}!`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Light Theme Background Glow Effect */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-400/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 transition-all">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 mb-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Certified IT Specialist
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Book an IT Expert</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-extrabold text-slate-900">$85</span>
                        <span className="text-xs text-slate-500 font-medium block">/ hour</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Step 1: Support Type Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                            1. Choose Support Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setBookingType('virtual')}
                                className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${bookingType === 'virtual'
                                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 text-sky-900'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <Video className={`w-5 h-5 ${bookingType === 'virtual' ? 'text-sky-600' : 'text-slate-400'}`} />
                                    {bookingType === 'virtual' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">Virtual Call</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Instant HD video call</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setBookingType('onsite')}
                                className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${bookingType === 'onsite'
                                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 text-sky-900'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <MapPin className={`w-5 h-5 ${bookingType === 'onsite' ? 'text-sky-600' : 'text-slate-400'}`} />
                                    {bookingType === 'onsite' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">On-Site Visit</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Engineer sent to office</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Conditional Input: Office Location */}
                    {bookingType === 'onsite' && (
                        <div className="animate-fadeIn">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Office Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter full office address..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Date & Time Selection */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                2. Select Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Available Time Slots
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {timeSlots.map((slot) => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setSelectedTime(slot)}
                                        className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all ${selectedTime === slot
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                        disabled={!selectedDate || !selectedTime || (bookingType === 'onsite' && !address)}
                        className="w-full py-4 px-6 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 group mt-8"
                    >
                        <span>Confirm Booking</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BookingCard;