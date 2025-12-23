
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Star, Loader2, Utensils, Search, Moon, ShoppingBag, Building2, Camera, Scan, ShieldCheck, AlertCircle, XCircle, Info, Upload, Image as ImageIcon } from 'lucide-react';
import { findIslamicPlaces, analyzeMedia } from '../services/geminiService';

type FinderTab = 'PLACES' | 'SCANNER';

const HalalFinder: React.FC = () => {
    const [activeTab, setActiveTab] = useState<FinderTab>('PLACES');
    
    // Places State
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [places, setPlaces] = useState<any[]>([]);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [query, setQuery] = useState('Halal Restaurants');
    const [searchedQuery, setSearchedQuery] = useState('');

    // Scanner State
    const [scanFile, setScanFile] = useState<File | null>(null);
    const [scanPreview, setScanPreview] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<{status: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'UNKNOWN', reasoning: string} | null>(null);
    const [scanLoading, setScanLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.error(err)
        );
    }, []);

    const handlePlacesSearch = async () => {
        if (!location) {
            alert("Please enable location services.");
            return;
        }
        setPlacesLoading(true);
        setSearchedQuery(query); 
        const results = await findIslamicPlaces(query, location.lat, location.lng);
        setPlaces(results);
        setPlacesLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setScanFile(file);
            setScanResult(null);
            const reader = new FileReader();
            reader.onload = () => setScanPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const runScanner = async () => {
        if (!scanFile) return;
        setScanLoading(true);
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(scanFile);
            });

            const prompt = `Analyze the ingredients list or packaging in this image to determine if the product is Halal, Haram, or Mushbooh (Doubtful).
            Look for: Pork, lard, alcohol, non-zabihah meat, E-numbers (like E120, E441/Gelatin), and animal-derived emulsifiers.
            Return strictly a JSON object with:
            - "status": "HALAL", "HARAM", "MUSHBOOH", or "UNKNOWN"
            - "reasoning": A clear, concise explanation in English, highlighting specific ingredients found.`;

            const rawResponse = await analyzeMedia(base64, scanFile.type, prompt);
            
            // Attempt to parse JSON from AI response
            try {
                const cleaned = rawResponse.replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(cleaned);
                setScanResult(parsed);
            } catch (e) {
                setScanResult({ 
                    status: 'UNKNOWN', 
                    reasoning: rawResponse || "Could not clearly identify ingredients. Please ensure the ingredient list is legible."
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setScanLoading(false);
        }
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
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Halal Intelligence</h2>
                <p className="text-slate-500 dark:text-slate-400">Locate services or verify products using AI.</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex justify-center">
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex gap-1">
                    <button 
                        onClick={() => setActiveTab('PLACES')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'PLACES' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <MapPin className="w-4 h-4" /> Nearby Places
                    </button>
                    <button 
                        onClick={() => setActiveTab('SCANNER')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'SCANNER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Scan className="w-4 h-4" /> Product Scanner
                    </button>
                </div>
            </div>

            {activeTab === 'PLACES' ? (
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
                            Find
                        </button>
                    </div>

                    <div className="space-y-4">
                        {places.length === 0 && !placesLoading && (
                            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Explore your area</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Use the search bar to find places nearby.</p>
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
                                                    <span className="text-xs text-slate-400 font-medium ml-1">(Highly Rated)</span>
                                                </div>
                                            )}
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">{chunk.content || "Recommended place based on your search."}</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={mapData.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="bg-slate-900 dark:bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors flex items-center justify-center shrink-0 self-start sm:self-center w-full sm:w-auto shadow-lg shadow-slate-200 dark:shadow-none"
                                    >
                                        <Navigation className="w-4 h-4 mr-2" /> Directions
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                        
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Smart Ingredient Scanner</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Scan or upload product ingredients for instant verification.</p>
                        </div>

                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />

                        {!scanPreview ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"
                            >
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <p className="font-bold text-slate-700 dark:text-slate-300">Tap to Scan or Upload</p>
                                <p className="text-xs text-slate-400 mt-2">Take a photo of the ingredients list</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 max-h-64">
                                    <img src={scanPreview} alt="Product Preview" className="w-full object-cover" />
                                    <button 
                                        onClick={() => { setScanPreview(null); setScanFile(null); setScanResult(null); }}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {scanResult ? (
                                    <div className={`p-6 rounded-3xl border animate-fade-in-up ${
                                        scanResult.status === 'HALAL' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' :
                                        scanResult.status === 'HARAM' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                                        'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                                    }`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                                scanResult.status === 'HALAL' ? 'bg-emerald-500 text-white' :
                                                scanResult.status === 'HARAM' ? 'bg-red-500 text-white' :
                                                'bg-amber-500 text-white'
                                            }`}>
                                                {scanResult.status === 'HALAL' ? <ShieldCheck className="w-7 h-7" /> : 
                                                 scanResult.status === 'HARAM' ? <XCircle className="w-7 h-7" /> : 
                                                 <AlertCircle className="w-7 h-7" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-1">
                                                    {scanResult.status === 'HALAL' ? 'Halal Product' : 
                                                     scanResult.status === 'HARAM' ? 'Haram Ingredients Detected' : 
                                                     scanResult.status === 'MUSHBOOH' ? 'Doubtful (Mushbooh)' : 'Verification Inconclusive'}
                                                </h4>
                                                <p className="text-sm opacity-80 leading-relaxed">{scanResult.reasoning}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setScanPreview(null); setScanFile(null); setScanResult(null); }}
                                            className="w-full mt-6 py-2 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            Reset & Scan Another
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={runScanner}
                                        disabled={scanLoading}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                                    >
                                        {scanLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                                        {scanLoading ? 'Analyzing Ingredients...' : 'Analyze Ingredients'}
                                    </button>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex gap-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-700">
                            <Info className="w-5 h-5 shrink-0 text-emerald-500" />
                            <p>AI analysis is based on visual detection of ingredients. For products without ingredient lists, verification may be limited. Always check for official Halal certification logos on physical packaging.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HalalFinder;
