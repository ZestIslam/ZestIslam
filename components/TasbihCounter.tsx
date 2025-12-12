
import React, { useState, useEffect } from 'react';
import { RotateCcw, Target, Sparkles, Loader2, ChevronRight, Calculator, Heart, Fingerprint } from 'lucide-react';
import { getDhikrSuggestion } from '../services/geminiService';
import { DhikrSuggestion } from '../types';

const PRESETS = [
    { label: "SubhanAllah", target: 33, meaning: "Glory be to Allah" },
    { label: "Alhamdulillah", target: 33, meaning: "Praise be to Allah" },
    { label: "Allahu Akbar", target: 34, meaning: "Allah is the Greatest" },
    { label: "Astaghfirullah", target: 100, meaning: "I seek forgiveness from Allah" },
    { label: "La ilaha illallah", target: 100, meaning: "There is no god but Allah" },
    { label: "Salawat", target: 10, meaning: "Blessings upon the Prophet" },
];

const TasbihCounter: React.FC = () => {
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33);
    const [feeling, setFeeling] = useState('');
    const [suggestion, setSuggestion] = useState<DhikrSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'FOCUS' | 'COACH'>('FOCUS');
    const [ripple, setRipple] = useState(false);
    
    // Persist count if needed, or simple session state
    // For now, keep it simple session state

    const handleIncrement = () => {
        setCount(prev => prev + 1);
        
        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(10); } catch (e) { /* ignore */ }
        }
        
        // Visual ripple trigger
        setRipple(true);
        setTimeout(() => setRipple(false), 200);
    };

    const handleReset = () => {
        setCount(0);
        // Optional vibration for reset
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([30, 50, 30]); } catch (e) { /* ignore */ }
        }
    };

    const getAdvice = async () => {
        if (!feeling.trim()) return;
        setLoading(true);
        const res = await getDhikrSuggestion(feeling);
        if (res) {
            setSuggestion(res);
            setTarget(res.target);
            setCount(0);
            setActiveTab('FOCUS'); 
        }
        setLoading(false);
    };

    // Circular Progress Calc for SVG (Internal Coordinates)
    const strokeWidth = 20;
    const center = 140;
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(count / target, 1);
    const dashoffset = circumference - progress * circumference;
    const isComplete = count >= target;
    const percentage = Math.round((count / target) * 100);

    return (
        <div className="max-w-6xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-8 pb-12">
            
            {/* Left Panel: Controls */}
            <div className="lg:w-1/3 flex flex-col gap-6 order-2 lg:order-1">
                {/* Navigation Tabs */}
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex">
                    <button 
                        onClick={() => setActiveTab('FOCUS')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'FOCUS' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Calculator className="w-4 h-4" /> Counter
                    </button>
                    <button 
                        onClick={() => setActiveTab('COACH')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'COACH' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Heart className="w-4 h-4" /> AI Coach
                    </button>
                </div>

                {activeTab === 'FOCUS' ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in flex flex-col gap-6">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Presets</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {PRESETS.map(p => (
                                    <button 
                                        key={p.label}
                                        onClick={() => { setTarget(p.target); setCount(0); setSuggestion(null); }}
                                        className="flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800"
                                    >
                                        <div>
                                            <span className="font-bold text-sm block">{p.label}</span>
                                            <span className="text-xs text-slate-400 font-medium">{p.meaning}</span>
                                        </div>
                                        <span className="text-xs font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded-lg shadow-sm text-slate-500 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{p.target}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Custom Goal</h3>
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                <Target className="w-5 h-5 text-emerald-500 ml-2" />
                                <input 
                                    type="number" 
                                    value={target}
                                    onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 font-bold text-lg"
                                />
                                <span className="text-xs font-bold text-slate-400 pr-4 uppercase">Count</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleReset} 
                                className="w-full py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset Counter
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in flex flex-col gap-6 h-full">
                         <div className="text-center">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4 shadow-sm">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">Spiritual Prescription</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Share your current state of heart, and let AI guide you to a relevant Dhikr from the Sunnah.
                            </p>
                        </div>

                        <textarea 
                            value={feeling}
                            onChange={(e) => setFeeling(e.target.value)}
                            placeholder="e.g., I feel anxious about the future, or I want to express gratitude..."
                            className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 outline-none h-40 resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all"
                        />

                        <button 
                            onClick={getAdvice}
                            disabled={loading || !feeling}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-auto"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Get Suggestion'}
                        </button>
                    </div>
                )}
            </div>

            {/* Right Panel: The Counter Ring */}
            <div className="lg:flex-1 order-1 lg:order-2">
                <div 
                    className={`h-full min-h-[400px] md:min-h-[500px] bg-gradient-to-br from-slate-900 to-slate-950 rounded-[3rem] relative overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center justify-center p-6 md:p-8 transition-transform duration-100 ${ripple ? 'scale-[0.995]' : ''}`}
                    onClick={handleIncrement}
                >
                    {/* Ambient Glows */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                    {/* Content Layer */}
                    <div className="relative z-10 w-full flex flex-col items-center justify-between h-full py-4 md:py-8">
                        
                        {/* Header Info */}
                        <div className="text-center w-full animate-fade-in-up">
                            {suggestion ? (
                                <div className="space-y-4">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                                        Recommended Dhikr
                                    </div>
                                    <p className="font-quran text-2xl md:text-5xl text-white leading-loose drop-shadow-lg">{suggestion.arabic}</p>
                                    <p className="text-emerald-100/80 text-sm md:text-base font-medium">{suggestion.transliteration}</p>
                                    <p className="text-slate-400 text-xs md:text-sm italic mt-2 max-w-md mx-auto">"{suggestion.meaning}"</p>
                                </div>
                            ) : (
                                <div className="opacity-50 space-y-2">
                                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em]">Smart Tasbih</p>
                                    <p className="text-slate-500 text-sm">Tap anywhere to count</p>
                                </div>
                            )}
                        </div>

                        {/* Interactive Ring */}
                        <div className="relative mt-8 mb-8 cursor-pointer select-none group">
                             {/* Pulse Effect */}
                             <div className={`absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl transition-all duration-300 ${ripple ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`}></div>

                            {/* SVG Ring - Responsive Size */}
                            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                                <svg className="absolute w-full h-full rotate-[-90deg] drop-shadow-2xl" viewBox="0 0 280 280">
                                    {/* Track */}
                                    <circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        fill="transparent"
                                        stroke="rgba(255,255,255,0.05)"
                                        strokeWidth={strokeWidth}
                                    />
                                    {/* Progress */}
                                    <circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        fill="transparent"
                                        stroke={isComplete ? '#34d399' : '#10b981'}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-500 ease-out"
                                        style={{ filter: `drop-shadow(0 0 ${isComplete ? '20px' : '10px'} ${isComplete ? '#34d399' : '#10b981'})` }}
                                    />
                                </svg>

                                {/* Center Count */}
                                <div className="text-center z-10 pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`block font-mono font-bold text-6xl sm:text-8xl md:text-9xl tracking-tighter transition-all duration-200 ${ripple ? 'text-white scale-105' : 'text-slate-100'}`}>
                                        {count}
                                    </span>
                                    <div className="flex items-center justify-center gap-2 mt-2 text-slate-400 font-medium uppercase tracking-widest text-xs sm:text-sm">
                                        <span>Target</span>
                                        <span className="text-emerald-400">{target}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fingerprint Icon / Hint */}
                        <div className={`transition-opacity duration-500 ${count > 0 ? 'opacity-0' : 'opacity-30'}`}>
                            <Fingerprint className="w-10 h-10 md:w-12 md:h-12 text-white animate-pulse" />
                        </div>

                        {/* Complete Banner */}
                        {isComplete && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 md:px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 animate-bounce flex items-center gap-2 z-20 whitespace-nowrap text-sm md:text-base">
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                Goal Reached!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TasbihCounter;
