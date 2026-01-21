
import React, { useEffect, useState, useCallback } from 'react';
import { PrayerTimeData, GeoLocation } from '../types';
import { MapPin, Loader2, Moon, Sun, Sunrise, Sunset, Compass, Calendar, ArrowUp, Bell, BellOff, Settings2, X, ChevronRight } from 'lucide-react';

const CALC_METHODS = [
    { id: 3, name: 'Muslim World League' },
    { id: 2, name: 'ISNA (North America)' },
    { id: 5, name: 'Egypt (General Authority)' },
    { id: 4, name: 'Umm Al-Qura, Makkah' },
    { id: 1, name: 'Univ. Islamic Sciences, Karachi' },
    { id: 13, name: 'Diyanet, Turkey' },
    { id: 11, name: 'Singapore (MUIS)' },
    { id: 12, name: 'France (UOIF)' },
    { id: 8, name: 'Gulf Region' },
    { id: 9, name: 'Kuwait' },
    { id: 10, name: 'Qatar' }
];

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData | null>(null);
  const [hijriDate, setHijriDate] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Locating...');
  const [qibla, setQibla] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Advanced Config State
  const [school, setSchool] = useState(() => Number(localStorage.getItem('zestislam_prayer_school')) || 0); // 0 Standard, 1 Hanafi
  const [method, setMethod] = useState(() => Number(localStorage.getItem('zestislam_prayer_method')) || 2); // 2 ISNA default
  
  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
      return localStorage.getItem('zestislam_prayer_notifications') === 'true';
  });

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const date = new Date();
      // Added school and method params
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        setTimes(data.data.timings);
        const h = data.data.date.hijri;
        setHijriDate(`${h.day} ${h.month.en} ${h.year}`);
        setCity(`${lat.toFixed(2)}, ${lng.toFixed(2)}`); 
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [method, school]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
        setLocation(coords);
        calculateQibla(coords.latitude, coords.longitude);
        fetchPrayerTimes(coords.latitude, coords.longitude);
      },
      (err) => {
        setError('Please enable location access');
        setLoading(false);
      }
    );
  }, [fetchPrayerTimes]);

  // Re-fetch when settings change
  useEffect(() => {
      if (location) {
          fetchPrayerTimes(location.latitude, location.longitude);
      }
      localStorage.setItem('zestislam_prayer_school', school.toString());
      localStorage.setItem('zestislam_prayer_method', method.toString());
  }, [school, method, location, fetchPrayerTimes]);

  const toggleNotifications = async () => {
      if (!("Notification" in window)) {
          alert("This browser does not support notifications");
          return;
      }
      if (!notificationsEnabled) {
          let permission = Notification.permission;
          if (permission === 'default') permission = await Notification.requestPermission();
          if (permission === 'granted') {
              setNotificationsEnabled(true);
              localStorage.setItem('zestislam_prayer_notifications', 'true');
          } else if (permission === 'denied') {
              alert("Enable notifications in browser settings.");
          }
      } else {
          setNotificationsEnabled(false);
          localStorage.setItem('zestislam_prayer_notifications', 'false');
      }
  };

  const calculateQibla = (lat1: number, lon1: number) => {
      const lat2 = 21.422487; const lon2 = 39.826206;
      const toRad = (deg: number) => deg * Math.PI / 180;
      const toDeg = (rad: number) => rad * 180 / Math.PI;
      const phi1 = toRad(lat1); const phi2 = toRad(lat2);
      const deltaLambda = toRad(lon2 - lon1);
      const y = Math.sin(deltaLambda) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
      let bearing = toDeg(Math.atan2(y, x));
      setQibla((bearing + 360) % 360);
  };

  const getNextPrayer = (timings: PrayerTimeData): string => {
    const now = new Date();
    const timeToDate = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const d = new Date(); d.setHours(hours, minutes, 0, 0); return d;
    };
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayer of prayers) {
        if (timeToDate(timings[prayer]) > now) return prayer;
    }
    return 'Fajr';
  };

  if (error) return <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl text-center"><MapPin className="w-4 h-4 mx-auto mb-1" />{error}</div>;
  if (loading || !times) return <div className="h-48 flex flex-col items-center justify-center text-emerald-600 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculating Times...</span></div>;

  const nextPrayer = getNextPrayer(times);

  return (
    <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-all duration-700"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">Next Prayer</span>
                    </div>
                    <p className="text-5xl font-bold tracking-tight font-serif">{nextPrayer}</p>
                    <p className="text-emerald-200 text-xl opacity-90 mt-2 font-mono">{times[nextPrayer]}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2">
                         <button onClick={() => setShowSettings(true)} className="p-3 rounded-2xl backdrop-blur-md transition-all border bg-white/10 text-slate-300 border-white/10 hover:bg-white/20" title="Settings"><Settings2 className="w-5 h-5" /></button>
                         <button onClick={toggleNotifications} className={`p-3 rounded-2xl backdrop-blur-md transition-all border ${notificationsEnabled ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20'}`} title="Adhan Alerts">{notificationsEnabled ? <Bell className="w-5 h-5 fill-current" /> : <BellOff className="w-5 h-5" />}</button>
                    </div>
                    <div className="text-right">
                         {hijriDate && <div className="flex items-center justify-end text-emerald-100 text-sm font-medium"><Calendar className="w-3.5 h-3.5 mr-2 opacity-70" /><span>{hijriDate}</span></div>}
                         <div className="flex items-center justify-end text-emerald-100/60 text-[10px] mt-1 uppercase tracking-widest"><MapPin className="w-3 h-3 mr-1" /><span className="font-mono">{city}</span></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-2 relative z-10">
                {[
                    { name: 'Fajr', time: times.Fajr, icon: <Sunrise className="w-4 h-4" /> },
                    { name: 'Dhuhr', time: times.Dhuhr, icon: <Sun className="w-4 h-4" /> },
                    { name: 'Asr', time: times.Asr, icon: <Sun className="w-4 h-4 opacity-70" /> },
                    { name: 'Maghrib', time: times.Maghrib, icon: <Sunset className="w-4 h-4" /> },
                    { name: 'Isha', time: times.Isha, icon: <Moon className="w-4 h-4" /> }
                ].map((p) => {
                    const isNext = nextPrayer === p.name;
                    return (
                        <div key={p.name} className={`flex flex-col items-center py-4 rounded-2xl transition-all ${isNext ? 'bg-white/15 backdrop-blur-md shadow-lg border border-white/20 scale-105' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
                            <div className={`mb-2 ${isNext ? 'text-emerald-300' : 'text-white'}`}>{p.icon}</div>
                            <span className="text-[10px] uppercase font-bold tracking-wide mb-1 opacity-80">{p.name}</span>
                            <span className="text-xs md:text-sm font-mono font-bold">{p.time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-emerald-100 transition-all">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sunrise</p><p className="text-2xl font-bold text-slate-700 dark:text-slate-200 font-mono">{times.Sunrise}</p></div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm"><Sunrise className="w-6 h-6" /></div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between relative overflow-hidden group hover:border-emerald-100 transition-all">
                <div className="z-10"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Qibla</p><p className="text-2xl font-bold text-slate-700 dark:text-slate-200 font-mono">{qibla ? `${Math.round(qibla)}°` : '---'}</p></div>
                <div className="relative w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl">
                     <Compass className="w-6 h-6 text-slate-400 absolute" />
                     {qibla !== null && <div className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-out" style={{ transform: `rotate(${qibla}deg)` }}><ArrowUp className="w-5 h-5 text-emerald-600 -mt-1 drop-shadow-sm" strokeWidth={3} /></div>}
                </div>
             </div>
        </div>

        {/* Modal for Settings */}
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800">
                    <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 font-serif"><Settings2 className="w-5 h-5 text-emerald-500" /> Prayer Settings</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">School of Thought (Asr)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setSchool(0)} className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all ${school === 0 ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>Standard (Shafi'i, etc)</button>
                                <button onClick={() => setSchool(1)} className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all ${school === 1 ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>Hanafi</button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Calculation Method</label>
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                {CALC_METHODS.map(m => (
                                    <button key={m.id} onClick={() => setMethod(m.id)} className={`w-full p-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-all ${method === m.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                        {m.name}
                                        {method === m.id && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4 active:scale-95 transition-transform uppercase tracking-widest text-xs">Save & Sync</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default PrayerTimes;
