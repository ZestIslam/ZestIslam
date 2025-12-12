import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Loader2, Sparkles, Volume2, Gauge, ChevronLeft, Play, Pause, Square, SkipForward, SkipBack, X } from 'lucide-react';
import { searchQuranByType, generateTadabbur, playGeneratedAudio, stopGeneratedAudio, fetchSurahList, fetchFullSurah, fetchSurahAudio } from '../services/geminiService';
import { QuranVerse, TadabburResult, SurahMeta, FullSurahVerse } from '../types';

const QuranSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tadabburLoading, setTadabburLoading] = useState<number | null>(null);
  const [expandedTadabbur, setExpandedTadabbur] = useState<{idx: number, data: TadabburResult, lang: 'english' | 'urdu' | 'hinglish'} | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null); // Track which verse audio is playing
  
  // Surah Reading State
  const [allSurahs, setAllSurahs] = useState<SurahMeta[]>([]);
  const [matchedSurah, setMatchedSurah] = useState<SurahMeta | null>(null);
  const [readingSurah, setReadingSurah] = useState<{ meta: SurahMeta, verses: FullSurahVerse[] } | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);

  // Audio Player State
  const [audioPlaylist, setAudioPlaylist] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      fetchSurahList().then(setAllSurahs);
  }, []);

  // Check for Surah match whenever query changes
  useEffect(() => {
      if (!query || allSurahs.length === 0) {
          setMatchedSurah(null);
          return;
      }
      
      const cleanQuery = query.toLowerCase().replace('surah', '').trim();
      const match = allSurahs.find(s => 
          s.englishName.toLowerCase() === cleanQuery || 
          s.englishName.toLowerCase().includes(cleanQuery) && cleanQuery.length > 3 ||
          s.number.toString() === cleanQuery
      );
      setMatchedSurah(match || null);
  }, [query, allSurahs]);

  // Audio Effect
  useEffect(() => {
      if (currentTrackIndex >= 0 && currentTrackIndex < audioPlaylist.length) {
          if (!audioRef.current) {
              audioRef.current = new Audio(audioPlaylist[currentTrackIndex]);
              audioRef.current.playbackRate = playbackSpeed;
              audioRef.current.onended = handleTrackEnd;
          } else {
              audioRef.current.src = audioPlaylist[currentTrackIndex];
              audioRef.current.playbackRate = playbackSpeed;
          }
          
          if (isPlaying) {
              audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
      } else {
           if (audioRef.current) {
               audioRef.current.pause();
               audioRef.current = null;
           }
      }

      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
          }
      }
  }, [currentTrackIndex, audioPlaylist]);

  // Update speed in real time
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.playbackRate = playbackSpeed;
      }
  }, [playbackSpeed]);

  const handleTrackEnd = () => {
      setCurrentTrackIndex(prev => {
          if (prev < audioPlaylist.length - 1) return prev + 1;
          setIsPlaying(false);
          return -1;
      });
  };

  const togglePlayPause = () => {
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
          } else {
              audioRef.current.play();
          }
          setIsPlaying(!isPlaying);
      }
  };

  const stopAudio = () => {
      if (audioRef.current) {
          audioRef.current.pause();
      }
      setIsPlaying(false);
      setCurrentTrackIndex(-1);
      setAudioPlaylist([]);
  };

  const handleListenFullSurah = async (surahNumber: number) => {
      stopAudio(); // Reset
      setAudioLoading(true);
      const urls = await fetchSurahAudio(surahNumber);
      if (urls.length > 0) {
          setAudioPlaylist(urls);
          setCurrentTrackIndex(0);
          setIsPlaying(true);
      } else {
          alert("Audio not available for this Surah.");
      }
      setAudioLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setExpandedTadabbur(null);
    const data = await searchQuranByType(query);
    setResults(data);
    setLoading(false);
  };

  const handleTadabbur = async (idx: number, verse: QuranVerse) => {
      if (expandedTadabbur?.idx === idx) {
          setExpandedTadabbur(null);
          return;
      }
      setTadabburLoading(idx);
      const result = await generateTadabbur(verse.surahName, verse.verseNumber);
      if (result) {
          setExpandedTadabbur({ idx, data: result, lang: 'english' });
      }
      setTadabburLoading(null);
  };

  const playAudio = async (text: string) => {
      if (playingAudioId === text) {
          stopGeneratedAudio();
          setPlayingAudioId(null);
          return;
      }

      // Pause any full surah playback first
      if (isPlaying) togglePlayPause();
      
      setPlayingAudioId(text);
      await playGeneratedAudio(text, 'verse', playbackSpeed, () => {
          setPlayingAudioId(null);
      });
  };

  const openFullSurah = async (surahNumber: number) => {
      setReaderLoading(true);
      const data = await fetchFullSurah(surahNumber);
      if (data) {
          setReadingSurah(data);
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setReaderLoading(false);
  };

  // --- RENDER SURAH READER ---
  if (readingSurah) {
      return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-32">
              {/* Reader Header */}
              <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button 
                    onClick={() => setReadingSurah(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                      <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <div className="text-center">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">{readingSurah.meta.englishName}</h2>
                      <p className="text-xs text-slate-400 font-quran">{readingSurah.meta.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-2 px-3">
                            <Gauge className="w-4 h-4 text-emerald-500" />
                            <select 
                                value={playbackSpeed}
                                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 border-none focus:ring-0 cursor-pointer py-1 pr-2"
                            >
                                <option value="0.75">0.75x</option>
                                <option value="1">1.0x</option>
                                <option value="1.25">1.25x</option>
                            </select>
                      </div>
                      <button 
                        onClick={() => handleListenFullSurah(readingSurah.meta.number)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"
                        title="Listen Full Surah"
                      >
                         {audioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </button>
                  </div>
              </div>

              {/* Bismillah */}
              <div className="text-center py-8 font-quran text-3xl text-slate-800 dark:text-emerald-400 opacity-80">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>

              {/* Verses List */}
              <div className="space-y-4">
                  {readingSurah.verses.map((verse, idx) => (
                      <div key={verse.number} className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all group ${currentTrackIndex === idx ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-emerald-100 dark:hover:border-emerald-900'}`}>
                          <div className="flex justify-between items-start mb-6">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${currentTrackIndex === idx ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                  {verse.numberInSurah}
                              </span>
                              <button 
                                onClick={() => playAudio(verse.text)}
                                className={`p-2 rounded-full transition-all ${playingAudioId === verse.text ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                              >
                                  {playingAudioId === verse.text ? <Square className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />}
                              </button>
                          </div>
                          
                          <p className="text-right font-quran text-3xl md:text-4xl text-slate-800 dark:text-white mb-6 leading-[2.5]" dir="rtl">
                              {verse.text}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 text-lg font-serif leading-relaxed">
                              {verse.translation}
                          </p>
                      </div>
                  ))}
              </div>

              <div className="text-center pt-8">
                  <button 
                    onClick={() => setReadingSurah(null)}
                    className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                      Close Reader
                  </button>
              </div>

              {/* Sticky Player */}
              {audioPlaylist.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 z-50 animate-fade-in-up">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={stopAudio} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Playing Surah {readingSurah.meta.englishName}</p>
                                <p className="text-xs text-slate-500">Ayah {currentTrackIndex + 1} of {readingSurah.meta.numberOfAyahs}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setCurrentTrackIndex(Math.max(0, currentTrackIndex - 1))} className="text-slate-400 hover:text-emerald-600"><SkipBack className="w-5 h-5" /></button>
                            <button 
                                onClick={togglePlayPause}
                                className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                            </button>
                            <button onClick={() => setCurrentTrackIndex(Math.min(audioPlaylist.length - 1, currentTrackIndex + 1))} className="text-slate-400 hover:text-emerald-600"><SkipForward className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4 py-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Quranic Guidance</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">Search verses by topic or emotion, or read full Surahs.</p>
      </div>

      <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topic (e.g., 'Patience', 'Hope') or Surah name..."
          className="w-full pl-16 pr-32 py-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        <div className="absolute inset-y-2 right-2">
            <button 
                type="submit"
                disabled={loading || !query}
                className="h-full bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 text-white px-8 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
        </div>
      </form>

      {/* Matched Surah Shortcut */}
      {matchedSurah && !searched && (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
              <div 
                onClick={() => openFullSurah(matchedSurah.number)}
                className="bg-emerald-600 text-white p-6 rounded-[2rem] flex items-center justify-between cursor-pointer hover:bg-emerald-700 transition-colors shadow-xl shadow-emerald-200 dark:shadow-none group"
              >
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl font-quran">
                          {matchedSurah.number}
                      </div>
                      <div>
                          <h3 className="text-xl font-bold">Surah {matchedSurah.englishName}</h3>
                          <p className="text-emerald-100 text-sm">{matchedSurah.englishNameTranslation} • {matchedSurah.numberOfAyahs} Ayahs</p>
                      </div>
                  </div>
                  <div className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      {readerLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                  </div>
              </div>
          </div>
      )}

      {/* Search Results */}
      <div className="space-y-6">
        {results.map((verse, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative group">
              <div className="flex justify-between items-start mb-6">
                  <span className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold border border-slate-100 dark:border-slate-700">
                      <BookOpen className="w-4 h-4 mr-2 text-emerald-500" />
                      {verse.surahName} : {verse.verseNumber}
                  </span>
                  <button onClick={() => playAudio(verse.arabicText)} className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-all" title="Play Audio"><Volume2 className="w-5 h-5" /></button>
              </div>
              
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-6 mb-6 border border-slate-50 dark:border-slate-800">
                  <p className="text-right font-quran text-2xl md:text-3xl text-slate-800 dark:text-white" dir="rtl">
                  {verse.arabicText}
                  </p>
              </div>
              
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif text-lg mb-6">
                  {verse.translation}
              </p>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                 <p className="text-xs text-slate-400 italic max-w-lg">{verse.explanation}</p>
                 <button 
                    onClick={() => handleTadabbur(idx, verse)}
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-4 py-2 rounded-xl transition-colors"
                 >
                     {tadabburLoading === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                     Reflect
                 </button>
              </div>

              {expandedTadabbur?.idx === idx && (
                  <div className="mt-6 bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-2xl animate-fade-in-up">
                      <div className="flex gap-2 mb-4">
                          {['english', 'urdu', 'hinglish'].map(l => (
                              <button key={l} onClick={() => setExpandedTadabbur(prev => prev ? {...prev, lang: l as any} : null)} className={`text-xs font-bold uppercase px-3 py-1 rounded-lg ${expandedTadabbur.lang === l ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>
                                  {l}
                              </button>
                          ))}
                      </div>
                      <p className={`text-slate-700 dark:text-slate-300 mb-4 ${expandedTadabbur.lang === 'urdu' ? 'text-right font-quran text-lg' : ''}`}>
                          {expandedTadabbur.data[expandedTadabbur.lang].paragraph}
                      </p>
                      <ul className={`space-y-2 ${expandedTadabbur.lang === 'urdu' ? 'text-right' : ''}`}>
                          {expandedTadabbur.data[expandedTadabbur.lang].points.map((p, i) => (
                              <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                                  <span className="text-emerald-500">•</span> {p}
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
          </div>
        ))}

        {!searched && results.length === 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allSurahs.map(surah => (
                    <button 
                      key={surah.number}
                      onClick={() => openFullSurah(surah.number)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group hover:shadow-md"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 group-hover:text-emerald-600 transition-colors">
                                {surah.number}
                            </span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">{surah.revelationType}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{surah.englishName}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{surah.englishNameTranslation}</p>
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default QuranSearch;