
import React, { useState } from 'react';
import { Image, Loader2, Download, Settings, AlertCircle, Sparkles, X } from 'lucide-react';
import { generateThumbnail } from '../services/geminiService';

const ThumbnailGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [size, setSize] = useState('1K');
  const [usePro, setUsePro] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setStatus('');
    
    if (usePro) {
        const aiStudio = (window as any).aistudio;
        if (aiStudio) {
            try {
                const hasKey = await aiStudio.hasSelectedApiKey();
                if (!hasKey) {
                    await aiStudio.openSelectKey();
                }
            } catch (e) {
                console.error("Key selection failed", e);
                setStatus("API Key selection cancelled or failed.");
                return;
            }
        }
    }

    setLoading(true);
    setImageUrl(null);
    
    const result = await generateThumbnail(prompt, aspectRatio, size, usePro);
    
    if (result) {
        setImageUrl(result);
    } else {
        setStatus(usePro ? 
            "Generation failed. Check API Key or permissions." :
            "Generation failed. Please try again."
        );
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col">
       <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Thumbnail Creator</h2>
        <p className="text-slate-500 dark:text-slate-400">Design spiritual, aesthetic visuals for your content.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 flex-1">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-4">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-emerald-50 dark:border-emerald-900/30 h-full flex flex-col">
                
                {/* Mode Switcher */}
                <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex relative">
                    <button 
                        onClick={() => setUsePro(false)}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all z-10 ${!usePro ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        Standard (Fast)
                    </button>
                    <button 
                        onClick={() => setUsePro(true)}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all z-10 flex items-center justify-center gap-1 ${usePro ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        HD Pro <Sparkles className="w-3 h-3" />
                    </button>
                </div>

                <div className="space-y-5 flex-1">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Image Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your scene: A golden mosque dome at sunrise, geometric patterns, minimal style..."
                            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none h-40 resize-none text-slate-700 dark:text-slate-200 text-sm transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ratio</label>
                            <select 
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                                <option value="16:9">16:9 Landscape</option>
                                <option value="1:1">1:1 Square</option>
                                <option value="4:3">4:3 Standard</option>
                                <option value="3:4">3:4 Portrait</option>
                                <option value="9:16">9:16 Story</option>
                            </select>
                        </div>
                        
                         {/* Only show resolution for Pro mode */}
                         <div className={usePro ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quality</label>
                            <select 
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                                <option value="1K">1K Standard</option>
                                <option value="2K">2K High</option>
                                <option value="4K">4K Ultra</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className={`w-full mt-6 text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none shadow-lg ${usePro ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'}`}
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Image className="w-6 h-6" />}
                    {loading ? 'Creating...' : 'Generate Art'}
                </button>
                
                {status && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start gap-2 border border-red-100 dark:border-red-900/30">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{status}</span>
                    </div>
                )}
             </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-8">
             <div className="bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 h-full min-h-[500px] flex items-center justify-center relative overflow-hidden group">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-10 pointer-events-none"></div>

                {loading ? (
                    <div className="text-center relative z-10">
                        <div className="relative inline-block mb-4">
                            <div className={`w-20 h-20 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin ${usePro ? 'border-t-purple-500' : 'border-t-emerald-500'}`}></div>
                            <Sparkles className={`w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${usePro ? 'text-purple-500' : 'text-emerald-500'}`} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Crafting your masterpiece...</p>
                        {usePro && <p className="text-xs text-purple-400 mt-2">High Definition rendering takes longer</p>}
                    </div>
                ) : imageUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                        <img src={imageUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                        <div className="absolute bottom-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                            <a 
                                href={imageUrl} 
                                download={`zestislam-${Date.now()}.png`}
                                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-3 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2 font-bold"
                            >
                                <Download className="w-5 h-5" /> Download
                            </a>
                            <button 
                                onClick={() => setImageUrl(null)}
                                className="bg-black/50 backdrop-blur text-white px-4 py-3 rounded-full hover:bg-black/70 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-40">
                        <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                            <Image className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-xl font-bold text-slate-500 dark:text-slate-400">Canvas Empty</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Enter a prompt to start creating</p>
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
