import { useState } from 'react';
import { X, Lock, CreditCard, Smartphone, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const SERVICE_LABELS = {
    virtual: 'Virtual Call Support',
    onsite: 'On-Site Office Visit',
    commercial: 'Commercial Support',
};

export default function MockPaymentGateway({ isOpen, amount, bookingPayload, onClose, onSuccess }) {
    const [method, setMethod] = useState('card');
    const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [mobile, setMobile] = useState({ number: '', pin: '' });
    const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const validate = () => {
        if (method === 'card') {
            const digits = card.number.replace(/\s/g, '');
            if (digits.length < 12 || digits.length > 19) return 'Enter a valid card number';
            if (!card.name.trim()) return 'Enter the name on card';
            if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Enter expiry as MM/YY';
            if (!/^\d{3,4}$/.test(card.cvv)) return 'Enter a valid CVV';
        } else if (method === 'mobile') {
            if (!/^01[3-9]\d{8}$/.test(mobile.number)) return 'Enter a valid 11-digit mobile number';
            if (!/^\d{4,5}$/.test(mobile.pin)) return 'Enter your 4-5 digit PIN';
        }
        return '';
    };

    const handlePay = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError('');
        setStep('processing');

        setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/booking/mock-pay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(bookingPayload),
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Payment failed');

                setStep('success');
                setTimeout(() => onSuccess(data.booking), 1000);
            } catch (err) {
                setStep('form');
                setError(err.message || 'Payment failed. Please try again.');
            }
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">

                {/* Gateway header */}
                <div className="bg-gradient-to-r from-slate-900 to-sky-900 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-sky-300" />
                            <span className="text-sm font-bold tracking-tight">Secure Checkout</span>
                        </div>
                        {step === 'form' && (
                            <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {step === 'processing' && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 text-sky-600 animate-spin" />
                        <p className="text-sm font-semibold text-slate-600">Processing your payment...</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 animate-pop">
                        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                        <p className="text-sm font-semibold text-slate-700">Payment Successful</p>
                        <p className="text-xs text-slate-400">Confirming your booking...</p>
                    </div>
                )}

                {step === 'form' && (
                    <>
                        {/* Amount + summary */}
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount Payable</p>
                            <p className="text-2xl font-extrabold text-slate-900">৳ {amount?.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {SERVICE_LABELS[bookingPayload?.serviceType]} · {bookingPayload?.date} at {bookingPayload?.time}
                            </p>
                        </div>

                        {/* Method tabs */}
                        <div className="grid grid-cols-2 gap-2 px-6 pt-4">
                            {[
                                { id: 'card', label: 'Card', icon: CreditCard },
                                { id: 'mobile', label: 'Mobile Banking', icon: Smartphone },
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => { setMethod(id); setError(''); }}
                                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-semibold transition-all ${method === id
                                        ? 'border-sky-500 bg-sky-50 text-sky-700 ring-1 ring-sky-500/30'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handlePay} className="px-6 py-5 space-y-3">
                            {error && (
                                <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">{error}</div>
                            )}

                            {method === 'card' && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Card Number</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="4111 1111 1111 1111"
                                            value={card.number}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
                                                setCard({ ...card, number: digits.replace(/(\d{4})(?=\d)/g, '$1 ') });
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Name on Card</label>
                                        <input
                                            type="text"
                                            placeholder="Md. Rakibul Islam"
                                            value={card.name}
                                            onChange={(e) => setCard({ ...card, name: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-medium text-slate-400 mb-1">Expiry (MM/YY)</label>
                                            <input
                                                type="text"
                                                placeholder="12/28"
                                                maxLength={5}
                                                value={card.expiry}
                                                onChange={(e) => {
                                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    setCard({ ...card, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits });
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-medium text-slate-400 mb-1">CVV</label>
                                            <input
                                                type="password"
                                                placeholder="123"
                                                maxLength={4}
                                                value={card.cvv}
                                                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {method === 'mobile' && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Mobile Banking Number</label>
                                        <input
                                            type="tel"
                                            placeholder="01700000000"
                                            maxLength={11}
                                            value={mobile.number}
                                            onChange={(e) => setMobile({ ...mobile, number: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">PIN</label>
                                        <input
                                            type="password"
                                            placeholder="••••"
                                            maxLength={5}
                                            value={mobile.pin}
                                            onChange={(e) => setMobile({ ...mobile, pin: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 mt-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                            >
                                Pay ৳{amount?.toLocaleString()}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
                            >
                                Cancel and go back
                            </button>

                            <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> Payments are encrypted and secure
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
