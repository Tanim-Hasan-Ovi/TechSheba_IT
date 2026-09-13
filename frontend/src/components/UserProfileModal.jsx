import { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User as UserIcon, Phone, MapPin, CheckCircle, Calendar, Video, Clock, Pencil, Trash2, Plus, Briefcase } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export default function UserProfileModal({
    isOpen,
    onClose,
    isLoggedIn,
    user,
    onAuthSuccess,
    onLogout,
    onUserUpdate,
}) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [contactData, setContactData] = useState({ phone: '', address: '' });
    const [contactLoading, setContactLoading] = useState(false);

    const loadBookings = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setBookingsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/booking/my-bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) setBookings(data.bookings || []);
        } catch {
            // The profile remains usable if booking history is temporarily unavailable.
        } finally {
            setBookingsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !isLoggedIn) return undefined;
        const requestId = window.setTimeout(() => { void loadBookings(); }, 0);
        return () => window.clearTimeout(requestId);
    }, [isOpen, isLoggedIn]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const saveContact = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const trimmedPhone = contactData.phone.trim();
        if (trimmedPhone && !BD_PHONE_REGEX.test(trimmedPhone)) {
            setErrorMsg('Phone number must be 11 digits starting with 013-019');
            return;
        }
        setContactLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(contactData),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Could not save contact details');
            localStorage.setItem('user', JSON.stringify(data.user));
            onUserUpdate?.(data.user);
            setIsEditingContact(false);
        } catch (error) {
            setErrorMsg(error.message || 'Could not save contact details');
        } finally {
            setContactLoading(false);
        }
    };

    const removeContact = async () => {
        setContactData({ phone: '', address: '' });
        const token = localStorage.getItem('token');
        if (!token) return;
        setContactLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ phone: '', address: '' }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Could not remove contact details');
            localStorage.setItem('user', JSON.stringify(data.user));
            onUserUpdate?.(data.user);
            setIsEditingContact(false);
        } catch (error) {
            setErrorMsg(error.message || 'Could not remove contact details');
        } finally {
            setContactLoading(false);
        }
    };

    // Form submit (Normal Login/Signup)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';

        if (isSignUp) {
            if (formData.password !== formData.confirmPassword) {
                setErrorMsg('Passwords do not match. Please re-enter your password.');
                setLoading(false);
                return;
            }
            if (formData.password.length < 6) {
                setErrorMsg('Password must be at least 6 characters long.');
                setLoading(false);
                return;
            }
            if (!BD_PHONE_REGEX.test(formData.phone.trim())) {
                setErrorMsg('Phone number must be 11 digits starting with 013-019');
                setLoading(false);
                return;
            }
        }

        const payload = isSignUp
            ? {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address,
            }
            : {
                email: formData.email,
                password: formData.password,
            };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Authentication failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            const successText = isSignUp
                ? '🎉 Sign up successful! Welcome to TechSheba IT.'
                : `Welcome back, ${data.user.name || 'User'}!`;
            setSuccessMsg(successText);

            if (onAuthSuccess) {
                onAuthSuccess(data.user, successText);
            }

            setTimeout(() => {
                setSuccessMsg('');
                onClose();
            }, 1500);
        } catch (error) {
            setErrorMsg(error.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Google Login Success Handler
    const handleGoogleSuccess = async (credentialResponse) => {
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Google authentication failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            const successText = `Signed in successfully as ${data.user.name || data.user.email}!`;
            setSuccessMsg(successText);

            if (onAuthSuccess) {
                onAuthSuccess(data.user, successText);
            }

            setTimeout(() => {
                setSuccessMsg('');
                onClose();
            }, 1200);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            setErrorMsg(error.message || 'Failed to process Google sign-in.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl relative border border-slate-100 my-8">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {isLoggedIn && user ? (
                    /* User Profile View */
                    <div className="py-2">
                        {/* Avatar + Name */}
                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    referrerPolicy="no-referrer"
                                    className="w-16 h-16 rounded-full object-cover ring-2 ring-sky-400 shadow-sm flex-shrink-0"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner flex-shrink-0">
                                    {user.name ? user.name[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <div className="text-left min-w-0">
                                <h3 className="text-base font-bold text-slate-900 truncate">{user.name || 'User'}</h3>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                <span className="inline-block mt-1 text-[10px] font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full capitalize">
                                    {user.role || 'user'}
                                </span>
                            </div>
                        </div>

                        {/* Contact details. Address stays hidden until the user adds one. */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Information</h4>
                                {isEditingContact ? (
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={removeContact} disabled={contactLoading} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-50" title="Remove contact details"><Trash2 className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={saveContact} disabled={contactLoading} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg disabled:opacity-50" title="Save contact details"><CheckCircle className="w-3.5 h-3.5" /></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => { setErrorMsg(''); setContactData({ phone: user.phone || '', address: user.address || '' }); setIsEditingContact(true); }} className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                                        {user.phone || user.address ? <><Pencil className="w-3 h-3" /> Edit</> : <><Plus className="w-3 h-3" /> Add</>}
                                    </button>
                                )}
                            </div>
                            {isEditingContact ? (
                                <div className="space-y-2 bg-slate-50 rounded-xl p-3">
                                    {errorMsg && (
                                        <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                                            {errorMsg}
                                        </div>
                                    )}
                                    <label className="block text-[10px] font-medium text-slate-400">Phone</label>
                                    <input type="tel" value={contactData.phone} onChange={(e) => setContactData({ ...contactData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="01700000000" pattern="01[3-9][0-9]{8}" maxLength={11} title="Phone number must be 11 digits starting with 013-019" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500" />
                                    <p className="text-[10px] text-slate-400">11 digits, starting with 013-019</p>
                                    <label className="block text-[10px] font-medium text-slate-400">Office Address</label>
                                    <input type="text" value={contactData.address} onChange={(e) => setContactData({ ...contactData, address: e.target.value })} placeholder="Add office address" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500" />
                                    <button type="button" onClick={() => { setErrorMsg(''); setContactData({ phone: user.phone || '', address: user.address || '' }); setIsEditingContact(false); }} className="text-[11px] text-slate-500 hover:text-slate-700">Cancel</button>
                                </div>
                            ) : (user.phone || user.address) ? (
                                <div className="space-y-2">
                                    {user.phone && <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5"><Phone className="w-4 h-4 text-sky-500 flex-shrink-0" /><div><p className="text-[10px] text-slate-400 font-medium">Phone</p><p className="text-sm font-semibold text-slate-700">{user.phone}</p></div></div>}
                                    {user.address && <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5"><MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" /><div><p className="text-[10px] text-slate-400 font-medium">Office Address</p><p className="text-sm font-semibold text-slate-700">{user.address}</p></div></div>}
                                </div>
                            ) : <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3.5 py-3">No contact information added.</p>}
                        </div>

                        {/* Booking History */}
                        <div className="mb-5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                My Bookings
                                {bookings.length > 0 && (
                                    <span className="ml-2 bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-bold">
                                        {bookings.length}
                                    </span>
                                )}
                            </h4>

                            {bookingsLoading ? (
                                <div className="text-center py-4 text-xs text-slate-400">Loading bookings...</div>
                            ) : bookings.length === 0 ? (
                                <div className="text-center py-5 bg-slate-50 rounded-2xl">
                                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">No bookings yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {bookings.map((b) => (
                                        <div key={b._id} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    {b.serviceType === 'virtual' ? (
                                                        <Video className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                                    ) : b.serviceType === 'commercial' ? (
                                                        <Briefcase className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                                                    ) : (
                                                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                                    )}
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{b.expertRole}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                    b.status === 'pending' ? 'bg-amber-100 text-amber-700'
                                                    : b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(b.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {b.time}
                                                </span>
                                                <span className="ml-auto font-bold text-sky-600">৳{b.amount?.toLocaleString()}</span>
                                            </div>
                                            {b.address && (
                                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                                                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{b.address}
                                                </p>
                                            )}
                                            {b.phone && (
                                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                                                    <Phone className="w-2.5 h-2.5 flex-shrink-0" />{b.phone}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                if (onLogout) onLogout();
                                onClose();
                            }}
                            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-sm transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    /* Auth Form View (Login / Signup) */
                    <div>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">
                                {isSignUp ? 'Create an Account' : 'Welcome Back'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {isSignUp ? 'Sign up to manage your bookings' : 'Log in to access your profile and bookings'}
                            </p>
                        </div>

                        {successMsg && (
                            <div className="mb-4 text-xs sm:text-sm text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-2 font-medium shadow-sm">
                                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="mb-4 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-center">
                                {errorMsg}
                            </div>
                        )}

                        {/* Google Sign In / Sign Up Button */}
                        <div className="flex justify-center mb-4">
                            <GoogleLogin
                                key={isSignUp ? 'signup' : 'signin'}
                                onSuccess={handleGoogleSuccess}
                                onError={() => setErrorMsg('Google Sign-In failed or popup closed.')}
                                text={isSignUp ? 'signup_with' : 'signin_with'}
                                shape="circle"
                                width="100%"
                            />
                        </div>

                        <div className="relative flex py-2 items-center mb-4">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink mx-3 text-xs text-slate-400">or with email</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {isSignUp && (
                                <>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
                                        <div className="relative">
                                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input
                                                type="text"
                                                name="phone"
                                                required
                                                placeholder="01700000000"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                                                pattern="01[3-9][0-9]{8}"
                                                maxLength={11}
                                                title="Phone number must be 11 digits starting with 013-019"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                        <p className="mt-1 text-[10px] text-slate-400">11 digits, starting with 013-019</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 block mb-1">Address</label>
                                        <div className="relative">
                                            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input
                                                type="text"
                                                name="address"
                                                placeholder="Dhaka, Bangladesh"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            {isSignUp && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">Re-enter Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            required
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span>Please wait...</span>
                                ) : (
                                    <>
                                        {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                                        <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Toggle Login/Signup */}
                        <div className="text-center mt-4 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setErrorMsg('');
                                    setSuccessMsg('');
                                    setFormData((prev) => ({ ...prev, confirmPassword: '' }));
                                }}
                                className="text-xs text-sky-600 hover:underline font-medium"
                            >
                                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
