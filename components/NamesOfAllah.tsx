import React, { useState, useMemo } from 'react';
import { Loader2, Sparkles, X, Search, Volume2, AlertCircle } from 'lucide-react';
import { getNameInsight, playGeneratedAudio } from '../services/geminiService';
import { NameInsight } from '../types';

const ALL_NAMES = [
    { ar: "الله", en: "Allah", tr: "The Greatest Name" },
    { ar: "الرَّحْمَن", en: "Ar-Rahman", tr: "The Most Gracious" },
    { ar: "الرَّحِيم", en: "Ar-Raheem", tr: "The Most Merciful" },
    { ar: "الْمَلِك", en: "Al-Malik", tr: "The King" },
    { ar: "الْقُدُّوس", en: "Al-Quddus", tr: "The Most Holy" },
    { ar: "السَّلَام", en: "As-Salam", tr: "The Source of Peace" },
    { ar: "الْمُؤْمِن", en: "Al-Mu'min", tr: "The Guardian of Faith" },
    { ar: "الْمُهَيْمِن", en: "Al-Muhaymin", tr: "The Protector" },
    { ar: "الْعَزِيز", en: "Al-Aziz", tr: "The Almighty" },
    { ar: "الْجَبَّار", en: "Al-Jabbar", tr: "The Compeller" },
    { ar: "الْمُتَكَبِّر", en: "Al-Mutakabbir", tr: "The Supreme" },
    { ar: "الْخَالِق", en: "Al-Khaliq", tr: "The Creator" },
    { ar: "الْبَارِئ", en: "Al-Bari", tr: "The Evolver" },
    { ar: "الْمُصَوِّر", en: "Al-Musawwir", tr: "The Fashioner" },
    { ar: "الْغَفَّار", en: "Al-Ghaffar", tr: "The Ever-Forgiving" },
    { ar: "الْقَهَّار", en: "Al-Qahhar", tr: "The Subduer" },
    { ar: "الْوَهَّاب", en: "Al-Wahhab", tr: "The Giver of Gifts" },
    { ar: "الرَّزَّاق", en: "Ar-Razzaq", tr: "The Provider" },
    { ar: "الْفَتَّاح", en: "Al-Fattah", tr: "The Opener" },
    { ar: "الْعَلِيم", en: "Al-Aleem", tr: "The All-Knowing" },
    { ar: "الْقَابِض", en: "Al-Qabid", tr: "The Withholder" },
    { ar: "الْبَاسِط", en: "Al-Basit", tr: "The Extender" },
    { ar: "الْخَافِض", en: "Al-Khafid", tr: "The Reducer" },
    { ar: "الرَّافِع", en: "Ar-Rafi", tr: "The Exalter" },
    { ar: "الْمُعِزّ", en: "Al-Mu'izz", tr: "The Honourer" },
    { ar: "الْمُذِلّ", en: "Al-Mudhill", tr: "The Dishonourer" },
    { ar: "السَّمِيع", en: "As-Sami", tr: "The All-Hearing" },
    { ar: "الْبَصِير", en: "Al-Basir", tr: "The All-Seeing" },
    { ar: "الْحَكَم", en: "Al-Hakam", tr: "The Judge" },
    { ar: "الْعَدْل", en: "Al-Adl", tr: "The Just" },
    { ar: "اللَّطِيف", en: "Al-Latif", tr: "The Subtle One" },
    { ar: "الْخَبِير", en: "Al-Khabir", tr: "The All-Aware" },
    { ar: "الْحَلِيم", en: "Al-Halim", tr: "The Forbearing" },
    { ar: "الْعَظِيم", en: "Al-Azim", tr: "The Magnificent" },
    { ar: "الْغَفُور", en: "Al-Ghafur", tr: "The Forgiver" },
    { ar: "الشَّكُور", en: "Ash-Shakur", tr: "The Grateful" },
    { ar: "الْعَلِيّ", en: "Al-Ali", tr: "The Most High" },
    { ar: "الْكَبِير", en: "Al-Kabir", tr: "The Most Great" },
    { ar: "الْحَفِيظ", en: "Al-Hafiz", tr: "The Preserver" },
    { ar: "الْمُقِيت", en: "Al-Muqit", tr: "The Sustainer" },
    { ar: "الْحَسِيب", en: "Al-Hasib", tr: "The Reckoner" },
    { ar: "الْجَلِيل", en: "Al-Jalil", tr: "The Majestic" },
    { ar: "الْكَرِيم", en: "Al-Karim", tr: "The Generous" },
    { ar: "الرَّقِيب", en: "Ar-Raqib", tr: "The Watchful" },
    { ar: "الْمُجِيب", en: "Al-Mujib", tr: "The Responsive" },
    { ar: "الْوَاسِع", en: "Al-Wasi", tr: "The All-Encompassing" },
    { ar: "الْحَكِيم", en: "Al-Hakim", tr: "The Wise" },
    { ar: "الْوَدُود", en: "Al-Wadud", tr: "The Loving" },
    { ar: "الْمَجِيد", en: "Al-Majid", tr: "The Glorious" },
    { ar: "الْبَاعِث", en: "Al-Ba'ith", tr: "The Resurrector" },
    { ar: "الشَّهِيد", en: "Ash-Shahid", tr: "The Witness" },
    { ar: "الْحَقّ", en: "Al-Haqq", tr: "The Truth" },
    { ar: "الْوَكِيل", en: "Al-Wakil", tr: "The Trustee" },
    { ar: "الْقَوِيّ", en: "Al-Qawiyy", tr: "The Strong" },
    { ar: "الْمَتِين", en: "Al-Matin", tr: "The Firm" },
    { ar: "الْوَلِيّ", en: "Al-Wali", tr: "The Protecting Friend" },
    { ar: "الْحَمِيد", en: "Al-Hamid", tr: "The Praiseworthy" },
    { ar: "الْمُحْصِي", en: "Al-Muhsi", tr: "The Accounter" },
    { ar: "الْمُبْدِئ", en: "Al-Mubdi", tr: "The Originator" },
    { ar: "الْمُعِيد", en: "Al-Mu'id", tr: "The Restorer" },
    { ar: "الْمُحْيِي", en: "Al-Muhyi", tr: "The Giver of Life" },
    { ar: "الْمُمِيت", en: "Al-Mumit", tr: "The Taker of Life" },
    { ar: "الْحَيّ", en: "Al-Hayy", tr: "The Ever-Living" },
    { ar: "الْقَيُّوم", en: "Al-Qayyum", tr: "The Self-Subsisting" },
    { ar: "الْوَاجِد", en: "Al-Wajid", tr: "The Perceiver" },
    { ar: "الْمَاجِد", en: "Al-Majid", tr: "The Illustrious" },
    { ar: "الْوَاحِد", en: "Al-Wahid", tr: "The One" },
    { ar: "الْأَحَد", en: "Al-Ahad", tr: "The Unique" },
    { ar: "الصَّمَد", en: "As-Samad", tr: "The Eternal" },
    { ar: "الْقَادِر", en: "Al-Qadir", tr: "The Capable" },
    { ar: "الْمُقْتَدِر", en: "Al-Muqtadir", tr: "The Powerful" },
    { ar: "الْمُقَدِّم", en: "Al-Muqaddim", tr: "The Expediter" },
    { ar: "الْمُؤِّخِّر", en: "Al-Mu'akhkhir", tr: "The Delayer" },
    { ar: "الْأَوَّل", en: "Al-Awwal", tr: "The First" },
    { ar: "الْآخِر", en: "Al-Akhir", tr: "The Last" },
    { ar: "الظَّاهِر", en: "Az-Zahir", tr: "The Manifest" },
    { ar: "الْبَاطِن", en: "Al-Batin", tr: "The Hidden" },
    { ar: "الْوَالِي", en: "Al-Wali", tr: "The Governor" },
    { ar: "الْمُتَعَالِي", en: "Al-Muta'ali", tr: "The Most Exalted" },
    { ar: "الْبَرّ", en: "Al-Barr", tr: "The Source of Goodness" },
    { ar: "التَّوَّاب", en: "At-Tawwab", tr: "The Acceptor of Repentance" },
    { ar: "الْمُنْتَقِم", en: "Al-Muntaqim", tr: "The Avenger" },
    { ar: "الْعَفُوّ", en: "Al-Afuww", tr: "The Pardoner" },
    { ar: "الرَّؤُوف", en: "Ar-Ra'uf", tr: "The Compassionate" },
    { ar: "مَالِكُ الْمُلْك", en: "Malik-ul-Mulk", tr: "The Owner of Sovereignty" },
    { ar: "ذُو الْجَلَالِ وَالْإِكْرَام", en: "Dhul-Jalal wal-Ikram", tr: "Lord of Majesty and Generosity" },
    { ar: "الْمُقْسِط", en: "Al-Muqsit", tr: "The Equitable" },
    { ar: "الْجَامِع", en: "Al-Jami", tr: "The Gatherer" },
    { ar: "الْغَنِيّ", en: "Al-Ghani", tr: "The Self-Sufficient" },
    { ar: "الْمُغْنِي", en: "Al-Mughni", tr: "The Enricher" },
    { ar: "الْمَانِع", en: "Al-Mani", tr: "The Preventer" },
    { ar: "الضَّارّ", en: "Ad-Darr", tr: "The Distressor" },
    { ar: "النَّافِع", en: "An-Nafi", tr: "The Propitious" },
    { ar: "النُّور", en: "An-Nur", tr: "The Light" },
    { ar: "الْهَادِي", en: "Al-Hadi", tr: "The Guide" },
    { ar: "الْبَدِيع", en: "Al-Badi", tr: "The Incomparable" },
    { ar: "الْبَاقِي", en: "Al-Baqi", tr: "The Everlasting" },
    { ar: "الْوَارِث", en: "Al-Warith", tr: "The Inheritor" },
    { ar: "الرَّشِيد", en: "Ar-Rashid", tr: "The Guide to the Right Path" },
    { ar: "الصَّبُور", en: "As-Sabur", tr: "The Patient" }
];

type Language = 'english' | 'urdu' | 'hinglish';

const NamesOfAllah: React.FC = () => {
    const [selectedName, setSelectedName] = useState<typeof ALL_NAMES[0] | null>(null);
    const [insight, setInsight] = useState<NameInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [lang, setLang] = useState<Language>('english');
    const [failed, setFailed] = useState(false);

    const filteredNames = useMemo(() => ALL_NAMES.filter(n => 
        n.en.toLowerCase().includes(search.toLowerCase()) || n.tr.toLowerCase().includes(search.toLowerCase())
    ), [search]);

    const fetchInsight = async () => {
        if (!selectedName) return;
        setLoading(true);
        setFailed(false);
        try {
            const res = await getNameInsight(selectedName.en);
            if (res) {
                setInsight(res);
            } else {
                setFailed(true);
            }
        } catch (e) {
            console.error("ZestIslam: AI Insight fetch failed", e);
            setFailed(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (name: typeof ALL_NAMES[0]) => {
        setSelectedName(name);
        setInsight(null);
        setFailed(false);
        // We trigger manual reveal instead of auto-fetch for better UX control
    };

    const playAudio = async (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        await playGeneratedAudio(text, 'name');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="text-center space-y-4 pt-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">99 Names of Allah</h2>
                <p className="text-slate-500 dark:text-slate-400">Divine Attributes of the Creator (Asma-ul-Husna)</p>
                <div className="max-w-md mx-auto relative group">
                    <input 
                        type="text" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        placeholder="Search by name or meaning..." 
                        className="w-full px-6 py-4 pl-14 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 outline-none transition-all shadow-sm" 
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredNames.map((n, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSelect(n)} 
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-100 dark:hover:border-emerald-900/40 transition-all text-center relative group animate-fade-in-up"
                        style={{ animationDelay: `${i % 12 * 0.05}s` }}
                    >
                        <Volume2 
                            onClick={(e) => playAudio(e, n.ar)} 
                            className="absolute top-3 right-3 w-4 h-4 text-slate-300 hover:text-emerald-600 transition-colors" 
                        />
                        <p className="font-quran text-5xl text-slate-800 dark:text-white mb-3 group-hover:scale-110 transition-transform">{n.ar}</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{n.en}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 line-clamp-1">{n.tr}</p>
                    </button>
                ))}
            </div>

            {selectedName && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl relative border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                        <button 
                            onClick={() => setSelectedName(null)} 
                            className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-12 text-center text-white shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                            <h3 className="font-quran text-8xl mb-4 relative z-10">{selectedName.ar}</h3>
                            <h4 className="text-3xl font-bold relative z-10">{selectedName.en}</h4>
                            <p className="text-emerald-100 opacity-80 uppercase tracking-[0.2em] text-xs mt-2 relative z-10">{selectedName.tr}</p>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-950/50">
                            {loading ? (
                                <div className="flex flex-col items-center py-16 text-emerald-600">
                                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Consulting the archives...</p>
                                </div>
                            ) : failed ? (
                                <div className="text-center py-12 animate-fade-in space-y-6">
                                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                                        <AlertCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-red-500 font-bold mb-2">Insight unavailable</p>
                                        <p className="text-slate-500 text-sm max-w-xs mx-auto">We couldn't connect to the AI service. Please try again.</p>
                                    </div>
                                    <button 
                                        onClick={fetchInsight} 
                                        className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : insight ? (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl flex shadow-sm border border-slate-200 dark:border-slate-800">
                                        {(['english', 'urdu', 'hinglish'] as Language[]).map(l => (
                                            <button 
                                                key={l} 
                                                onClick={() => setLang(l)} 
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${lang === l ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={`${lang === 'urdu' ? 'text-right' : ''}`} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                                        <p className={`text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 ${lang === 'urdu' ? 'font-quran text-2xl' : ''}`}>
                                            {insight[lang].meaning}
                                        </p>
                                        <p className={`text-slate-600 dark:text-slate-400 leading-relaxed mb-6 ${lang === 'urdu' ? 'font-quran text-xl leading-loose' : ''}`}>
                                            {insight[lang].reflection}
                                        </p>
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/50">
                                            <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3">Living this Attribute</h5>
                                            <p className={`text-slate-700 dark:text-slate-300 font-medium ${lang === 'urdu' ? 'font-quran text-xl' : 'text-sm'}`}>
                                                {insight[lang].application}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Sparkles className="w-12 h-12 text-emerald-200 mx-auto mb-6" />
                                    <p className="text-slate-500 mb-8 text-sm">Unlock deep spiritual insights and practical applications of this Name.</p>
                                    <button 
                                        onClick={fetchInsight} 
                                        className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                                    >
                                        Reveal Insight
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NamesOfAllah;
