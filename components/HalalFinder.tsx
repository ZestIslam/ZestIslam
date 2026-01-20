
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Loader2, Utensils, Search, Globe, AlertCircle, RotateCcw, Hotel, ChevronRight } from 'lucide-react';
import { findIslamicPlaces } from '../services/geminiService';

const HalalFinder: React.FC = () => {
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [addressName, setAddressName] = useState<string>('Locating...');
    const [places, setPlaces] = useState<any[]>([]);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [query, setQuery] = useState('Halal Restaurants');
    const [error, setError] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`, {
                headers: { 'Accept-Language': 'en' }
            });
            const data = await response.json();
            if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Nearby';
                setAddressName(city);
            } else {
                setAddressName('Current Area');
            }
        } catch (e) {
            setAddressName('Current Area');
        }
    };

    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported.");
            return;
        }
        setIsDetecting(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation(coords);
                reverseGeocode(coords.lat, coords.lng);
                setIsDetecting(false);
            },
            (err) => {
                setError("Please enable GPS permissions.");
                setIsDetecting(false);
            },
            { timeout: 10000 }
        );
    }, []);

    useEffect(() => {
        detectLocation();
    }, [detectLocation]);

    const handlePlacesSearch = async () => {
        if (!location) return;
        setPlacesLoading(true);
        setError(null);
        try {
            const { places: results } = await findIslamicPlaces(query, location.lat, location.lng, addressName);
            const seen = new Set();
            const valid = results.filter(p => {
                const title = p.maps?.title;
                if (title && !seen.has(title.toLowerCase())) {
                    seen.add(title.toLowerCase());
                    return true;
                }
                return false;
            });
            setPlaces(valid);
            if (valid.length === 0) setError(`No venues found in ${addressName}.`);
        } catch (e) {
            setError("Failed to fetch map data.");
        } finally {
            setPlacesLoading(false);
        }
    };

    const getPlaceIcon = (title: string) => {
        const t = title?.toLowerCase() || "";
        if (t.includes('hotel') || t.includes('inn')) return <Hotel className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />;
        return <Utensils className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-8 pb-12 px-2 sm:px-0">
            <div className="text-center space-y-2 pt-2 md:pt-8">
                <h2 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-white">Halal Finder</h2>
                <div className="flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] md:text-xs font-bold border border-emerald-100 dark:border-emerald-800 shadow-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${location ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <span className="truncate max-w-[120px]">{addressName}</span>
                        <button onClick={detectLocation} className="ml-1 text-slate-400 hover:text-emerald-600"><RotateCcw className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-1.5 md:p-3 rounded-2xl md:rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-1.5 max-w-2xl mx-auto">
                <div className="relative flex-1">
                    <select 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full p-3 pl-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100 font-bold appearance-none text-xs md:text-base cursor-pointer"
                    >
                        <option value="Halal Restaurants">Halal Restaurants</option>
                        <option value="Halal Hotels">Halal Hotels</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                         <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                </div>
                <button 
                    onClick={handlePlacesSearch}
                    disabled={placesLoading || !location}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 md:px-10 py-3 rounded-xl md:rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-xs md:text-base"
                >
                    {placesLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                    {placesLoading ? 'Scanning...' : 'Find All'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] md:text-sm font-bold border border-amber-100 dark:border-amber-800 max-w-2xl mx-auto flex items-center justify-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid gap-2.5 md:gap-6 grid-cols-1 sm:grid-cols-2">
                {places.map((chunk, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex gap-3 items-center min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-3xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                {getPlaceIcon(chunk.maps?.title)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-xs md:text-lg text-slate-800 dark:text-white truncate">{chunk.maps?.title}</h3>
                                <div className="flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-slate-300 dark:text-slate-600" />
                                    <span className="text-[8px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Verified</span>
                                </div>
                            </div>
                        </div>
                        <a 
                            href={chunk.maps?.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-slate-900 dark:bg-emerald-600 text-white px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-2xl text-[10px] md:text-sm font-black flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                        >
                            <Navigation className="w-3 h-3 md:w-4 md:h-4 fill-current" /> GO
                        </a>
                    </div>
                ))}
            </div>

            {places.length === 0 && !placesLoading && !error && (
                <div className="text-center py-12 md:py-24 bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="font-black text-slate-700 dark:text-slate-200 mb-1 text-sm md:text-xl uppercase tracking-widest">Discovery Ready</h3>
                    <p className="text-slate-400 max-w-xs mx-auto text-[10px] md:text-sm px-6">Select a category and tap search to reveal all Halal options in {addressName}.</p>
                </div>
            )}
        </div>
    );
};

export default HalalFinder;
