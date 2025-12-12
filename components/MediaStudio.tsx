
import React, { useState, useRef } from 'react';
import { Video, Wand2, Eye, Upload, Loader2, Play, FileAudio, Image as ImageIcon } from 'lucide-react';
import { generateVeoVideo, editIslamicImage, analyzeMedia, transcribeMedia } from '../services/geminiService';

type Tab = 'EDIT' | 'VEO' | 'ANALYZE' | 'TRANSCRIBE';

const MediaStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('EDIT');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [veoAspectRatio, setVeoAspectRatio] = useState('16:9');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
          }
          reader.readAsDataURL(file);
      })
  }

  const handleAction = async () => {
      setLoading(true);
      setResult(null);
      setStatus('Processing...');
      
      try {
          if (activeTab === 'EDIT' && file && prompt) {
              const b64 = await getBase64(file);
              const res = await editIslamicImage(b64, prompt);
              setResult(res);
          } else if (activeTab === 'VEO') {
              let b64 = undefined;
              if (file) b64 = await getBase64(file);
              const res = await generateVeoVideo(prompt, b64, veoAspectRatio);
              setResult(res);
          } else if (activeTab === 'ANALYZE' && file) {
               const b64 = await getBase64(file);
               const res = await analyzeMedia(b64, file.type, prompt || "Analyze this image in detail.");
               setResult(res);
          } else if (activeTab === 'TRANSCRIBE' && file) {
               const b64 = await getBase64(file);
               const res = await transcribeMedia(b64, file.type);
               setResult(res);
          }
      } catch (e) {
          console.error(e);
          setStatus("Error occurred. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
       <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Islamic Media Studio</h2>
        <p className="text-slate-500 dark:text-slate-400">Your AI-powered creative suite for editing, animation, and analysis.</p>
      </div>

      <div className="flex justify-center mb-4 overflow-x-auto no-scrollbar pb-2">
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-nowrap justify-center gap-1">
              {[
                  { id: 'EDIT', label: 'Magic Edit', icon: Wand2 },
                  { id: 'VEO', label: 'Video Gen', icon: Video },
                  { id: 'ANALYZE', label: 'Analyze', icon: Eye },
                  { id: 'TRANSCRIBE', label: 'Transcribe', icon: FileAudio }
              ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTab(t.id as Tab); setResult(null); setFile(null); setPreview(null); setPrompt(''); }}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                        activeTab === t.id 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-emerald-50 dark:border-emerald-900/30">
                   
                   {/* File Upload Area */}
                   {(activeTab === 'EDIT' || activeTab === 'ANALYZE' || activeTab === 'VEO' || activeTab === 'TRANSCRIBE') && (
                       <div className="mb-6">
                           <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                               {activeTab === 'VEO' ? 'Start Image (Optional)' : 'Source Media'}
                           </label>
                           <input 
                               type="file" 
                               ref={fileInputRef}
                               onChange={handleFileChange}
                               accept={
                                   activeTab === 'VEO' ? "image/*" :
                                   activeTab === 'TRANSCRIBE' ? "audio/*,video/*" :
                                   "image/*,video/*"
                               }
                               className="hidden"
                           />
                           <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${
                                    file 
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                               {preview && activeTab !== 'TRANSCRIBE' ? (
                                   activeTab === 'ANALYZE' && file?.type.startsWith('video') ? 
                                   <div className="text-emerald-600 dark:text-emerald-400 font-bold flex flex-col items-center py-8">
                                       <Video className="w-12 h-12 mb-4" />
                                       Video Selected
                                   </div> :
                                   <div className="relative group">
                                       <img src={preview} alt="Preview" className="h-48 mx-auto object-contain rounded-2xl shadow-lg" />
                                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                           <p className="text-white font-bold">Click to Change</p>
                                       </div>
                                   </div>
                               ) : file ? (
                                   <div className="text-emerald-600 dark:text-emerald-400 font-bold flex flex-col items-center py-8">
                                       <FileAudio className="w-12 h-12 mb-4" />
                                       <p className="text-lg text-slate-800 dark:text-white">{file.name}</p>
                                       <p className="text-sm font-normal opacity-70 mt-1 text-slate-500 dark:text-slate-400">Ready for processing</p>
                                   </div>
                               ) : (
                                   <div className="py-8">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <p className="font-bold text-slate-700 dark:text-slate-300">Click to upload</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                        {activeTab === 'TRANSCRIBE' ? 'Supports Audio & Video files' : 'Supports Images'}
                                    </p>
                                   </div>
                               )}
                           </div>
                       </div>
                   )}

                   {activeTab !== 'TRANSCRIBE' && (
                       <div className="mb-6">
                           <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                               {activeTab === 'EDIT' ? 'Instruction' : activeTab === 'VEO' ? 'Video Prompt' : 'Question (Optional)'}
                           </label>
                           <textarea 
                               value={prompt}
                               onChange={(e) => setPrompt(e.target.value)}
                               placeholder={
                                   activeTab === 'EDIT' ? "E.g., Remove the person in the background..." :
                                   activeTab === 'VEO' ? "E.g., A cinematic drone shot of a mosque at golden hour..." :
                                   "What does this image depict?"
                               }
                               className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none h-32 resize-none text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
                           />
                       </div>
                   )}

                   {activeTab === 'VEO' && (
                       <div className="mb-6">
                           <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Aspect Ratio</label>
                           <div className="flex gap-3">
                               <button onClick={() => setVeoAspectRatio('16:9')} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${veoAspectRatio === '16:9' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>16:9 Landscape</button>
                               <button onClick={() => setVeoAspectRatio('9:16')} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${veoAspectRatio === '9:16' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>9:16 Portrait</button>
                           </div>
                       </div>
                   )}

                   <button
                        onClick={handleAction}
                        disabled={loading || (!file && activeTab !== 'VEO') || (activeTab === 'VEO' && !prompt)}
                        className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                        {
                            activeTab === 'EDIT' ? 'Generate Edit' : 
                            activeTab === 'VEO' ? 'Generate Video' : 
                            activeTab === 'TRANSCRIBE' ? 'Start Transcription' :
                            'Analyze Media'
                        }
                    </button>
                    {loading && <p className="text-center text-xs text-slate-400 mt-4 animate-pulse">{status}</p>}
               </div>
          </div>

          {/* Result Area */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden min-h-[500px] relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-10 pointer-events-none"></div>
              
              {loading ? (
                   <div className="text-center p-8">
                        <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">Processing Magic</h3>
                        <p className="text-slate-500 dark:text-slate-400">Please wait while we generate your result...</p>
                        {activeTab === 'VEO' && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-4 font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 py-1 px-3 rounded-full inline-block">Estimated time: 1-2 minutes</p>}
                   </div>
              ) : result ? (
                  activeTab === 'ANALYZE' || activeTab === 'TRANSCRIBE' ? (
                      <div className="w-full h-full p-8 overflow-y-auto">
                           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-lg border-b border-slate-100 dark:border-slate-800 pb-4">
                                    {activeTab === 'TRANSCRIBE' ? 'Transcription Result' : 'Analysis Report'}
                                </h4>
                                <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <p className="whitespace-pre-wrap">{result}</p>
                                </div>
                           </div>
                      </div>
                  ) : activeTab === 'VEO' ? (
                      <div className="w-full h-full p-4 flex items-center justify-center">
                        <video src={result} controls className="max-w-full max-h-full rounded-2xl shadow-2xl" autoPlay loop />
                      </div>
                  ) : (
                      <div className="w-full h-full p-4 flex items-center justify-center relative group">
                        <img src={result} alt="Result" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                        <a href={result} download="edited-image.png" className="absolute bottom-8 right-8 bg-white text-slate-900 p-4 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                            <Upload className="w-6 h-6 rotate-180" />
                        </a>
                      </div>
                  )
              ) : (
                  <div className="text-center opacity-40">
                       <ImageIcon className="w-24 h-24 mx-auto mb-4 text-slate-400" />
                       <p className="text-xl font-bold text-slate-500 dark:text-slate-400">Output Studio</p>
                       <p className="text-sm text-slate-400 dark:text-slate-500">Your generated content will appear here</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default MediaStudio;
