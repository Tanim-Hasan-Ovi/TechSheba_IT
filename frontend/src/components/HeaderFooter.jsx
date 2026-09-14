import { Headset, Phone, Mail, Globe, User } from 'lucide-react';

const handleNavClick = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

export function Header({ children, onAccountClick, isLoggedIn, user }) {
    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img
                        src="/logo-icon.png"
                        alt="TechSheba IT"
                        className="w-9 h-9 rounded-xl object-cover shadow-md shadow-sky-600/20"
                    />
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        TechSheba <span className="text-sky-600">IT</span>
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="hover:text-sky-600 transition-colors">About Us</a>
                    <a href="#experts" onClick={(e) => handleNavClick(e, 'experts')} className="hover:text-sky-600 transition-colors">IT Experts</a>
                    <a href="#booking" onClick={(e) => handleNavClick(e, 'booking')} className="hover:text-sky-600 transition-colors">Book Now</a>
                </nav>

                <div className="flex items-center gap-3">
                    {children}

                    <button
                        onClick={onAccountClick}
                        title={isLoggedIn ? `${user?.name || 'User'} (View Profile)` : "Login / Sign Up"}
                        className={`transition-all rounded-full flex items-center justify-center ${isLoggedIn
                            ? 'hover:ring-2 hover:ring-sky-400 p-0.5'
                            : 'p-2 rounded-xl border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        {isLoggedIn && user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name || 'User'}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500 shadow-sm transition-transform hover:scale-105"
                            />
                        ) : isLoggedIn && user?.name ? (
                            <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-sky-300">
                                {user.name[0].toUpperCase()}
                            </div>
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-sky-600 text-white p-2 rounded-xl">
                                <Headset className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">
                                TechSheba <span className="text-sky-500">IT</span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                            We deliver reliable on-site office support and instant video call IT consultations. We stand by your business for all technical demands.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
                        <ul className="space-y-2 text-xs">
                            <li><a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="hover:text-sky-400 transition-colors">About Us</a></li>
                            <li><a href="#experts" onClick={(e) => handleNavClick(e, 'experts')} className="hover:text-sky-400 transition-colors">Our Expert Team</a></li>
                            <li><a href="#booking" onClick={(e) => handleNavClick(e, 'booking')} className="hover:text-sky-400 transition-colors">Book Appointment</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Contact Us</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-sky-500" /> +880 1601-776137</li>
                            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-sky-500" /> support@techshebait.com</li>
                            <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-sky-500" /> Dhaka, Bangladesh</li>
                        </ul>
                    </div>
                </div>

                <div className="text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} TechSheba IT Solutions. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

// Layout Wrapper Component
export default function HeaderFooter({ children, onAccountClick, isLoggedIn }) {
    return (
        <div className="min-h-screen flex flex-col justify-between">
            <Header onAccountClick={onAccountClick} isLoggedIn={isLoggedIn} />
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </div>
    );
}