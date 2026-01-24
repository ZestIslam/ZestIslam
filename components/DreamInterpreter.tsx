import React, { useState } from 'react';
import { Moon, Sparkles, Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import { interpretDream } from '../services/geminiService';
import { DreamResult } from '../types';

type Language = 'english' | 'urdu' | 'hinglish';

const DreamInterpreter: React.FC = () => {
    const [dream, setDream] = useState('');
    const [result, setResult] = useState<DreamResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<Language>('english');

    const handleInterpret = async () => {
        if (!dream.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await interpretDream(dream);
            setResult(res);
        } catch (e) {
            console.error("ZestIslam: Interpretation failed", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <div className="text-center space-y-2 mb-8 pt-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dream Interpretation</h2>
                <p className="text-slate-500 dark:text-slate-400">Insights based on authentic Islamic traditions.</p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-[2rem] border border-indigo-100 dark:border-indigo-800 flex gap-4 text-sm text-indigo-800 dark:text-indigo-200 items-start">
                <AlertTriangle className="w-6 h-6 shrink-0 text-indigo-500" />
                <p className="leading-relaxed">
                    <strong>Important Disclaimer:</strong> This is an AI simulation referencing classical Islamic dream literature. 
                    True dream interpretation requires a qualified scholar with divine insight. 
                    Good dreams are from Allah, bad dreams are from Shaytan.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-emerald-50 dark:border-emerald-900/30">
                <textarea
                    value={dream}
                    onChange={(e) => setDream(e.target.value)}
                    placeholder="Describe your dream in as much detail as possible..."
                    className="w-full p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-700 dark:text-slate-200 resize-none h-48 mb-6 placeholder:text-slate-400 transition-all text-lg"
                />
                <button
                    onClick={handleInterpret}
                    disabled={loading || !dream}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 transform active:scale-[0.99]"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Moon className="w-6 h-6" />}
                    {loading ? 'Consulting Sources...' : 'Interpret Dream'}
                </button>
            </div>

            {result && (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-indigo-100 dark:border-indigo-900 animate-fade-in-up">
                    <div className="p-8 space-y-8">
                        
                        {/* Language Selector */}
                        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex max-w-sm mx-auto shadow-inner">
                            {(['english', 'urdu', 'hinglish'] as Language[]).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                        lang === l 
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className={`prose prose-lg dark:prose-invert text-slate-700 dark:text-slate-300 ${lang === 'urdu' ? 'text-right' : ''}`} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                            <p className={`leading-relaxed ${lang === 'urdu' ? 'font-arabic text-2xl leading-loose' : 'font-serif italic'}`}>
                                {result[lang]?.interpretation || 'Interpretation details are being processed...'}
                            </p>
                        </div>

                        {result[lang]?.symbols && result[lang].symbols.length > 0 && (
                            <div className={lang === 'urdu' ? 'text-right' : ''} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                                    {lang === 'urdu' ? 'علامات' : 'Identified Symbols'}
                                </h4>
                                <div className={`flex flex-wrap gap-2 ${lang === 'urdu' ? 'justify-end' : ''}`}>
                                    {result[lang].symbols.map((s, i) => (
                                        <span key={i} className="px-5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-bold border border-slate-100 dark:border-slate-700">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={`bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 relative overflow-hidden ${lang === 'urdu' ? 'text-right' : ''}`} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                            <h4 className={`text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-widest ${lang === 'urdu' ? 'flex-row-reverse' : ''}`}>
                                <BookOpen className="w-4 h-4" /> 
                                {lang === 'urdu' ? 'روحانی نصیحت' : 'Spiritual Advice'}
                            </h4>
                            <p className={`text-lg text-emerald-900 dark:text-emerald-100 font-medium ${lang === 'urdu' ? 'font-arabic text-2xl' : ''}`}>
                                {result[lang]?.advice || 'Have patience and seek refuge in Allah (SWT).'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DreamInterpreter;
