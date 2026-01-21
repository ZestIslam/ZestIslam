
import React, { useState, useEffect } from 'react';
import { Home, Book, MessageCircle, Sparkles, Menu, X, Clock, MapPin, Mic, BookOpen, Search, RotateCcw, Heart, Moon, HelpCircle, ChevronRight, Sun, Info, Youtube, Instagram, User, LogIn, LogOut, Bell, Mail, Lock, Settings, KeyRound, Loader2, CheckCircle } from 'lucide-react';
import PrayerTimes from './components/PrayerTimes';
import QuranSearch from './components/QuranSearch';
import HadeesSearch from './components/HadeesSearch';
import UnifiedSearch from './components/UnifiedSearch';
import IslamicChat from './components/IslamicChat';
import DuaGenerator from './components/DuaGenerator';
import HalalFinder from './components/HalalFinder';
import LiveScholar from './components/LiveScholar';
import TasbihCounter from './components/TasbihCounter';
import NamesOfAllah from './components/NamesOfAllah';
import DreamInterpreter from './components/DreamInterpreter';
import IslamicQuiz from './components/IslamicQuiz';
import { AppView, UserProfile } from './types';
import { getDailyInspiration } from './services/geminiService';
import { signInUser, signUpUser, signOutUser, resetUserPassword, sendContactMessage, updateUserPassword, subscribeToAuthChanges } from './services/userService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dailyInspiration, setDailyInspiration] = useState<{type: string, text: string, source: string} | null>(null);
  
  // Auth State
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
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('zestislam_reminder_time') || '09:00');

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorCode = params.get('error_code');
        if (errorCode === 'otp_expired') {
            setView(AppView.LOGIN); setLoginMode('forgot'); setAuthError("Link expired.");
            window.history.replaceState(null, '', window.location.pathname);
        }
    }
    getDailyInspiration().then(setDailyInspiration);
    requestNotificationPermission();
    const subscription = subscribeToAuthChanges((event, session) => {
        if (event === 'PASSWORD_RECOVERY') setView(AppView.UPDATE_PASSWORD);
    });
    return () => { if (subscription) subscription.unsubscribe(); }
  }, []);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    const checkNotification = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const lastSent = sessionStorage.getItem('daily_adhkar_sent_date');
        if (currentTime === reminderTime && lastSent !== new Date().toDateString()) {
            if (Notification.permission === 'granted') {
                new Notification("Daily Adhkar", { body: "Take a moment for remembrance." });
                sessionStorage.setItem('daily_adhkar_sent_date', new Date().toDateString());
            }
        }
    };
    const interval = setInterval(checkNotification, 60000);
    return () => clearInterval(interval);
  }, [reminderTime]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === 'default') await Notification.requestPermission();
  };

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

  const handleSaveSettings = () => {
      localStorage.setItem('zestislam_reminder_time', reminderTime);
      setShowSettings(false);
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
    { id: AppView.QUIZ, label: 'Quiz', icon: HelpCircle, group: 'Tools' },
    { id: AppView.FINDER, label: 'Halal Finder', icon: MapPin, group: 'Tools' },
    { id: AppView.ABOUT, label: 'About Us', icon: Info, group: 'General' },
    { id: AppView.CONTACT, label: 'Contact', icon: Mail, group: 'General' },
  ];

  const renderView = () => {
    switch (view) {
      case AppView.HOME:
        return (
          <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">Assalamu Alaykum, {user ? user.name : 'Guest'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your spiritual companion for today.</p>
                </div>
            </div>
            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                     <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-1 shadow-sm border border-slate-100 dark:border-slate-800"><PrayerTimes /></div>
                     <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg min-h-[200px] flex flex-col justify-center">
                         <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Daily Wisdom</h2>
                         {dailyInspiration ? (
                             <div className="animate-fade-in">
                                <p className="text-2xl md:text-3xl font-serif leading-relaxed text-slate-100 mb-6">"{dailyInspiration.text}"</p>
                                <div className="flex items-center gap-3"><span className="w-8 h-[1px] bg-emerald-500/50"></span><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dailyInspiration.source}</p></div>
                             </div>
                         ) : <div className="animate-pulse h-20 bg-white/10 rounded-2xl w-full"></div>}
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-2">Spiritual Progress</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { view: AppView.TASBIH, title: 'Smart Tasbih', desc: 'Dhikr Counter', color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30', icon: RotateCcw },
                            { view: AppView.NAMES, title: '99 Names', desc: 'Divine Names', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30', icon: Heart },
                            { view: AppView.QUIZ, title: 'Islamic Quiz', desc: 'Test Knowledge', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30', icon: HelpCircle },
                        ].map((item) => (
                            <button key={item.view} onClick={() => setView(item.view)} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group text-left">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}><item.icon className="w-6 h-6" /></div>
                                <div className="min-w-0"><h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4><p className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-bold">{item.desc}</p></div>
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
              <div className="max-w-md mx-auto py-12">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                      <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4"><User className="w-8 h-8" /></div>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{loginMode === 'login' ? 'Sign In' : loginMode === 'signup' ? 'Create Account' : 'Reset Password'}</h2>
                      </div>
                      <form onSubmit={handleAuth} className="space-y-4">
                          {loginMode === 'signup' && (
                              <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm" placeholder="Your Name" />
                          )}
                          <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm" placeholder="Email Address" />
                          {loginMode !== 'forgot' && (
                              <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm" placeholder="Password" />
                          )}
                          {authError && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center">{authError}</div>}
                          {authSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg text-center">{authSuccess}</div>}
                          <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50">
                              {authLoading ? '...' : (loginMode === 'login' ? 'Enter Dashboard' : 'Join Now')}
                          </button>
                      </form>
                      <button onClick={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-500">
                          {loginMode === 'login' ? "Need an account?" : "Already a member?"}
                      </button>
                  </div>
              </div>
          );
      case AppView.QURAN: return <QuranSearch />;
      case AppView.HADEES: return <HadeesSearch />;
      case AppView.UNIFIED: return <UnifiedSearch />;
      case AppView.CHAT: return <IslamicChat user={user} onLoginClick={() => setView(AppView.LOGIN)} />;
      case AppView.DUA: return <DuaGenerator />;
      case AppView.FINDER: return <HalalFinder />;
      case AppView.LIVE: return <LiveScholar />;
      case AppView.TASBIH: return <TasbihCounter />;
      case AppView.NAMES: return <NamesOfAllah />;
      case AppView.DREAM: return <DreamInterpreter />;
      case AppView.QUIZ: return <IslamicQuiz />;
      case AppView.ABOUT:
        return (
            <div className="max-w-3xl mx-auto space-y-12 py-8">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl"><Sparkles className="w-10 h-10" /></div>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white font-serif">About ZestIslam</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">Your modern Islamic companion bridging tradition and technology.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6 text-center">
                    <a href="https://www.youtube.com/@zestislam" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:scale-105 transition-transform"><Youtube className="w-8 h-8 text-red-600" /><span className="font-bold">YouTube</span></a>
                    <a href="https://www.instagram.com/zest_islam/" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:scale-105 transition-transform"><Instagram className="w-8 h-8 text-pink-600" /><span className="font-bold">Instagram</span></a>
                </div>
            </div>
        );
      case AppView.CONTACT:
        return (
            <div className="max-w-3xl mx-auto py-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-2xl text-slate-800 dark:text-white mb-6 font-serif">Support & Feedback</h3>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSentSuccess(true); }}>
                        <input type="text" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm" placeholder="Your Name" required />
                        <input type="email" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm" placeholder="Email" required />
                        <textarea className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm h-32" placeholder="Message..." required />
                        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform">Send Message</button>
                    </form>
                    {sentSuccess && <p className="mt-4 text-emerald-500 font-bold text-center">Message sent successfully!</p>}
                </div>
            </div>
        );
      case AppView.PRAYER: return <div className="max-w-2xl mx-auto py-8"><PrayerTimes /></div>;
      case AppView.UPDATE_PASSWORD:
          return (
              <div className="max-w-md mx-auto py-12 animate-fade-in-up">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                      <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4"><KeyRound className="w-8 h-8" /></div>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Set New Password</h2>
                      </div>
                      <form onSubmit={async (e) => { e.preventDefault(); setAuthLoading(true); await updateUserPassword(authForm.password); setAuthLoading(false); setAuthSuccess("Password updated!"); setTimeout(() => setView(AppView.HOME), 2000); }} className="space-y-4">
                            <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-sm" placeholder="New Password" minLength={6} />
                          {authSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg text-center">{authSuccess}</div>}
                          <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">
                                {authLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                {authLoading ? 'Updating...' : 'Update Password'}
                          </button>
                      </form>
                  </div>
              </div>
          );
      default: return null;
    }
  };

  const groupedNav = navItems.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex font-sans transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-30">
        <div className="p-8 pb-4">
            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-500 mb-8">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">ZestIslam</h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">AI Companion</p>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-4 custom-scrollbar">
            {Object.entries(groupedNav).map(([group, items]) => (
                <div key={group}>
                    <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group}</h3>
                    <div className="space-y-1">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                    view === item.id 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${view === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                                <span>{item.label}</span>
                                {view === item.id && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400" />}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                {user ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase">
                                {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500" title="Logout">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setView(AppView.LOGIN)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogIn className="w-4 h-4" /> Sign In
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-xs"
                    title="Toggle Theme"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium text-xs"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Settings</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Daily Adhkar Time</label>
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                              <Clock className="w-5 h-5 text-emerald-500" />
                              <input 
                                type="time" 
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white font-bold text-lg w-full"
                              />
                          </div>
                      </div>

                      <div className="pt-4">
                          <button 
                            onClick={handleSaveSettings}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                          >
                              Save Preferences
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
             <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">ZestIslam</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-600 dark:text-slate-300">
                 {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
                <Menu className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col animate-fade-in-left">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="font-bold text-xl text-slate-800 dark:text-white">Menu</h2>
                      <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <nav className="flex-1 overflow-y-auto space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setView(item.id); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all ${
                                view === item.id 
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                  </nav>
                  
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      {user ? (
                           <div className="flex items-center gap-3 mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-xs text-red-500 hover:underline">Logout</button>
                                </div>
                           </div>
                      ) : (
                          <button 
                            onClick={() => { setView(AppView.LOGIN); setMobileMenuOpen(false); }}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold"
                          >
                              Sign In
                          </button>
                      )}
                      
                      <button onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2">
                          <Settings className="w-4 h-4" /> Settings
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 pt-24 lg:pt-8 min-h-screen transition-all">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
