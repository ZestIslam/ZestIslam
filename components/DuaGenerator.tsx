import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, Feather } from 'lucide-react';
import { generatePersonalizedDua } from '../services/geminiService';
import { GeneratedDua } from '../types';

const DuaGenerator: React.FC = () => {
  const [situation, setSituation] = useState('');
  const [dua, setDua] = useState<GeneratedDua | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setDua(null);
    const result = await generatePersonalizedDua(situation);
    setDua(result);
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (dua) {
        const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.translation}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Personalized Dua Generator</h2>
        <p className="text-slate-500 dark:text-slate-400">Describe your heart's state, and receive a beautiful supplication.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-emerald-50 dark:border-emerald-900/30">
        <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <Feather className="w-4 h-4" />
            Your Situation
        </div>
        <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="E.g., I am about to take a difficult exam, My friend is sick, I want to thank Allah for a new job..."
            className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-700 dark:text-slate-200 resize-none h-40 mb-6 placeholder:text-slate-400 transition-all text-lg"
        />
        <button
            onClick={handleGenerate}
            disabled={loading || !situation}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none transform active:scale-[0.99]"
        >
            {loading ? (
                <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Connecting to knowledge...
                </>
            ) : (
                <>
                    <Sparkles className="w-6 h-6" />
                    Generate Dua
                </>
            )}
        </button>
      </div>

      {dua && (
        <div className="relative bg-[#0F172A] rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up border border-slate-800 text-center">
             {/* Decorative Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500"></div>

            <div className="relative z-10 p-10 space-y-8">
                <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold text-emerald-400">{dua.title}</h3>
                    <button onClick={copyToClipboard} className="text-slate-400 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all">
                        {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>
                
                <div className="py-4">
                    <p className="font-quran text-4xl md:text-5xl text-white drop-shadow-lg" dir="rtl">
                        {dua.arabic}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">Transliteration</p>
                        <p className="text-slate-300 italic text-lg leading-relaxed">
                            {dua.transliteration}
                        </p>
                    </div>
                    <div>
                         <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">Meaning</p>
                        <p className="text-slate-200 text-xl font-medium">
                            {dua.translation}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DuaGenerator;