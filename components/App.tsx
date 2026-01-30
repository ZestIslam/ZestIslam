import React, { useState, useEffect } from 'react';
import { Home, Book, MessageCircle, Sparkles, Menu, X, Clock, Image, Video, MapPin, Mic, BookOpen, Search, RotateCcw, Heart, Moon, HelpCircle, ChevronRight, Sun, Info, Youtube, Instagram, User, LogIn, LogOut, Bell, Mail, Lock, Settings, KeyRound, Loader2, CheckCircle, Cpu, Calculator } from 'lucide-react';
import PrayerTimes from './PrayerTimes';
import QuranSearch from './QuranSearch';
import HadeesSearch from './HadeesSearch';
import UnifiedSearch from './UnifiedSearch';
import IslamicChat from './IslamicChat';
import DuaGenerator from './DuaGenerator';
import ThumbnailGenerator from './ThumbnailGenerator';
import MediaStudio from './MediaStudio';
import HalalFinder from './HalalFinder';
import LiveScholar from './LiveScholar';
import TasbihCounter from './TasbihCounter';
import NamesOfAllah from './NamesOfAllah';
import DreamInterpreter from './DreamInterpreter';
import IslamicQuiz from './IslamicQuiz';
import ZakatCalculator from './ZakatCalculator';
import { AppView, UserProfile } from '../types';
import { getDailyInspiration } from '../services/geminiService';
import { signInUser, signUpUser, signOutUser, resetUserPassword, updateUserPassword, subscribeToAuthChanges } from '../services/userService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dailyInspiration, setDailyInspiration] = useState<{type: string, text: string, source: string} | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(() => {
      try {
          const stored = localStorage.getItem('zestislam_current_session');
          return stored ? JSON.parse(stored) : null;
      } catch (e) { return null; }
  });

  const [loginMode, setLoginMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    getDailyInspiration().then(setDailyInspiration);
    const subscription = subscribeToAuthChanges((event) => {
        if (event === 'PASSWORD_RECOVERY') setView(AppView.UPDATE_PASSWORD);
    });
    return () => { if (subscription) subscription.unsubscribe(); }
  }, []);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault(); setAuthLoading(true); setAuthError(null); setAuthSuccess(null);
      try {
          if (loginMode === 'forgot') {
              const result = await resetUserPassword(authForm.email);
              if (result.error) setAuthError(result.error); else setAuthSuccess("Reset link sent.");
          } else {
              let result = loginMode === 'signup' ? await signUpUser(authForm.email, authForm.password, authForm.name) : await signInUser(authForm.email, authForm.password);
              if (result.error) setAuthError(result.error);
              else if (result.user) { setUser(result.user); localStorage.setItem('zestislam_current_session', JSON.stringify(result.user)); setView(AppView.HOME); }
          }
      } catch (err) { setAuthError("Unexpected error."); } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
      if (window.confirm("Log out?")) { await signOutUser(); setUser(null); localStorage.removeItem('zestislam_current_session'); setView(AppView.HOME); }
  };

  const navItems = [
    { id: AppView.HOME, label: 'Dashboard', icon: Home, group: 'Main' },
    { id: AppView.PRAYER, label: 'Prayer Times', icon: Clock, group: 'Main' },
    { id: AppView.QURAN, label: 'Quran AI', icon: BookOpen, group: 'Knowledge' },
    { id: AppView.HADEES, label: 'Hadees AI', icon: Book, group: 'Knowledge' },
    { id: AppView.UNIFIED, label: 'Search', icon: Search, group: 'Knowledge' },
    { id: AppView.CHAT, label: 'Scholar Chat', icon: MessageCircle, group: 'Assistant' },
    { id: AppView.LIVE, label: 'Live Scholar', icon: Mic, group: 'Assistant' },
    { id: AppView.TASBIH, label: 'Smart Tasbih', icon: RotateCcw, group: 'Spiritual' },
    { id: AppView.NAMES, label: '99 Names', icon: Heart, group: 'Spiritual' },
    { id: AppView.DUA, label: 'Dua Gen', icon: Sparkles, group: 'Spiritual' },
    { id: AppView.DREAM, label: 'Dream Interpret', icon: Moon, group: 'Tools' },
    { id: AppView.ZAKAT, label: 'Zakat Calc', icon: Calculator, group: 'Tools' },
    { id: AppView.QUIZ, label: 'Quiz', icon: HelpCircle, group: 'Tools' },
    { id: AppView.MEDIA, label: 'Media Studio', icon: Video, group: 'Creative' },
    { id: AppView.THUMBNAIL, label: 'Thumbnails', icon: Image, group: 'Creative' },
    { id: AppView.FINDER, label: 'Halal Finder', icon: MapPin, group: 'Tools' },
    { id: AppView.ABOUT, label: 'About Us', icon: Info, group: 'General' },
    { id: AppView.CONTACT, label: 'Contact', icon: Mail, group: 'General' },
  ];

  const renderView = () => {
    switch (view) {
      case AppView.HOME:
        return (
          <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Assalamu Alaykum, {user ? user.name : 'Guest'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Exclusive Spiritual Hub for ZestIslam.</p>
                </div>
            </div>
            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                     <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-1 shadow-sm border border-slate-100 dark:border-slate-800"><PrayerTimes /></div>
                     <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg min-h-[200px] flex flex-col justify-center group">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                         <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Daily Wisdom</h2>
                         {dailyInspiration ? (
                             <div className="animate-fade-in relative z-10">
                                <p className="text-2xl md:text-3xl font-serif leading-relaxed text-slate-100 mb-6">"{dailyInspiration.text}"</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dailyInspiration.source}</p>
                             </div>
                         ) : <div className="animate-pulse h-20 bg-white/10 rounded-2xl w-full"></div>}
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-2">Quick Access</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { view: AppView.TASBIH, title: 'Smart Tasbih', desc: 'Dhikr Counter', color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30', icon: RotateCcw },
                            { view: AppView.NAMES, title: '99 Names', desc: 'Divine Names', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30', icon: Heart },
                            { view: AppView.QUIZ, title: 'Islamic Quiz', desc: 'Test Knowledge', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30', icon: HelpCircle },
                        ].map((item) => (
                            <button key={item.view} onClick={() => setView(item.view)} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group text-left">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}><item.icon className="w-6 h-6" /></div>
                                <div className="min-w-0"><h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4><p className="text-[10px] text-slate-400 truncate uppercase font-bold">{item.desc}</p></div>
                                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-emerald-500" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        );
      case AppView.LOGIN:
          return (
              <div className="max-w-md mx-auto py-12 px-4">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                      <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4"><User className="w-8 h-8" /></div>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{loginMode === 'login' ? 'Sign In' : loginMode === 'signup' ? 'Create Account' : 'Reset Password'}</h2>
                      </div>
                      <form onSubmit={handleAuth} className="space-y-4">
                          {loginMode === 'signup' && ( <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none" placeholder="Name" /> )}
                          <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none" placeholder="Email" />
                          {loginMode !== 'forgot' && ( <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none" placeholder="Password" /> )}
                          <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50">{authLoading ? '...' : (loginMode === 'login' ? 'Sign In' : 'Join Now')}</button>
                      </form>
                      <button onClick={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-xs font-bold text-slate-400 uppercase hover:text-emerald-500">{loginMode === 'login' ? "Need an account?" : "Already a member?"}</button>
                      {authError && <p className="mt-4 text-xs text-red-500 text-center font-bold">{authError}</p>}
                      {authSuccess && <p className="mt-4 text-xs text-emerald-500 text-center font-bold">{authSuccess}</p>}
                  </div>
              </div>
          );
      case AppView.QURAN: return <QuranSearch />;
      case AppView.HADEES: return <HadeesSearch />;
      case AppView.UNIFIED: return <UnifiedSearch />;
      case AppView.CHAT: return <IslamicChat user={user} onLoginClick={() => setView(AppView.LOGIN)} />;
      case AppView.DUA: return <DuaGenerator />;
      case AppView.THUMBNAIL: return <ThumbnailGenerator />;
      case AppView.MEDIA: return <MediaStudio />;
      case AppView.FINDER: return <HalalFinder />;
      case AppView.LIVE: return <LiveScholar />;
      case AppView.TASBIH: return <TasbihCounter />;
      case AppView.NAMES: return <NamesOfAllah />;
      case AppView.DREAM: return <DreamInterpreter />;
      case AppView.ZAKAT: return <ZakatCalculator />;
      case AppView.QUIZ: return <IslamicQuiz />;
      case AppView.ABOUT:
        return (
            <div className="max-w-3xl mx-auto space-y-12 py-8 px-4">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl"><Sparkles className="w-10 h-10" /></div>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">About ZestIslam</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">Your modern Islamic companion bridging tradition and technology, exclusively powered by Gemini AI.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6 text-center">
                    <a href="https://www.youtube.com/@zestislam" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:shadow-lg transition-shadow font-bold"><Youtube className="w-8 h-8 text-red-600" />YouTube</a>
                    <a href="https://www.instagram.com/zest_islam/" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:shadow-lg transition-shadow font-bold"><Instagram className="w-8 h-8 text-pink-600" />Instagram</a>
                </div>
            </div>
        );
      case AppView.CONTACT:
        return (
            <div className="max-w-3xl mx-auto py-8 px-4">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-2xl mb-6">Support & Feedback</h3>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAuthSuccess("Message processed."); setTimeout(()=>setAuthSuccess(null), 3000); }}>
                        <input type="text" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none" placeholder="Name" required />
                        <input type="email" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none" placeholder="Email" required />
                        <textarea className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none h-32" placeholder="Message..." required />
                        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">Send Message</button>
                    </form>
                    {authSuccess && <p className="mt-4 text-emerald-500 font-bold text-center">JazakAllah, Message sent!</p>}
                </div>
            </div>
        );
      case AppView.PRAYER: return <div className="max-w-2xl mx-auto py-8 px-4"><PrayerTimes /></div>;
      case AppView.UPDATE_PASSWORD:
          return (
              <div className="max-w-md mx-auto py-12 px-4">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                      <h2 className="text-2xl font-bold mb-8">Set New Password</h2>
                      <form onSubmit={async (e) => { e.preventDefault(); setAuthLoading(true); await updateUserPassword(authForm.password); setAuthLoading(false); setAuthSuccess("Updated!"); setTimeout(() => setView(AppView.HOME), 2000); }} className="space-y-4">
                            <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none" placeholder="New Password" minLength={6} />
                          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">Update Password</button>
                      </form>
                  </div>
              </div>
          );
      default: return null;
    }
  };

  const groupedNav = navItems.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item); return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex font-sans transition-colors duration-300">
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-30">
        <div className="p-8 pb-4">
            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-500 mb-8 cursor-pointer" onClick={() => setView(AppView.HOME)}>
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles className="w-6 h-6" /></div>
                <div><h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">ZestIslam</h1></div>
            </div>
        </div>
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-4 custom-scrollbar">
            {Object.entries(groupedNav).map(([group, items]) => (
                <div key={group}>
                    <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group}</h3>
                    <div className="space-y-1">
                        {items.map((item) => (
                            <button key={item.id} onClick={() => { setView(item.id); window.scrollTo(0,0); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <item.icon className={`w-5 h-5 ${view === item.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className="text-sm">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                {user ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden"><div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div><p className="text-xs font-bold truncate">{user.name}</p></div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
                    </div>
                ) : <button onClick={() => setView(AppView.LOGIN)} className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-emerald-600 hover:bg-white rounded-lg transition-colors">Sign In</button>}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl flex items-center justify-center gap-2 mb-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gemini 3 Flash</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
                <button onClick={() => setView(AppView.CONTACT)} className="flex items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"><Mail className="w-4 h-4" /></button>
            </div>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2 text-emerald-700" onClick={() => setView(AppView.HOME)}><Sparkles className="w-5 h-5" /><span className="font-bold text-lg">ZestIslam</span></div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600"><Menu className="w-6 h-6" /></button>
      </div>

      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col animate-fade-in-left">
                  <div className="flex justify-between items-center mb-8"><h2 className="font-bold text-xl">Menu</h2><button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X className="w-5 h-5" /></button></div>
                  <nav className="flex-1 overflow-y-auto space-y-1">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => { setView(item.id); setMobileMenuOpen(false); window.scrollTo(0,0); }} className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all ${view === item.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><item.icon className="w-5 h-5" /><span>{item.label}</span></button>
                    ))}
                  </nav>
              </div>
          </div>
      )}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 pt-24 lg:pt-8 min-h-screen transition-all">{renderView()}</main>
    </div>
  );
};

export default App;
