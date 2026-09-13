import { ExternalLink, ChevronRight } from 'lucide-react';

export default function ExpertsSlider({ experts = [], onSelectExpert = () => { } }) {
    return (
        <section id="experts" className="py-16 bg-slate-100/60 border-y border-slate-200/60 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Meet Our Experienced Experts</h2>
                        <p className="text-sm text-slate-500 mt-1">Scroll or drag horizontally to view all 6 specialists</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-xs text-sky-600 font-semibold mt-2 sm:mt-0">
                        <span>Slide for more</span>
                        <ChevronRight className="w-4 h-4 animate-pulse" />
                    </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-transparent">
                    {experts?.map((exp) => (
                        <div
                            key={exp.id}
                            className="snap-start min-w-[280px] sm:min-w-[320px] max-w-[320px] bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between shrink-0"
                        >
                            <div>
                                <div className="relative mb-4">
                                    <img
                                        src={exp.image}
                                        alt={exp.name}
                                        className="w-full h-56 object-cover object-top rounded-2xl"
                                    />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 leading-snug">{exp.role}</h3>
                                <p className="text-xs font-semibold text-sky-600 mt-1 uppercase tracking-wide">{exp.name}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">{exp.experience}</p>
                                {exp.serviceType && (
                                    <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg mt-2">
                                        {exp.serviceType}
                                    </span>
                                )}

                                <div className="flex flex-wrap gap-1.5 mt-4">
                                    {exp.specialties?.map((item, idx) => (
                                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <a
                                href="#booking"
                                onClick={() => onSelectExpert(exp.role)}
                                className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-sky-50 text-sky-700 border border-slate-200 hover:border-sky-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                            >
                                <span>Select Expert</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}