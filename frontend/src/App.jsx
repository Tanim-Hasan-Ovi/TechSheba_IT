import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { Header, Footer } from './components/HeaderFooter';
import HeroAbout from './components/HeroAbout';
import ExpertsSlider from './components/ExpertsSlider';
import BookingSection from './components/BookingSection';
import UserProfileModal from './components/UserProfileModal';

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

function readStoredSession() {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) return null;

    const lastActive = Number(localStorage.getItem('lastActive'));
    if (lastActive && Date.now() - lastActive > SESSION_TIMEOUT_MS) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActive');
      return null;
    }

    return JSON.parse(storedUser);
  } catch (e) {
    console.error('Failed to load session from localStorage', e);
    return null;
  }
}

export default function App() {
  // Full Experts Data with image & specialties
  const experts = [
    {
      id: 1,
      name: 'Mahmudul Hasan',
      role: 'Hardware & Infrastructure Expert',
      experience: '4+ Years Exp.',
      image: 'https://res.cloudinary.com/dizzoonz/image/upload/v1789249077/hasan.jpg',
      specialties: ['Office Networking', 'PC Repair', 'CCTV Setup'],
      serviceType: 'Online + Offline',
    },
    {
      id: 2,
      name: 'Tanvir Ahmed',
      role: 'Cloud & Database Specialist',
      experience: '5+ Years Exp.',
      image: 'https://res.cloudinary.com/dizzoonz/image/upload/v1789248100/Tanvir.jpg',
      specialties: ['AWS Cloud', 'Database Backup', 'System Security'],
      serviceType: 'Online + Offline',
    },
    {
      id: 3,
      name: 'IFFTEKHER HOSSAIN MRIDA',
      role: 'Senior Network & Security Engineer',
      experience: '6+ Years Exp.',
      image: 'https://res.cloudinary.com/dizzoonz/image/upload/v1789247692/Mrida.jpg',
      specialties: ['Cisco Routers', 'Firewall Setup', 'Server Maintenance'],
      serviceType: 'Online Only',
    },
    {
      id: 4,
      name: 'Nayeem Chowdhury',
      role: 'Cyber Security Consultant',
      experience: '7+ Years Exp.',
      image: 'https://res.cloudinary.com/dizzoonz/image/upload/v1789250667/Nayem.jpg',
      specialties: ['Vulnerability Test', 'Data Protection', 'Ethical Hacking'],
      serviceType: 'Online + Offline',
    },
    {
      id: 5,
      name: 'Shafiqul Islam',
      role: 'DevOps & Linux Admin',
      experience: '5+ Years Exp.',
      image: 'https://res.cloudinary.com/dizzoonz/image/upload/v1789249252/Islam.jpg',
      specialties: ['Linux Servers', 'Docker & K8s', 'CI/CD Pipeline'],
      serviceType: 'Online + Offline',
    },
    {
      id: 6,
      name: 'Rafiqul Karim',
      role: 'VoIP & Telecom Specialist',
      experience: '4+ Years Exp.',
      image: 'https://res.cloudinary.com/dizzoonz/image/upload/v1789250823/karim.jpg',
      specialties: ['IP PBX Systems', 'VoIP Setup', 'Network Telephony'],
      serviceType: 'Online + Offline',
    },
  ];

  // Application States
  const [selectedExpert, setSelectedExpert] = useState(experts[0].role);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState(() => readStoredSession());
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(user));

  const [toast, setToast] = useState(null);

  // After SSLCommerz redirects back from the payment gateway, surface the
  // outcome once, then strip the query params so a refresh doesn't repeat it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;

    const outcomes = {
      success: { type: 'success', message: 'Payment successful! Your booking is confirmed.' },
      fail: { type: 'error', message: 'Payment failed. Please try booking again.' },
      cancel: { type: 'error', message: 'Payment was cancelled. Your booking was not confirmed.' },
    };
    const outcome = outcomes[payment];
    if (outcome) {
      setToast(outcome);
      setTimeout(() => setToast(null), 5000);
    }

    params.delete('payment');
    params.delete('tran_id');
    const query = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));
  }, []);

  const handleAuthSuccess = (userData, message) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('lastActive', Date.now().toString());
    if (message) {
      setToast({ message, type: 'success' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActive');
    setUser(null);
    setIsLoggedIn(false);
    setToast({ message: 'You have been logged out successfully.', type: 'info' });
    setTimeout(() => setToast(null), 3000);
  };

  // Sliding 24h inactivity timeout: any user activity resets the clock;
  // if 24h pass with no activity (including not visiting the site), log out.
  useEffect(() => {
    if (!isLoggedIn) return;

    const updateLastActive = () => {
      localStorage.setItem('lastActive', Date.now().toString());
    };
    updateLastActive();

    let throttled = false;
    const handleActivity = () => {
      if (throttled) return;
      throttled = true;
      setTimeout(() => { throttled = false; }, 60000);
      updateLastActive();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));

    const inactivityCheck = setInterval(() => {
      const lastActive = Number(localStorage.getItem('lastActive'));
      if (lastActive && Date.now() - lastActive > SESSION_TIMEOUT_MS) {
        handleLogout();
      }
    }, 60000);

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      clearInterval(inactivityCheck);
    };
  }, [isLoggedIn]);

  // Smooth Scroll Helper Function
  const scrollToBooking = (role = '') => {
    if (role) setSelectedExpert(role);
    const bookingElement = document.getElementById('booking');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 bg-white border shadow-2xl rounded-2xl px-5 py-3.5 text-slate-800 transition-all ${toast.type === 'error' ? 'border-rose-200' : 'border-emerald-200'
          }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'error' ? 'bg-rose-100' : 'bg-emerald-100'
            }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Notification</p>
            <p className="text-sm font-semibold text-slate-800">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onAccountClick={() => setIsProfileModalOpen(true)}
      >
        <a
          href="#booking"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          Book Service
        </a>
      </Header>

      <main className="flex-grow">
        {/* Hero & About */}
        <HeroAbout />

        {/* Experts Slider */}
        <ExpertsSlider
          experts={experts}
          onSelectExpert={(role) => scrollToBooking(role)}
        />

        {/* Booking Section */}
        <BookingSection
          key={user?.id || 'guest'}
          experts={experts}
          selectedExpert={selectedExpert}
          setSelectedExpert={setSelectedExpert}
          isLoggedIn={isLoggedIn}
          user={user}
          onUserUpdate={handleUserUpdate}
          onRequireLogin={() => setIsProfileModalOpen(true)}
        />
      </main>

      {/* User Profile / Auth Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isLoggedIn={isLoggedIn}
        user={user}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
