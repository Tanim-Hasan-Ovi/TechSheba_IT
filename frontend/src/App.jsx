import { useState } from 'react';
import { Header, Footer } from './components/HeaderFooter';
import HeroAbout from './components/HeroAbout';
import ExpertsSlider from './components/ExpertsSlider';
import BookingSection from './components/BookingSection';
import UserProfileModal from './components/UserProfileModal';

export default function App() {
  // Full Experts Data with image & specialties
  const experts = [
    {
      id: 1,
      role: 'Senior Network & Security Engineer',
      experience: '6+ Years Exp.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      specialties: ['Cisco Routers', 'Firewall Setup', 'Server Maintenance'],
    },
    {
      id: 2,
      role: 'Cloud & Database Specialist',
      experience: '5+ Years Exp.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      specialties: ['AWS Cloud', 'Database Backup', 'System Security'],
    },
    {
      id: 3,
      role: 'Hardware & Infrastructure Expert',
      experience: '4+ Years Exp.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      specialties: ['Office Networking', 'PC Repair', 'CCTV Setup'],
    },
    {
      id: 4,
      role: 'Cyber Security Consultant',
      experience: '7+ Years Exp.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      specialties: ['Vulnerability Test', 'Data Protection', 'Ethical Hacking'],
    },
    {
      id: 5,
      role: 'DevOps & Linux Admin',
      experience: '5+ Years Exp.',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
      specialties: ['Linux Servers', 'Docker & K8s', 'CI/CD Pipeline'],
    },
    {
      id: 6,
      role: 'VoIP & Telecom Specialist',
      experience: '4+ Years Exp.',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
      specialties: ['IP PBX Systems', 'VoIP Setup', 'Network Telephony'],
    },
  ];

  // Application States
  const [selectedExpert, setSelectedExpert] = useState(experts[0].role);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.error('Failed to load session from localStorage', e);
    }
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem('token') && localStorage.getItem('user'));
    } catch {
      return false;
    }
  });

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

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
      {/* Header */}
      <Header
        isLoggedIn={isLoggedIn}
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
          experts={experts}
          selectedExpert={selectedExpert}
          setSelectedExpert={setSelectedExpert}
          isLoggedIn={isLoggedIn}
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
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}