import React, { useState } from 'react';
import { Search, Book, Sparkles, Loader2, Volume2, BookOpen, Globe, ArrowRight, LayoutGrid, Library, Gauge, AlertCircle, Copy, Check, ExternalLink, Quote } from 'lucide-react';
import { searchQuranByType, searchHadithByType, searchIslamicWeb, playGeneratedAudio } from '../services/geminiService';
import { QuranVerse, Hadith } from '../types';
import { marked } from 'marked';

type Tab = 'ALL' | 'QURAN' | 'HADEES' | 'WEB';

const UnifiedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [quranResults, setQuranResults] = useState<QuranVerse[]>([]);
  const [hadithResults, setHadithResults] = useState<Hadith[]>([]);
  const [webData, setWebData] = useState<{text: string, chunks: any[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setWebData(null);
    setQuranResults([]);
    setHadithResults([]);
    
    try {
        const [qData, hData, wData] = await Promise.all([
            searchQuranByType(query),
            searchHadithByType(query),
            searchIslamicWeb(query)
        ]);
        setQuranResults(qData || []);
        setHadithResults(hData || []);
        setWebData(wData);
    } catch (error) {
        console.error("ZestIslam Search Error:", error);
    } finally {
        setLoading(false);
    }
  };

  const playAudio = async (text: string, type: 'verse' | 'hadith' = 'verse') => {
    await playGeneratedAudio(text, type, playbackSpeed);
  };

  const handleCopy = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const DisclaimerBanner = () => (
      <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3 text-[11px] sm:text-xs text-amber-800 dark:text-amber-200/80 mb-6 max-w-3xl mx-auto shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <p className="leading-relaxed">
            <strong>Scholarly Disclaimer:</strong> This AI synthesizes knowledge from primary scriptures and the web. Results are for educational purposes.
          </p>
      </div>
  );

  const renderWebContent = () => {
      if (!webData || (!webData.text && (!webData.chunks || webData.chunks.length === 0))) return null;
      return (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border border-emerald-50 dark:border-emerald-900/30 shadow-xl animate-fade-in-up w-full">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 bg-emerald-600 rounded-xl sm:rounded-2xl text-white shadow-lg">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg sm:text-2xl text-slate-800 dark:text-white tracking-tight">Web Insights</h3>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">AI-Synthesized Context</p>
                    </div>
                </div>
            </div>
            
            {webData.text && (
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 sm:p-8 rounded-[1rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-6 sm:mb-8 overflow-hidden">
                    <div 
                        className="prose prose-sm sm:prose-base prose-emerald dark:prose-invert max-w-none leading-relaxed font-sans 
                        prose-headings:font-bold prose-headings:tracking-tight prose-headings:mb-3 prose-headings:mt-5 first:prose-headings:mt-0 
                        prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:mb-3 last:prose-p:mb-0
                        prose-ul:list-disc prose-ul:pl-5 prose-li:mb-2 break-words"
                        dangerouslySetInnerHTML={{ __html: marked.parse(webData.text) as string }}
                    />
                </div>
            )}

            <div className="space-y-4">
                <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                    <ExternalLink className="w-3 h-3" /> Grounded Sources
                </h4>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {webData.chunks?.map((chunk: any, i: number) => {
                            const data = chunk.web;
                            if (!data) return null;
                            return (
                                <a 
                                    key={i} 
                                    href={data.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="group p-4 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 hover:shadow-2xl transition-all flex flex-col h-full overflow-hidden"
                                >
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm mb-3 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                        {data.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50 dark:border-slate-700/50">
                                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                        <p className="text-[9px] text-slate-400 truncate font-mono">
                                            {new URL(data.uri).hostname}
                                        </p>
                                    </div>
                                </a>
                            )
                    })}
                </div>
            </div>
        </div>
      );
  };

  const renderQuranContent = () => (
      <div className="space-y-4 sm:space-y-6">
        {activeTab !== 'ALL' && (
            <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
                <div className="w-1 h-6 sm:h-8 bg-emerald-500 rounded-full"></div>
                <h3 className="font-black text-xl sm:text-2xl text-slate-800 dark:text-white uppercase tracking-tighter">Ayahs</h3>
            </div>
        )}
        {quranResults.map((verse, idx) => {
            const id = `q-${idx}`;
            return (
                <div key={id} className="group bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden animate-fade-in-up w-full">
                    <div className="flex justify-between items-center mb-5 sm:mb-8">
                        <span className="inline-flex items-center px-3 py-1 sm:py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] border border-emerald-100 dark:border-emerald-800/50">
                            {verse.surahName} • {verse.verseNumber}
                        </span>
                        <div className="flex gap-1">
                             <button onClick={() => handleCopy(`${verse.arabicText}\n${verse.translation}`, id)} className="p-2 text-slate-300 hover:text-emerald-500 rounded-xl transition-all">
                                {copiedId === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button onClick={() => playAudio(verse.arabicText, 'verse')} className="p-2 text-slate-300 hover:text-emerald-500 rounded-xl transition-all">
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <p className="text-right font-quran text-2xl sm:text-4xl text-slate-800 dark:text-white mb-5 sm:mb-10 leading-[2.4] sm:leading-[2.8]" dir="rtl">
                        {verse.arabicText}
                    </p>
                    <div className="space-y-4 relative z-10">
                        <div className="flex gap-2 sm:gap-4">
                            <Quote className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500/30 shrink-0 mt-1" />
                            <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-xl font-serif italic leading-relaxed">
                                {verse.translation}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-100 dark:border-slate-800/50">
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-base leading-relaxed">
                                <span className="font-black text-emerald-600 dark:text-emerald-400 mr-2 uppercase tracking-widest text-[9px] sm:text-[10px]">Context:</span>
                                {verse.explanation}
                            </p>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
  );

  const renderHadithContent = () => (
    <div className="space-y-4 sm:space-y-6">
        {activeTab !== 'ALL' && (
            <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
                <div className="w-1 h-6 sm:h-8 bg-indigo-500 rounded-full"></div>
                <h3 className="font-black text-xl sm:text-2xl text-slate-800 dark:text-white uppercase tracking-tighter">Hadiths</h3>
            </div>
        )}
        {hadithResults.map((hadith, idx) => {
            const id = `h-${idx}`;
            return (
                <div key={id} className="group bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden animate-fade-in-up w-full">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-5 sm:mb-8">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                             <span className="inline-flex items-center px-3 sm:px-4 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] sm:text-xs font-black uppercase tracking-widest border border-slate-200">
                                {hadith.book} • #{hadith.hadithNumber}
                            </span>
                            <span className={`inline-flex items-center px-3 sm:px-4 py-1 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest border ${hadith.grade.toLowerCase().includes('sahih') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {hadith.grade}
                            </span>
                        </div>
                        <div className="flex gap-1">
                             <button onClick={() => handleCopy(`${hadith.arabicText}\n${hadith.translation}`, id)} className="p-2 text-slate-300 hover:text-indigo-500 rounded-xl transition-all">
                                {copiedId === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button onClick={() => playAudio(hadith.arabicText, 'hadith')} className="p-2 text-slate-300 hover:text-indigo-500 rounded-xl transition-all">
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <p className="text-right font-quran text-xl sm:text-4xl text-slate-800 dark:text-white mb-5 sm:mb-10 leading-[2.4] sm:leading-[2.6]" dir="rtl">
                        {hadith.arabicText}
                    </p>
                    <div className="relative pl-3 sm:pl-6 border-l-4 border-indigo-100 dark:border-indigo-900/50 space-y-3 sm:space-y-6">
                        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-xl leading-relaxed font-medium">
                            {hadith.translation}
                        </p>
                        <div className="flex items-start gap-2 pt-1">
                             <Sparkles className="w-3 h-3 text-indigo-500 mt-1 shrink-0" />
                             <p className="text-[10px] sm:text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase mr-1 tracking-widest text-[8px] sm:text-[10px]">Context:</span>
                                {hadith.chapter} — {hadith.explanation}
                             </p>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );

  return (
    <div className={`mx-auto px-1 sm:px-6 transition-all duration-700 ${!searched ? 'max-w-3xl flex flex-col justify-center min-h-[75vh]' : 'max-w-7xl space-y-6 sm:space-y-12'}`}>
      <div className={`text-center space-y-3 sm:space-y-4 transition-all duration-700 ${!searched ? 'mb-12 sm:mb-16 scale-100 sm:scale-110' : 'mb-6 sm:mb-10'}`}>
        <div className="inline-flex items-center justify-center p-3 sm:p-5 bg-emerald-600 rounded-2xl sm:rounded-[2rem] text-white shadow-2xl mb-4">
            <Search className="w-7 h-7 sm:w-10 sm:h-10" />
        </div>
        <h2 className={`font-black text-slate-900 dark:text-white transition-all tracking-tight ${!searched ? 'text-3xl sm:text-7xl' : 'text-2xl sm:text-5xl'}`}>
            Unified Search
        </h2>
        <p className={`text-slate-500 dark:text-slate-400 transition-all font-medium max-w-xl mx-auto px-4 ${!searched ? 'text-base sm:text-2xl' : 'text-xs sm:text-lg'}`}>
            Explore Quranic verses, authentic Hadiths, and synthesized web insights.
        </p>
      </div>

      <DisclaimerBanner />

      <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto w-full z-10 px-1 sm:px-0">
        <div className="absolute inset-y-0 left-5 sm:left-10 flex items-center pointer-events-none">
            <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
        </div>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Justice in Islam, Fasting benefits..." 
          className="w-full pl-12 sm:pl-20 pr-28 sm:pr-40 py-4 sm:py-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 outline-none transition-all shadow-xl text-sm sm:text-2xl font-medium" 
        />
        <div className="absolute inset-y-1.5 sm:inset-y-2.5 right-1.5 sm:right-2.5">
            <button 
                type="submit" 
                disabled={loading || !query} 
                className="h-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-12 rounded-full font-black transition-all flex items-center gap-2 shadow-lg active:scale-[0.98]"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span className="hidden sm:inline">{loading ? 'Searching' : 'Search'}</span>
            </button>
        </div>
      </form>

      {loading && (
          <div className="text-center py-16 sm:py-24 animate-fade-in">
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-xl font-black animate-pulse uppercase tracking-[0.3em]">Connecting to Sources...</p>
          </div>
      )}

      {!loading && searched && (quranResults.length > 0 || hadithResults.length > 0 || webData) && (
          <div className="space-y-6 sm:space-y-10 w-full overflow-hidden">
            {/* Nav Strip */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 pb-2 sm:pb-6 overflow-hidden">
                <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl sm:rounded-3xl border border-slate-100 inline-flex shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth">
                    {[
                        { id: 'ALL', icon: LayoutGrid, label: 'Results' },
                        { id: 'QURAN', icon: BookOpen, label: 'Quran' },
                        { id: 'HADEES', icon: Library, label: 'Hadith' },
                        { id: 'WEB', icon: Globe, label: 'Web' },
                    ].map((tab) => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as Tab)} 
                            className={`flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 sm:flex-none ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
                        >
                            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                 {(quranResults.length > 0 || hadithResults.length > 0) && (
                    <div className="bg-white dark:bg-slate-900 p-1 rounded-xl sm:rounded-2xl border border-slate-100 inline-flex items-center gap-2 sm:gap-3 w-full sm:w-auto px-4">
                        <Gauge className="w-4 h-4 text-emerald-500" />
                        <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} className="bg-transparent text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 border-none focus:ring-0 cursor-pointer py-1.5 flex-1 sm:pr-8">
                            <option value="0.75">0.75x</option><option value="1">1.0x</option><option value="1.25">1.25x</option>
                        </select>
                    </div>
                 )}
            </div>
            
            <div className="animate-fade-in-up w-full max-w-full">
                {activeTab === 'ALL' ? (
                    <div className="space-y-10 sm:space-y-16">
                        {webData && (
                            <section className="w-full">
                                {renderWebContent()}
                            </section>
                        )}
                        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 w-full">
                            <section className="space-y-4 sm:space-y-8 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-4 px-1 sm:px-4">
                                    <div className="w-1 h-6 sm:h-10 bg-emerald-500 rounded-full"></div>
                                    <h3 className="font-black text-lg sm:text-3xl text-slate-800 dark:text-white uppercase tracking-tighter">Ayahs</h3>
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-xs px-3 py-1 rounded-full font-black ml-auto">{quranResults.length}</span>
                                </div>
                                {renderQuranContent()}
                            </section>
                            <section className="space-y-4 sm:space-y-8 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-4 px-1 sm:px-4">
                                    <div className="w-1 h-6 sm:h-10 bg-indigo-500 rounded-full"></div>
                                    <h3 className="font-black text-lg sm:text-3xl text-slate-800 dark:text-white uppercase tracking-tighter">Hadiths</h3>
                                    <span className="bg-indigo-100 text-indigo-800 text-[9px] sm:text-xs px-3 py-1 rounded-full font-black ml-auto">{hadithResults.length}</span>
                                </div>
                                {renderHadithContent()}
                            </section>
                        </div>
                    </div>
                ) : activeTab === 'WEB' ? (
                    <div className="max-w-5xl mx-auto w-full">{renderWebContent()}</div>
                ) : activeTab === 'QURAN' ? (
                    <div className="max-w-5xl mx-auto w-full">{renderQuranContent()}</div>
                ) : (
                    <div className="max-w-5xl mx-auto w-full">{renderHadithContent()}</div>
                )}
            </div>
          </div>
      )}

      {!loading && searched && quranResults.length === 0 && hadithResults.length === 0 && !webData && (
          <div className="text-center py-16 sm:py-24 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[4rem] border border-slate-100 shadow-2xl">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <h3 className="font-black text-slate-800 dark:text-white text-xl sm:text-2xl">No matches found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto px-6 text-sm">Try broadening your keywords.</p>
              <button onClick={() => setSearched(false)} className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-full font-black hover:bg-emerald-700 transition-all">New Search</button>
          </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
