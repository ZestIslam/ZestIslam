
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
        const res = await interpretDream(dream);
        setResult(res);
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dream Interpretation</h2>
                <p className="text-slate-500 dark:text-slate-400">Insights based on Islamic traditions.</p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex gap-3 text-sm text-indigo-800 dark:text-indigo-200">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                    <strong>Disclaimer:</strong> This is an AI simulation referencing Islamic literature. 
                    True dream interpretation requires a qualified scholar. 
                    Good dreams are from Allah, bad dreams are from Shaytan (seek refuge in Allah).
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-50 dark:border-emerald-900/30">
                <textarea
                    value={dream}
                    onChange={(e) => setDream(e.target.value)}
                    placeholder="Describe your dream in detail..."
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-slate-200 resize-none h-40 mb-4 placeholder:text-slate-400"
                />
                <button
                    onClick={handleInterpret}
                    disabled={loading || !dream}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Moon className="w-5 h-5" />}
                    Interpret Dream
                </button>
            </div>

            {result && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-indigo-100 dark:border-indigo-900 animate-fade-in-up">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 border-b border-indigo-100 dark:border-indigo-800">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" /> Interpretation
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        
                        {/* Language Toggle */}
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                            {(['english', 'urdu', 'hinglish'] as Language[]).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                                        lang === l 
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm transform scale-[1.02]' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className={`prose prose-sm prose-indigo dark:prose-invert text-slate-700 dark:text-slate-300 ${lang === 'urdu' ? 'text-right' : ''}`} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                            <p className={`leading-relaxed ${lang === 'urdu' ? 'font-arabic text-lg' : ''}`}>
                                {result[lang]?.interpretation || 'Interpretation details are being retrieved...'}
                            </p>
                        </div>

                        {result[lang]?.symbols && result[lang].symbols.length > 0 && (
                            <div className={lang === 'urdu' ? 'text-right' : ''} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    {lang === 'urdu' ? 'علامات' : 'Key Symbols'}
                                </h4>
                                <div className={`flex flex-wrap gap-2 ${lang === 'urdu' ? 'justify-end' : ''}`}>
                                    {result[lang].symbols.map((s, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={`bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 ${lang === 'urdu' ? 'text-right' : ''}`} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                            <h4 className={`text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2 ${lang === 'urdu' ? 'flex-row-reverse' : ''}`}>
                                <BookOpen className="w-4 h-4" /> 
                                {lang === 'urdu' ? 'روحانی نصیحت' : 'Spiritual Advice'}
                            </h4>
                            <p className={`text-sm text-emerald-700 dark:text-emerald-400 italic ${lang === 'urdu' ? 'font-arabic text-lg not-italic' : ''}`}>
                                "{result[lang]?.advice || 'Keep your faith strong and seek clarity through prayer.'}"
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DreamInterpreter;
