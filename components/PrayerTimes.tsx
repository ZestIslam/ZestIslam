
import React, { useEffect, useState } from 'react';
import { PrayerTimeData, GeoLocation } from '../types';
import { MapPin, Loader2, Moon, Sun, Sunrise, Sunset, Compass, Calendar, ArrowUp, Bell, BellOff } from 'lucide-react';

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData | null>(null);
  const [hijriDate, setHijriDate] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Locating...');
  const [qibla, setQibla] = useState<number | null>(null);
  
  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
      return localStorage.getItem('zestislam_prayer_notifications') === 'true';
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        calculateQibla(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError('Please enable location access');
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (location) {
      fetchPrayerTimes(location.latitude, location.longitude);
    }
  }, [location]);

  // Handle Notifications Toggle
  const toggleNotifications = async () => {
      if (!("Notification" in window)) {
          alert("This browser does not support desktop notifications");
          return;
      }

      if (!notificationsEnabled) {
          // User wants to enable
          let permission = Notification.permission;
          
          if (permission === 'default') {
              permission = await Notification.requestPermission();
          }
          
          if (permission === 'granted') {
              setNotificationsEnabled(true);
              localStorage.setItem('zestislam_prayer_notifications', 'true');
              try {
                  new Notification("Prayer Notifications Enabled", { body: "You will be notified at each prayer time." });
              } catch (e) {
                  // Ignore error if notification fails to spawn immediately
              }
          } else if (permission === 'denied') {
              alert("Notifications are blocked. Please enable them in your browser settings (click the lock icon in the URL bar) and try again.");
          }
      } else {
          // User wants to disable
          setNotificationsEnabled(false);
          localStorage.setItem('zestislam_prayer_notifications', 'false');
      }
  };

  // Check Time for Notifications
  useEffect(() => {
      if (!times || !notificationsEnabled) return;

      const checkTime = () => {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
          
          prayers.forEach(prayer => {
              // Get time from API format "HH:MM"
              const prayerTime = times[prayer]?.split(' ')[0]; // Remove (EST) etc if present
              
              if (prayerTime === currentTime) {
                  const lastNotified = sessionStorage.getItem(`notified_${prayer}_${new Date().toDateString()}`);
                  if (!lastNotified) {
                      if (Notification.permission === 'granted') {
                          new Notification(`It's time for ${prayer}`, {
                              body: "Hayya 'ala-s-Salah - Come to Prayer",
                              icon: "https://cdn-icons-png.flaticon.com/512/3655/3655163.png"
                          });
                      }
                      sessionStorage.setItem(`notified_${prayer}_${new Date().toDateString()}`, 'true');
                  }
              }
          });
      };

      const interval = setInterval(checkTime, 60000); // Check every minute
      return () => clearInterval(interval);
  }, [times, notificationsEnabled]);

  const calculateQibla = (lat1: number, lon1: number) => {
      const lat2 = 21.422487;
      const lon2 = 39.826206;
      const toRad = (deg: number) => deg * Math.PI / 180;
      const toDeg = (rad: number) => rad * 180 / Math.PI;

      const phi1 = toRad(lat1);
      const phi2 = toRad(lat2);
      const deltaLambda = toRad(lon2 - lon1);

      const y = Math.sin(deltaLambda) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) -
                Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
      
      let bearing = toDeg(Math.atan2(y, x));
      bearing = (bearing + 360) % 360; 
      setQibla(bearing);
  };

  const fetchPrayerTimes = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const date = new Date();
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=2`
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
  };

  const getNextPrayer = (timings: PrayerTimeData): string => {
    const now = new Date();
    const timeToDate = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayer of prayers) {
        if (timeToDate(timings[prayer]) > now) {
            return prayer;
        }
    }
    return 'Fajr';
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-900/30 text-sm">
        <MapPin className="w-4 h-4 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !times) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <span className="text-sm font-medium text-slate-400">Syncing with sky...</span>
      </div>
    );
  }

  const nextPrayer = getNextPrayer(times);

  return (
    <div className="space-y-6">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/30 transition-all duration-700"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">
                            Next Prayer
                        </span>
                    </div>
                    <p className="text-5xl font-bold tracking-tight font-serif">{nextPrayer}</p>
                    <p className="text-emerald-200 text-xl opacity-90 mt-2 font-mono">{times[nextPrayer] || times['Fajr']}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <button 
                        onClick={toggleNotifications}
                        className={`p-3 rounded-2xl backdrop-blur-md transition-all border ${notificationsEnabled ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20'}`}
                        title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
                    >
                        {notificationsEnabled ? <Bell className="w-5 h-5 fill-current" /> : <BellOff className="w-5 h-5" />}
                    </button>
                    <div className="text-right">
                         {hijriDate && (
                             <div className="flex items-center justify-end text-emerald-100 text-sm font-medium">
                                <Calendar className="w-3.5 h-3.5 mr-2 opacity-70" />
                                <span>{hijriDate}</span>
                             </div>
                        )}
                        <div className="flex items-center justify-end text-emerald-100/60 text-xs mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="font-mono">{city}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prayer Grid */}
            <div className="grid grid-cols-5 gap-2 relative z-10">
                {[
                    { name: 'Fajr', time: times.Fajr, icon: <Sunrise className="w-4 h-4" /> },
                    { name: 'Dhuhr', time: times.Dhuhr, icon: <Sun className="w-4 h-4" /> },
                    { name: 'Asr', time: times.Asr, icon: <Sun className="w-4 h-4 opacity-70" /> },
                    { name: 'Maghrib', time: times.Maghrib, icon: <Sunset className="w-4 h-4" /> },
                    { name: 'Isha', time: times.Isha, icon: <Moon className="w-4 h-4" /> }
                ].map((p) => {
                    const isNext = nextPrayer.startsWith(p.name);
                    return (
                        <div key={p.name} className={`flex flex-col items-center py-4 rounded-2xl transition-all ${isNext ? 'bg-white/15 backdrop-blur-md shadow-lg border border-white/20 scale-105' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
                            <div className={`mb-2 ${isNext ? 'text-emerald-300' : 'text-white'}`}>{p.icon}</div>
                            <span className="text-[10px] uppercase font-bold tracking-wide mb-1 opacity-80">{p.name}</span>
                            <span className="text-sm font-mono font-bold">{p.time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-emerald-100 dark:hover:border-emerald-900 transition-all">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sunrise</p>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 font-mono">{times.Sunrise}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-sm">
                    <Sunrise className="w-6 h-6" />
                </div>
             </div>
             
             {/* Qibla Indicator */}
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between relative overflow-hidden group hover:border-emerald-100 dark:hover:border-emerald-900 transition-all">
                <div className="z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qibla</p>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 font-mono">{qibla ? `${Math.round(qibla)}°` : '---'}</p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
                     <Compass className="w-6 h-6 text-slate-400 absolute" />
                     {qibla !== null && (
                         <div 
                            className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-out"
                            style={{ transform: `rotate(${qibla}deg)` }}
                         >
                            <ArrowUp className="w-5 h-5 text-emerald-600 -mt-1 drop-shadow-sm" strokeWidth={3} />
                         </div>
                     )}
                </div>
             </div>
        </div>
    </div>
  );
};

export default PrayerTimes;
