import React, { useState } from 'react';
import { Search, BookOpen, Loader2, Sparkles, Volume2, Book, AlertCircle } from 'lucide-react';
import { searchHadithByType, generateSharh, playGeneratedAudio, stopGeneratedAudio } from '../services/geminiService';
import { Hadith, SharhResult } from '../types';

const HadeesSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sharhLoading, setSharhLoading] = useState<number | null>(null);
  const [expandedSharh, setExpandedSharh] = useState<{idx: number, data: SharhResult, lang: 'english' | 'urdu' | 'hinglish'} | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setExpandedSharh(null);
    const data = await searchHadithByType(query);
    setResults(data);
    setLoading(false);
  };

  const handleSharh = async (idx: number, hadith: Hadith) => {
      if (expandedSharh?.idx === idx) {
          setExpandedSharh(null);
          return;
      }
      setSharhLoading(idx);
      const result = await generateSharh(hadith.book, hadith.hadithNumber);
      if (result) setExpandedSharh({ idx, data: result, lang: 'english' });
      setSharhLoading(null);
  };

  const playAudio = async (text: string) => {
      if (playingAudioId === text) {
          stopGeneratedAudio();
          setPlayingAudioId(null);
          return;
      }
      stopGeneratedAudio();
      setPlayingAudioId(text);
      await playGeneratedAudio(text, 'hadith', 1.0, () => setPlayingAudioId(null));
  };

  const stopAudio = () => {
      stopGeneratedAudio();
      setPlayingAudioId(null);
  }

  const DisclaimerBanner = () => (
      <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-200/80 mb-6 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> Hadith authenticity varies. Explanation (Sharh) is for context; always refer to classical Muhadditheen for formal rulings.
          </p>
      </div>
  );

  const renderExpandedSharh = (expanded: {idx: number, data: SharhResult, lang: 'english' | 'urdu' | 'hinglish'}) => (
        <div className="mt-4 sm:mt-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-[1.25rem] sm:rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
            <div className="p-4 sm:p-8">
                <div className="bg-slate-200 dark:bg-slate-900/50 p-1 rounded-xl flex mb-6 max-w-md">
                    {['english', 'urdu', 'hinglish'].map((l) => (
                        <button key={l} onClick={() => setExpandedSharh(prev => prev ? {...prev, lang: l as any} : null)} className={`flex-1 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 ${expanded.lang === l ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>{l}</button>
                    ))}
                </div>
                <p className={`text-slate-700 dark:text-slate-300 mb-6 sm:mb-8 leading-relaxed font-medium text-sm sm:text-base ${expanded.lang === 'urdu' ? 'font-quran text-xl sm:text-2xl text-right leading-loose' : ''}`} dir={expanded.lang === 'urdu' ? 'rtl' : 'ltr'}>
                    {expanded.data?.[expanded.lang]?.paragraph || "Sharh not available in this language."}
                </p>
                <div>
                    <h5 className={`font-bold text-slate-900 dark:text-white text-[10px] sm:text-xs uppercase tracking-wide mb-4 flex items-center gap-2 ${expanded.lang === 'urdu' ? 'flex-row-reverse' : ''}`}><Sparkles className="w-3 h-3 text-emerald-500" />{expanded.lang === 'urdu' ? 'اہم نکات' : 'Key Benefits'}</h5>
                    <ul className={`space-y-2 sm:space-y-3 ${expanded.lang === 'urdu' ? 'text-right' : ''}`} dir={expanded.lang === 'urdu' ? 'rtl' : 'ltr'}>
                        {expanded.data?.[expanded.lang]?.points?.map((p, i) => (
                            <li key={i} className={`flex gap-3 sm:gap-4 items-start p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm ${expanded.lang === 'urdu' ? 'flex-row-reverse' : ''}`}><span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span><span className={`text-slate-700 dark:text-slate-300 ${expanded.lang === 'urdu' ? 'font-quran text-lg sm:text-xl leading-loose' : 'text-xs sm:text-sm'}`}>{p}</span></li>
                        )) || <li className="text-xs text-slate-400 italic">No key points available.</li>}
                    </ul>
                </div>
                <button onClick={() => setExpandedSharh(null)} className="w-full mt-6 sm:mt-8 py-3 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Close Explanation</button>
            </div>
        </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      <div className="text-center space-y-2 sm:space-y-4 py-4 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Hadith AI Search</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed px-4">Search authentic traditions and gain AI-assisted insights.</p>
      </div>

      <DisclaimerBanner />
      
      <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto px-2 sm:px-0 animate-fade-in z-10">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" /></div>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Topic (e.g. Rights of neighbors)..." className="w-full pl-12 sm:pl-16 pr-24 sm:pr-32 py-4 sm:py-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm sm:text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
          <div className="absolute inset-y-2 right-2 sm:right-3"><button type="submit" disabled={loading || !query} className="h-full bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-8 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base">{loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Search'}</button></div>
      </form>

      <div className="space-y-4 sm:space-y-6">
          {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative"><div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div><BookOpen className="w-5 h-5 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                  <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium animate-pulse text-sm">Searching authentic narrations...</p>
              </div>
          )}
          {!loading && searched && results.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto px-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" /></div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No results found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Try rephrasing your query with broader keywords.</p>
              </div>
          )}
          {!loading && !searched && (
              <div className="text-center py-16 opacity-50 max-w-lg mx-auto px-4"><Book className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" /><p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Search for any topic to retrieve authentic Hadiths from Sahih Bukhari, Muslim, and other major collections.</p></div>
          )}
          {results.map((hadith, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.25rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative group overflow-hidden animate-fade-in-up">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 sm:mb-6 gap-3">
                      <div className="flex gap-2 sm:gap-3 flex-wrap">
                          <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-sm font-bold border border-slate-100 dark:border-slate-700"><BookOpen className="w-3.5 h-3.5 sm:w-4 h-4 mr-2 text-emerald-500" />{hadith.book} • #{hadith.hadithNumber}</span>
                          <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${hadith.grade.toLowerCase().includes('sahih') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800'}`}>{hadith.grade}</span>
                      </div>
                      <button onClick={() => playingAudioId === hadith.arabicText ? stopAudio() : playAudio(hadith.arabicText)} className={`p-2 rounded-full transition-colors self-end md:self-auto ${playingAudioId === hadith.arabicText ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}>{playingAudioId === hadith.arabicText ? <div className="w-3 h-3 bg-current rounded-sm" /> : <Volume2 className="w-5 h-5" />}</button>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-slate-50 dark:border-slate-800"><p className="text-right font-quran text-xl sm:text-3xl text-slate-800 dark:text-white" dir="rtl">{hadith.arabicText}</p></div>
                  <div className="prose prose-sm sm:prose-lg prose-slate dark:prose-invert max-w-none mb-4 sm:mb-6"><p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif text-base sm:text-lg">{hadith.translation}</p></div>
                  <div className="flex items-start gap-3 mb-5 sm:mb-6"><div className="w-1 h-10 sm:h-12 bg-emerald-200 dark:bg-emerald-800 rounded-full shrink-0"></div><div><p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Context</p><p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{hadith.chapter} — {hadith.explanation}</p></div></div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 sm:pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h4 className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-300 flex items-center gap-2"><div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>Sharh & Insights</h4>
                          {expandedSharh?.idx !== idx && (<button onClick={() => handleSharh(idx, hadith)} disabled={sharhLoading === idx} className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800/50 sm:border-none">{sharhLoading === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : 'View Explanation'}</button>)}
                      </div>
                      {expandedSharh?.idx === idx && renderExpandedSharh(expandedSharh)}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default HadeesSearch;
