import { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User as UserIcon, Phone, MapPin } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UserProfileModal({
    isOpen,
    onClose,
    isLoggedIn,
    user,
    onAuthSuccess,
    onLogout,
}) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Form submit (Normal Login/Signup)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Authentication failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (onAuthSuccess) {
                onAuthSuccess(data.user);
            }
            onClose();
        } catch (error) {
            setErrorMsg(error.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Google Login Success Handler
    const handleGoogleSuccess = async (credentialResponse) => {
        setErrorMsg('');
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

            if (onAuthSuccess) {
                onAuthSuccess(data.user);
            }
            onClose();
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
                    <div className="text-center py-4">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-sky-400 shadow-sm"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-3 shadow-inner">
                                {user.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-slate-900">{user.name || 'User'}</h3>
                        <p className="text-sm text-slate-500 mb-2">{user.email}</p>
                        {user.phone && <p className="text-xs text-slate-400 mb-1">Phone: {user.phone}</p>}
                        {user.address && <p className="text-xs text-slate-400 mb-4">Address: {user.address}</p>}

                        <button
                            onClick={() => {
                                if (onLogout) onLogout();
                                onClose();
                            }}
                            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-sm transition-colors mt-4"
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

                        {errorMsg && (
                            <div className="mb-4 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-center">
                                {errorMsg}
                            </div>
                        )}

                        {/* Google Sign In Button */}
                        <div className="flex justify-center mb-4">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setErrorMsg('Google Sign-In failed or popup closed.')}
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
                                                placeholder="+880 1700-000000"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
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