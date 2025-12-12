

import React, { useState } from 'react';
import { Search, Book, Sparkles, Loader2, Volume2, BookOpen, Globe, ArrowRight, LayoutGrid, Library, Gauge } from 'lucide-react';
import { searchQuranByType, searchHadithByType, searchIslamicWeb, playGeneratedAudio } from '../services/geminiService';
import { QuranVerse, Hadith } from '../types';

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setWebData(null);
    setQuranResults([]);
    setHadithResults([]);
    
    // Run searches in parallel for efficiency
    const [qData, hData, wData] = await Promise.all([
        searchQuranByType(query),
        searchHadithByType(query),
        searchIslamicWeb(query)
    ]);

    setQuranResults(qData);
    setHadithResults(hData);
    setWebData(wData);
    setLoading(false);
  };

  const playAudio = async (text: string, type: 'verse' | 'hadith' = 'verse') => {
    await playGeneratedAudio(text, type, playbackSpeed);
  };

  // Helper to render web content
  const renderWebContent = () => {
      if (!webData || (!webData.text && webData.chunks.length === 0)) return null;
      return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-emerald-50 dark:border-emerald-900/30 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Web Insights</h3>
            </div>
            {webData.text && (
                <div className="prose prose-sm prose-emerald dark:prose-invert mb-6 text-slate-700 dark:text-slate-300 max-w-none leading-relaxed">
                    <p>{webData.text}</p>
                </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {webData.chunks.map((chunk, i) => {
                        const data = chunk.web;
                        if (!data) return null;
                        return (
                            <a key={i} href={data.uri} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-slate-100 dark:border-slate-700 group">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{data.title}</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">{data.uri}</p>
                            </a>
                        )
                })}
            </div>
        </div>
      );
  };

  // Helper to render Quran content
  const renderQuranContent = () => (
      <div className="space-y-4">
        {activeTab !== 'ALL' && (
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Quranic Verses</h3>
            </div>
        )}
        {quranResults.map((verse, idx) => (
            <div key={`q-${idx}`} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-emerald-50 dark:border-emerald-900/30 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-wider">{verse.surahName} : {verse.verseNumber}</span>
                    <button onClick={() => playAudio(verse.arabicText, 'verse')} className="text-slate-300 hover:text-emerald-500 transition-colors"><Volume2 className="w-5 h-5" /></button>
                </div>
                <p className="text-right font-quran text-2xl text-slate-800 dark:text-white mb-4" dir="rtl">{verse.arabicText}</p>
                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4">{verse.translation}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs italic bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">{verse.explanation}</p>
            </div>
        ))}
        {quranResults.length === 0 && searched && !loading && activeTab !== 'ALL' && <p className="text-slate-400 dark:text-slate-500 text-sm italic text-center py-8">No specific verses found.</p>}
      </div>
  );

  // Helper to render Hadith content
  const renderHadithContent = () => (
    <div className="space-y-4">
         {activeTab !== 'ALL' && (
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                <Library className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Prophetic Hadiths</h3>
            </div>
        )}
        {hadithResults.map((hadith, idx) => (
            <div key={`h-${idx}`} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-emerald-50 dark:border-emerald-900/30 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{hadith.book} #{hadith.hadithNumber}</span>
                    <button onClick={() => playAudio(hadith.arabicText, 'hadith')} className="text-slate-300 hover:text-emerald-500 transition-colors"><Volume2 className="w-5 h-5" /></button>
                </div>
                <p className="text-right font-quran text-2xl text-slate-800 dark:text-white mb-4" dir="rtl">{hadith.arabicText}</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3">{hadith.translation}</p>
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${hadith.grade.toLowerCase().includes('sahih') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>{hadith.grade}</span>
                </div>
            </div>
        ))}
        {hadithResults.length === 0 && searched && !loading && activeTab !== 'ALL' && <p className="text-slate-400 dark:text-slate-500 text-sm italic text-center py-8">No specific Hadiths found.</p>}
    </div>
  );

  return (
    <div className={`mx-auto transition-all duration-500 ${!searched ? 'max-w-3xl flex flex-col justify-center min-h-[60vh]' : 'max-w-6xl space-y-8'}`}>
      
      {/* Hero Header (Centers when not searched) */}
      <div className={`text-center space-y-4 transition-all duration-500 ${!searched ? 'mb-12 scale-100' : 'mb-8'}`}>
        <h2 className={`font-bold text-slate-800 dark:text-white transition-all ${!searched ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'}`}>
          Knowledge Search
        </h2>
        <p className={`text-slate-500 dark:text-slate-400 transition-all ${!searched ? 'text-lg' : 'text-sm'}`}>
          Explore Quran, Hadith, and Web Insights simultaneously.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto w-full z-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'Patience and gratitude'..."
          className="w-full px-6 py-5 pl-14 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-lg shadow-slate-200/50 dark:shadow-none text-slate-800 dark:text-white placeholder:text-slate-400 text-lg"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
        <button 
            type="submit"
            disabled={loading || !query}
            className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-full font-medium transition-all disabled:opacity-50 disabled:scale-95 flex items-center gap-2 shadow-md shadow-emerald-200 dark:shadow-none"
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      {/* Loading State */}
      {loading && (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium animate-pulse">Consulting the archives...</p>
          </div>
      )}

      {/* No Results */}
      {!loading && searched && quranResults.length === 0 && hadithResults.length === 0 && (!webData || webData.text.length === 0) && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto mt-8">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No results found</h3>
             <p className="text-slate-500 dark:text-slate-400">Try rephrasing your query or using broader keywords.</p>
          </div>
      )}

      {/* Results View */}
      {!loading && searched && (quranResults.length > 0 || hadithResults.length > 0 || webData) && (
          <div className="space-y-6">
            
            {/* Tabs for Mobile/Tablet */}
            <div className="flex justify-between items-center pb-2 overflow-x-auto no-scrollbar">
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 inline-flex shadow-sm">
                    {[
                        { id: 'ALL', icon: LayoutGrid, label: 'All Results' },
                        { id: 'QURAN', icon: BookOpen, label: 'Quran' },
                        { id: 'HADEES', icon: Library, label: 'Hadith' },
                        { id: 'WEB', icon: Globe, label: 'Web Insights' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-emerald-600 text-white shadow-md' 
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                 {/* Speed Controller for Audio */}
                 {(quranResults.length > 0 || hadithResults.length > 0) && (
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 inline-flex items-center gap-2 ml-4">
                        <Gauge className="w-4 h-4 text-emerald-500 ml-2" />
                        <select 
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                            className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 border-none focus:ring-0 cursor-pointer py-1 pr-8"
                        >
                            <option value="0.75">0.75x (Slow)</option>
                            <option value="1">1.0x (Normal)</option>
                            <option value="1.25">1.25x (Fast)</option>
                        </select>
                    </div>
                 )}
            </div>

            {/* Content Render Logic */}
            <div className="animate-fade-in-up">
                {activeTab === 'ALL' ? (
                    <>
                        {webData && renderWebContent()}
                        <div className="grid lg:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Quranic Verses</h3>
                                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold">{quranResults.length}</span>
                                </div>
                                {renderQuranContent()}
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                                    <Library className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Prophetic Hadiths</h3>
                                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold">{hadithResults.length}</span>
                                </div>
                                {renderHadithContent()}
                            </div>
                        </div>
                    </>
                ) : activeTab === 'WEB' ? (
                    <div className="max-w-3xl mx-auto">{renderWebContent()}</div>
                ) : activeTab === 'QURAN' ? (
                    <div className="max-w-3xl mx-auto">{renderQuranContent()}</div>
                ) : (
                    <div className="max-w-3xl mx-auto">{renderHadithContent()}</div>
                )}
            </div>

          </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
