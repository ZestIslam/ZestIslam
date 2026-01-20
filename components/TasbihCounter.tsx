
import React, { useState, useRef } from 'react';
import { RotateCcw, Target, Sparkles, Loader2, Calculator, Heart, Fingerprint } from 'lucide-react';
import { getDhikrSuggestion } from '../services/geminiService';
import { DhikrSuggestion } from '../types';

const PRESETS = [
    { label: "SubhanAllah", target: 33, meaning: "Glory be to Allah" },
    { label: "Alhamdulillah", target: 33, meaning: "Praise be to Allah" },
    { label: "Allahu Akbar", target: 34, meaning: "Allah is Greatest" },
    { label: "Astaghfirullah", target: 100, meaning: "I seek forgiveness" },
    { label: "Salawat", target: 10, meaning: "Blessings on Prophet" },
];

const TasbihCounter: React.FC = () => {
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33);
    const [feeling, setFeeling] = useState('');
    const [suggestion, setSuggestion] = useState<DhikrSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'FOCUS' | 'COACH'>('FOCUS');
    const [ripple, setRipple] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playBeep = () => {
        try {
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(1000, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {}
    };

    const handleIncrement = () => {
        setCount(prev => prev + 1);
        if (navigator.vibrate) navigator.vibrate(15);
        playBeep();
        setRipple(true);
        setTimeout(() => setRipple(false), 150);
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

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(count / target, 1);
    const dashoffset = circumference - progress * circumference;
    const isComplete = count >= target;

    return (
        <div className="max-w-6xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-4 md:gap-8 pb-8 px-2 md:px-0">
            
            <div className="lg:w-1/3 flex flex-col gap-3 order-2 lg:order-1">
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex shrink-0">
                    <button 
                        onClick={() => setActiveTab('FOCUS')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'FOCUS' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}
                    >
                        <Calculator className="w-4 h-4" /> Counter
                    </button>
                    <button 
                        onClick={() => setActiveTab('COACH')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'COACH' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}
                    >
                        <Heart className="w-4 h-4" /> AI Coach
                    </button>
                </div>

                {activeTab === 'FOCUS' ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                            {PRESETS.map(p => (
                                <button 
                                    key={p.label}
                                    onClick={() => { setTarget(p.target); setCount(0); setSuggestion(null); }}
                                    className="flex flex-col items-start p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 text-left border border-transparent hover:border-emerald-100"
                                >
                                    <span className="font-bold text-[10px] md:text-xs block truncate uppercase tracking-wider">{p.label}</span>
                                    <span className="text-[9px] text-slate-400 font-medium truncate block">{p.target} counts</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                            <Target className="w-4 h-4 text-emerald-500" />
                            <input 
                                type="number" 
                                value={target}
                                onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 font-bold text-sm w-full"
                            />
                            <span className="text-[9px] font-bold text-slate-400 pr-2 uppercase">Goal</span>
                        </div>
                        <button onClick={() => setCount(0)} className="w-full py-2 text-red-500 text-[10px] font-bold flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                            <RotateCcw className="w-3 h-3" /> RESET
                        </button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 animate-fade-in">
                        <textarea 
                            value={feeling}
                            onChange={(e) => setFeeling(e.target.value)}
                            placeholder="How are you feeling? (e.g. stressed, grateful...)"
                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-emerald-500 outline-none h-32 resize-none text-xs text-slate-700 dark:text-slate-200"
                        />
                        <button 
                            onClick={getAdvice}
                            disabled={loading || !feeling}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                        >
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            Get Advice
                        </button>
                    </div>
                )}
            </div>

            <div className="lg:flex-1 order-1 lg:order-2">
                <div 
                    className={`h-[420px] md:h-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center justify-center p-6 transition-all active:scale-[0.98] cursor-pointer`}
                    onClick={handleIncrement}
                >
                    <div className="relative z-10 w-full flex flex-col items-center justify-around h-full">
                        <div className="text-center w-full min-h-[80px]">
                            {suggestion ? (
                                <div className="space-y-1 animate-fade-in">
                                    <p className="font-quran text-2xl md:text-4xl text-white">{suggestion.arabic}</p>
                                    <p className="text-emerald-300 text-[10px] md:text-sm font-medium">{suggestion.transliteration}</p>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">Smart Tasbih</p>
                            )}
                        </div>

                        <div className="relative w-48 h-48 md:w-80 md:h-80 flex items-center justify-center group">
                             <div className={`absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-300 ${ripple ? 'opacity-100' : 'opacity-40'}`}></div>
                            <svg className="absolute w-full h-full rotate-[-90deg]" viewBox="0 0 280 280">
                                <circle cx="140" cy="140" r="120" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
                                <circle
                                    cx="140" cy="140" r="120" fill="transparent"
                                    stroke={isComplete ? '#34d399' : '#10b981'}
                                    strokeWidth="20"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashoffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-300 ease-out"
                                />
                            </svg>
                            <div className="text-center z-10 pointer-events-none flex flex-col items-center">
                                <span className={`block font-mono font-bold text-6xl md:text-8xl transition-all ${ripple ? 'text-white scale-105' : 'text-slate-200'}`}>{count}</span>
                                <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">of {target}</span>
                            </div>
                        </div>

                        <div className={`transition-opacity duration-500 ${count > 0 ? 'opacity-0' : 'opacity-40'}`}>
                            <Fingerprint className="w-8 h-8 text-white animate-pulse" />
                        </div>

                        {isComplete && (
                            <div className="absolute bottom-4 bg-emerald-500 text-white px-4 py-1.5 rounded-full font-bold text-[10px] md:text-sm animate-bounce shadow-lg flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 fill-current" /> Masha'Allah!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TasbihCounter;
