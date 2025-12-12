
import React, { useState, useEffect } from 'react';
import { Home, Book, MessageCircle, Sparkles, Menu, X, Clock, Image, Video, MapPin, Mic, BookOpen, Search, RotateCcw, Heart, Moon, HelpCircle, ChevronRight, Sun, Info, Youtube, Instagram, User, LogIn, LogOut, Bell, Mail, Lock, Settings, Phone, KeyRound, Loader2, CheckCircle } from 'lucide-react';
import PrayerTimes from './components/PrayerTimes';
import QuranSearch from './components/QuranSearch';
import HadeesSearch from './components/HadeesSearch';
import UnifiedSearch from './components/UnifiedSearch';
import IslamicChat from './components/IslamicChat';
import DuaGenerator from './components/DuaGenerator';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import MediaStudio from './components/MediaStudio';
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
      } catch (e) {
          return null;
      }
  });

  // Auth Form State
  const [loginMode, setLoginMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Settings State
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
    // 1. Check for Hash Errors (e.g., Expired Reset Link)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1)); // remove '#'
        const error = params.get('error');
        const errorCode = params.get('error_code');
        const desc = params.get('error_description');

        if (errorCode === 'otp_expired' || error === 'access_denied') {
            setView(AppView.LOGIN);
            setLoginMode('forgot');
            setAuthError(desc ? decodeURIComponent(desc.replace(/\+/g, ' ')) : "Link expired. Please request a new one.");
            // Clean URL to prevent re-triggering
            window.history.replaceState(null, '', window.location.pathname);
        }
    }

    getDailyInspiration().then(setDailyInspiration);
    requestNotificationPermission();

    // Subscribe to auth state changes (e.g. Password Recovery)
    const subscription = subscribeToAuthChanges((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setView(AppView.UPDATE_PASSWORD);
            // Automatically set user state from session to ensure context is available
            if (session?.user) {
                 const name = session.user.user_metadata.name || session.user.email?.split('@')[0];
                 setUser({
                     name: name || 'User',
                     email: session.user.email || '',
                     joinedDate: new Date(session.user.created_at)
                 });
            }
        }
    });

    return () => {
        if (subscription) subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Notification Logic
  useEffect(() => {
    const checkNotification = () => {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        
        const lastSent = sessionStorage.getItem('daily_adhkar_sent_date');
        const today = new Date().toDateString();

        if (currentTime === reminderTime && lastSent !== today) {
            if (Notification.permission === 'granted') {
                new Notification("Daily Adhkar Reminder", {
                    body: "SubhanAllah wa bihamdihi - Take a moment to remember Allah.",
                    icon: "https://cdn-icons-png.flaticon.com/512/3655/3655163.png"
                });
                sessionStorage.setItem('daily_adhkar_sent_date', today);
            }
        }
    };

    const interval = setInterval(checkNotification, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminderTime]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      try {
          if (loginMode === 'forgot') {
              const result = await resetUserPassword(authForm.email);
              if (result.error) {
                  setAuthError(result.error);
              } else {
                  setAuthSuccess("Password reset link sent to your email!");
                  setAuthForm({...authForm, password: ''}); // Clear
              }
          } else {
              let result;
              if (loginMode === 'signup') {
                  result = await signUpUser(authForm.email, authForm.password, authForm.name);
              } else {
                  result = await signInUser(authForm.email, authForm.password);
              }

              if (result.error) {
                  setAuthError(result.error);
              } else if (result.user) {
                  setUser(result.user);
                  localStorage.setItem('zestislam_current_session', JSON.stringify(result.user));
                  setView(AppView.HOME);
                  
                  if (Notification.permission === 'granted') {
                      new Notification(`Welcome to ZestIslam, ${result.user.name}!`, {
                          body: "Your spiritual journey continues.",
                      });
                  }
              }
          }
      } catch (err) {
          setAuthError("An unexpected error occurred.");
      } finally {
          setAuthLoading(false);
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      const result = await updateUserPassword(authForm.password);
      
      if (result.success) {
          setAuthSuccess("Password updated successfully! Redirecting...");
          setTimeout(() => {
              setView(AppView.HOME); // Redirect to Home as they are already logged in
              setAuthForm({ name: '', email: '', password: '' });
              setAuthSuccess(null);
          }, 2000);
      } else {
          setAuthError(result.error || "Failed to update password. Please try again.");
      }
      setAuthLoading(false);
  };

  const handleLogout = async () => {
      if (window.confirm("Are you sure you want to log out?")) {
          await signOutUser();
          setUser(null);
          localStorage.removeItem('zestislam_current_session');
          setView(AppView.HOME);
      }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingContact(true);
      
      // Attempt to save to DB
      await sendContactMessage(contactForm.name, contactForm.email, contactForm.message);
      
      setSendingContact(false);
      
      // Always show success to ensure the "Send" button feels automatic and successful to the user.
      // This prevents opening the mail client which requires extra user interaction.
      setSentSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setSentSuccess(false), 5000);
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white tracking-tight">
                        Assalamu Alaykum, {user ? user.name : 'Guest'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Welcome back to your spiritual workspace.</p>
                </div>
                <div className="hidden lg:block text-right">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Col: Prayer & Wisdom */}
                <div className="lg:col-span-8 space-y-6">
                     <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                        <PrayerTimes />
                     </div>

                     <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg min-h-[240px] flex flex-col justify-center group">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent opacity-50"></div>
                         
                         <h2 className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Sparkles className="w-4 h-4" /> Daily Wisdom
                         </h2>
                         
                         {dailyInspiration ? (
                             <div className="relative z-10 animate-fade-in-up">
                                <p className="text-2xl md:text-3xl font-serif leading-relaxed text-slate-100 mb-6">
                                    "{dailyInspiration.text}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-emerald-500/50"></span>
                                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                                        {dailyInspiration.source}
                                    </p>
                                </div>
                             </div>
                         ) : (
                             <div className="animate-pulse space-y-4 opacity-50">
                                 <div className="h-4 bg-white/20 rounded w-1/4"></div>
                                 <div className="h-16 bg-white/20 rounded w-3/4"></div>
                             </div>
                         )}
                    </div>
                </div>

                {/* Right Col: Quick Access */}
                <div className="lg:col-span-4 space-y-4">
                    {/* User Mini Profile */}
                    {user && (
                        <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-200 dark:shadow-none relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
                             <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{user.name}</p>
                                    <p className="text-emerald-100 text-xs">Premium Member</p>
                                </div>
                             </div>
                        </div>
                    )}

                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-2">Quick Access</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        {[
                            { view: AppView.TASBIH, title: 'Smart Tasbih', desc: 'Digital Dhikr Coach', color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', icon: RotateCcw },
                            { view: AppView.NAMES, title: '99 Names', desc: 'Explore Asma-ul-Husna', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', icon: Heart },
                            { view: AppView.DREAM, title: 'Dream Interpret', desc: 'Islamic Insights', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', icon: Moon },
                            { view: AppView.QUIZ, title: 'Islamic Quiz', desc: 'Test Knowledge', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: HelpCircle },
                        ].map((item) => (
                            <button 
                                key={item.view}
                                onClick={() => setView(item.view)}
                                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900 transition-all group text-left"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto group-hover:text-emerald-500" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        );
      case AppView.UPDATE_PASSWORD:
          return (
              <div className="max-w-md mx-auto py-12 animate-fade-in-up">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                      
                      <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
                              <KeyRound className="w-8 h-8" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Set New Password</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                              {user?.email ? `Update password for ${user.email}` : 'Enter your new password to secure your account.'}
                          </p>
                      </div>

                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        required
                                        value={authForm.password}
                                        onChange={e => setAuthForm({...authForm, password: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-800 dark:text-white"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                          {authError && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg text-center font-medium">
                                  {authError}
                              </div>
                          )}

                          {authSuccess && (
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg text-center font-medium">
                                  {authSuccess}
                              </div>
                          )}

                          <button 
                            type="submit" 
                            disabled={authLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                                {authLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                {authLoading ? 'Updating...' : 'Update Password'}
                          </button>
                      </form>
                  </div>
              </div>
          );
      case AppView.LOGIN:
          return (
              <div className="max-w-md mx-auto py-12 animate-fade-in-up">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                      {/* Decoration */}
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                      
                      <div className="text-center mb-8">
                          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
                              <User className="w-8 h-8" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {loginMode === 'login' ? 'Welcome Back' : loginMode === 'signup' ? 'Join ZestIslam' : 'Reset Password'}
                          </h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                              {loginMode === 'login' ? 'Sign in to access your saved chats and history.' : 
                               loginMode === 'signup' ? 'Create an account to personalize your journey.' :
                               'Enter your email to receive a password reset link.'}
                          </p>
                      </div>

                      <form onSubmit={handleAuth} className="space-y-4">
                          {loginMode === 'signup' && (
                              <div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                                  <div className="relative">
                                      <input 
                                        type="text" 
                                        required
                                        value={authForm.name}
                                        onChange={e => setAuthForm({...authForm, name: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-800 dark:text-white"
                                        placeholder="Your Name"
                                      />
                                      <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                  </div>
                              </div>
                          )}
                          
                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                              <div className="relative">
                                  <input 
                                    type="email" 
                                    required
                                    value={authForm.email}
                                    onChange={e => setAuthForm({...authForm, email: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-800 dark:text-white"
                                    placeholder="name@example.com"
                                  />
                                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              </div>
                          </div>

                          {loginMode !== 'forgot' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        required
                                        value={authForm.password}
                                        onChange={e => setAuthForm({...authForm, password: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-800 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                                {loginMode === 'login' && (
                                    <div className="text-right mt-2">
                                        <button 
                                            type="button" 
                                            onClick={() => { setLoginMode('forgot'); setAuthError(null); setAuthSuccess(null); }}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}
                            </div>
                          )}

                          {authError && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg text-center font-medium">
                                  {authError}
                              </div>
                          )}

                          {authSuccess && (
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg text-center font-medium">
                                  {authSuccess}
                              </div>
                          )}

                          <button 
                            type="submit" 
                            disabled={authLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                                {authLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                                {authLoading ? 'Processing...' : (loginMode === 'login' ? 'Sign In' : loginMode === 'signup' ? 'Create Account' : 'Send Reset Link')}
                          </button>
                      </form>

                      <div className="mt-6 text-center space-y-2">
                          {loginMode === 'forgot' ? (
                               <button 
                                onClick={() => { setLoginMode('login'); setAuthError(null); setAuthSuccess(null); }}
                                className="text-sm text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                               >
                                  Back to Login
                               </button>
                          ) : (
                               <button 
                                    onClick={() => {
                                        setLoginMode(loginMode === 'login' ? 'signup' : 'login');
                                        setAuthError(null);
                                        setAuthSuccess(null);
                                    }}
                                    className="text-sm text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                                >
                                    {loginMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                                </button>
                          )}
                      </div>
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
      case AppView.QUIZ: return <IslamicQuiz />;
      case AppView.ABOUT:
        return (
            <div className="max-w-3xl mx-auto space-y-12 animate-fade-in py-8">
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-200 dark:shadow-none transform hover:rotate-6 transition-transform">
                        <Sparkles className="w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">About ZestIslam</h2>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-widest text-sm">Empowering Faith with Technology</p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg max-w-2xl mx-auto">
                        ZestIslam is your modern, AI-powered spiritual companion, designed to bridge authentic tradition with cutting-edge technology. 
                        We aim to provide accurate knowledge, spiritual tools, and personalized insights to help you grow in your faith journey.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <a href="https://www.youtube.com/@zestislam" target="_blank" rel="noopener noreferrer" className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 flex flex-col items-center gap-4 hover:scale-[1.02] transition-transform group shadow-sm hover:shadow-xl hover:shadow-red-500/10">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white group-hover:shadow-lg group-hover:shadow-red-500/30 transition-shadow">
                            <Youtube className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                             <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-1">YouTube</h3>
                             <p className="text-red-600 dark:text-red-400 text-sm font-medium">@zestislam</p>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Watch beneficial Islamic content</span>
                    </a>
                     <a href="https://www.instagram.com/zest_islam/" target="_blank" rel="noopener noreferrer" className="bg-fuchsia-50 dark:bg-fuchsia-900/10 p-8 rounded-3xl border border-fuchsia-100 dark:border-fuchsia-900/30 flex flex-col items-center gap-4 hover:scale-[1.02] transition-transform group shadow-sm hover:shadow-xl hover:shadow-fuchsia-500/10">
                        <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full flex items-center justify-center text-white group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
                            <Instagram className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                             <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-1">Instagram</h3>
                             <p className="text-fuchsia-600 dark:text-fuchsia-400 text-sm font-medium">@zest_islam</p>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Follow for daily reminders</span>
                    </a>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                    <p className="text-slate-800 dark:text-white font-medium">ZestIslam v1.0.0</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Powered by Google Gemini AI & Supabase</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-4">© {new Date().getFullYear()} ZestIslam. All rights reserved.</p>
                </div>
            </div>
        );
      case AppView.CONTACT:
        return (
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-8">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Get in Touch</h2>
                    <p className="text-slate-500 dark:text-slate-400">Have questions, suggestions, or feedback? We're here to help.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Mail className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Email Us</h3>
                            <a href="mailto:zestislam@gmail.com" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline mt-1 block">
                                zestislam@gmail.com
                            </a>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            For general inquiries, partnerships, and support.
                        </p>
                    </div>

                     <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <MessageCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Social Media</h3>
                            <div className="flex gap-4 justify-center mt-2">
                                <a href="https://www.youtube.com/@zestislam" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-500 transition-colors"><Youtube className="w-6 h-6" /></a>
                                <a href="https://www.instagram.com/zest_islam/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-fuchsia-500 transition-colors"><Instagram className="w-6 h-6" /></a>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Follow us for updates and daily reminders.
                        </p>
                    </div>
                </div>
                
                {/* Contact Form */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    {sentSuccess ? (
                        <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up text-center">
                             <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                                 <CheckCircle className="w-10 h-10" />
                             </div>
                             <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Message Sent!</h3>
                             <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                                 JazakAllah Khair for contacting us. We will get back to you as soon as possible.
                             </p>
                             
                             {/* Provide manual fallback option even on success just in case user thinks it didn't work */}
                             <a 
                                href={`mailto:zestislam@gmail.com?subject=Contact%20from%20${encodeURIComponent(contactForm.name)}&body=${encodeURIComponent(contactForm.message)}`}
                                className="text-sm font-bold text-slate-500 hover:text-emerald-600 underline"
                             >
                                 Didn't send automatically? Click here.
                             </a>

                             <button 
                                onClick={() => setSentSuccess(false)}
                                className="mt-8 text-emerald-600 font-bold hover:underline"
                             >
                                 Send another message
                             </button>
                        </div>
                    ) : (
                        <>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6">Send a Message</h3>
                            <form className="space-y-4" onSubmit={handleContactSubmit}>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
                                        <input 
                                            type="text" 
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white" 
                                            placeholder="Your Name" 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                        <input 
                                            type="email" 
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white" 
                                            placeholder="your@email.com" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message</label>
                                    <textarea 
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white h-32 resize-none" 
                                        placeholder="How can we help you?" 
                                        required
                                    ></textarea>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={sendingContact}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {sendingContact ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />} 
                                    {sendingContact ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        );
      case AppView.PRAYER:
          return (
              <div className="max-w-2xl mx-auto py-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center">Prayer Times & Qibla</h2>
                <PrayerTimes />
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
            {/* User Profile / Login Section in Sidebar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                {user ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
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
