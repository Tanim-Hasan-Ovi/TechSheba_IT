import { ShieldCheck, Users, Clock, Award } from 'lucide-react';

export default function HeroAbout() {
    return (
        <section id="about" className="relative pt-12 pb-20 overflow-hidden">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-400/10 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 mb-4">
                        <ShieldCheck className="w-4 h-4 text-sky-600" /> Reliable IT Support Partner
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        Simple Solutions for Your Business Tech Challenges
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">TechSheba IT Solutions</strong> brings fast and dependable IT services. Dispatch a technician directly to your office or consult with an expert instantly via video call.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">Expert Engineers</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Our team consists of certified and experienced network and hardware specialists.</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">Fast Response</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Immediate video consultation support or scheduled on-site office visits.</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <Award className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">Fixed & Transparent Rates</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">No hidden fees. Affordable, transparent pricing tailored to your requested service type.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}