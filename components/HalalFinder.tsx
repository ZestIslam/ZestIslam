
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Loader2, Utensils, Search, Moon, ShoppingBag, Building2 } from 'lucide-react';
import { findIslamicPlaces } from '../services/geminiService';

const HalalFinder: React.FC = () => {
    // Places State
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [places, setPlaces] = useState<any[]>([]);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [query, setQuery] = useState('Halal Restaurants');
    const [searchedQuery, setSearchedQuery] = useState('');

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.error("Location access denied:", err)
        );
    }, []);

    const handlePlacesSearch = async () => {
        if (!location) {
            alert("Please enable location services to find places near you.");
            return;
        }
        setPlacesLoading(true);
        setSearchedQuery(query); 
        const results = await findIslamicPlaces(query, location.lat, location.lng);
        setPlaces(results);
        setPlacesLoading(false);
    };

    const getPlaceIcon = (title: string, typeContext: string) => {
        const t = title.toLowerCase();
        const q = typeContext.toLowerCase();
        if (q.includes('mosque') || t.includes('mosque') || t.includes('masjid') || t.includes('jami') || t.includes('prayer')) return <Moon className="w-6 h-6 text-indigo-500" />;
        if (q.includes('restaurant') || q.includes('food') || t.includes('restaurant') || t.includes('grill') || t.includes('cafe') || t.includes('kitchen') || t.includes('pizza') || t.includes('burger')) return <Utensils className="w-6 h-6 text-orange-500" />;
        if (q.includes('clothing') || q.includes('store') || t.includes('market') || t.includes('shop') || t.includes('boutique') || t.includes('hijab') || t.includes('fashion')) return <ShoppingBag className="w-6 h-6 text-fuchsia-500" />;
        if (q.includes('center') || q.includes('school') || t.includes('academy') || t.includes('foundation') || t.includes('institute') || t.includes('madrasa')) return <Building2 className="w-6 h-6 text-emerald-500" />;
        return <MapPin className="w-6 h-6 text-slate-400" />;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Halal & Islamic Finder</h2>
                <p className="text-slate-500 dark:text-slate-400">Discover Halal restaurants, Masjids, and Islamic services in your local area.</p>
            </div>

            <div className="space-y-8 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
                    <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            {query.includes('Mosque') ? <Moon className="w-5 h-5" /> : 
                            query.includes('Clothing') ? <ShoppingBag className="w-5 h-5" /> :
                            query.includes('Center') ? <Building2 className="w-5 h-5" /> :
                            <Utensils className="w-5 h-5" />}
                        </div>
                        <select 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full p-4 pl-12 rounded-xl bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 font-medium cursor-pointer appearance-none"
                        >
                            <option value="Halal Restaurants" className="bg-white dark:bg-slate-900">Halal Restaurants</option>
                            <option value="Mosques" className="bg-white dark:bg-slate-900">Mosques</option>
                            <option value="Islamic Centers" className="bg-white dark:bg-slate-900">Islamic Centers</option>
                            <option value="Islamic Clothing Stores" className="bg-white dark:bg-slate-900">Clothing Stores</option>
                        </select>
                    </div>
                    <button 
                        onClick={handlePlacesSearch}
                        disabled={placesLoading || !location}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
                    >
                        {placesLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                        Find Nearby
                    </button>
                </div>

                <div className="space-y-4">
                    {places.length === 0 && !placesLoading && (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                            <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Start Exploring</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Select a category and tap "Find Nearby" to see what's in your area.</p>
                        </div>
                    )}
                    
                    {places.map((chunk, i) => {
                        const mapData = chunk.web?.uri ? chunk.web : chunk.maps;
                        if (!mapData) return null;
                        return (
                            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-emerald-100 dark:hover:border-emerald-900 transition-all flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 group animate-fade-in-up">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                        {getPlaceIcon(mapData.title, searchedQuery || query)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{mapData.title}</h3>
                                        {mapData.placeId && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <div className="flex text-amber-400">
                                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium ml-1">(Recommended)</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">{chunk.content || "Discover more details about this location by following the directions link."}</p>
                                    </div>
                                </div>
                                <a 
                                    href={mapData.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="bg-slate-900 dark:bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors flex items-center justify-center shrink-0 self-start sm:self-center w-full sm:w-auto shadow-lg shadow-slate-200 dark:shadow-none"
                                >
                                    <Navigation className="w-4 h-4 mr-2" /> Open Maps
                                </a>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HalalFinder;
