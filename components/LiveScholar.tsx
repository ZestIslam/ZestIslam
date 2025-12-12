
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, XCircle, Volume2, Volume1, VolumeX, Gauge, Signal, PauseCircle, Clock } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const LiveScholar: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("Ready to connect");
    
    // Audio Controls
    const [volume, setVolume] = useState(1.0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [micMuted, setMicMuted] = useState(false);
    const [duration, setDuration] = useState(0);

    // Refs for audio handling
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const intervalRef = useRef<any>(null);
    
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        if (connected) {
            intervalRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            setDuration(0);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [connected]);

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Update volume in real-time
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        }
    }, [volume]);

    // Handle Mic Mute
    useEffect(() => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !micMuted;
            }
        }
    }, [micMuted]);

    const stopSession = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        interruptAudio();
        gainNodeRef.current = null;
        setConnected(false);
        setStatus("Disconnected");
        setMicMuted(false);
    };

    const interruptAudio = () => {
        sourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { /* ignore */ }
        });
        sourcesRef.current.clear();
        if (audioContextRef.current) {
             nextStartTimeRef.current = audioContextRef.current.currentTime;
        }
    };

    const startSession = async () => {
        stopSession();
        try {
            setError(null);
            setStatus("Connecting...");
            
            // Safe key retrieval
            let apiKey = '';
            try {
                apiKey = process.env.API_KEY || '';
            } catch (e) {
                // Ignore reference error
            }

            if (!apiKey) {
                setError("API Key Missing. Check Vercel Settings.");
                setStatus("Config Error");
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            inputAudioContextRef.current = inputAudioContext;

            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            audioContextRef.current = outputAudioContext;

            const gainNode = outputAudioContext.createGain();
            gainNode.gain.value = volume;
            gainNode.connect(outputAudioContext.destination);
            gainNodeRef.current = gainNode;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setConnected(true);
                        setStatus("Listening...");
                        
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        processorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => {
                                if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                }
                            }).catch(err => {
                                console.error("Session send error", err);
                                stopSession();
                            });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            if (!outputAudioContext || outputAudioContext.state === 'closed') return;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            try {
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                                const source = outputAudioContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.playbackRate.value = playbackSpeed;
                                if (gainNodeRef.current) source.connect(gainNodeRef.current);
                                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += (audioBuffer.duration / playbackSpeed);
                                sourcesRef.current.add(source);
                            } catch (e) { console.error("Audio decoding error", e); }
                        }
                    },
                    onclose: () => stopSession(),
                    onerror: (e) => { console.error("Session error", e); setError("Connection interrupted."); stopSession(); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                    systemInstruction: `You are the ZestIslam Scholar, a friendly and wise Islamic assistant created by ZestIslam.
                    - **IDENTITY**: You must always identify yourself as "The ZestIslam Scholar". If asked about your creation, say "I was created by ZestIslam and powered by Google Gemini."
                    - **LANGUAGE**: Speak **English** by default. Do NOT speak other languages unless explicitly asked by the user (e.g., "Speak Urdu").
                    - **TONE**: Calm, scholarly, and compassionate.
                    - **CONTENT**: Base your answers on the Quran and authentic Hadith.`
                }
            });
        } catch (e) {
            console.error(e);
            setError("Failed to start session. Please check permissions.");
            stopSession();
        }
    };

    function createBlob(data: Float32Array): any {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            const s = Math.max(-1, Math.min(1, data[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
        return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
        }
        return buffer;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] bg-slate-950 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border border-slate-800">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none"></div>
            
            <div className="z-10 text-center w-full max-w-lg px-6 flex flex-col items-center h-full py-12">
                
                {/* Header Info */}
                <div className="mb-12 space-y-2">
                    <div className="flex items-center gap-3 justify-center">
                        <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${connected ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`}></span>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Live Scholar</h2>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                         <p className={`text-sm font-mono transition-colors ${connected ? 'text-emerald-400' : 'text-slate-400'}`}>{status}</p>
                         {connected && (
                             <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                                 {formatDuration(duration)}
                             </span>
                         )}
                    </div>
                </div>

                {/* Modern Visualizer */}
                <div className="relative mb-16 group cursor-pointer" onClick={connected ? () => setMicMuted(!micMuted) : startSession}>
                    {/* Ripple Effects */}
                    <div className={`absolute inset-0 rounded-full border border-emerald-500/20 scale-150 transition-all duration-1000 ${connected && !micMuted ? 'animate-ping opacity-50' : 'opacity-0'}`}></div>
                    <div className={`absolute inset-0 rounded-full border-2 border-emerald-500/30 scale-110 transition-all duration-1000 ${connected && !micMuted ? 'animate-pulse' : 'opacity-0'}`}></div>
                    
                    {/* Core Button Area */}
                    <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                        connected 
                            ? (micMuted 
                                ? 'bg-slate-800 border-4 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]' 
                                : 'bg-gradient-to-br from-emerald-600 to-teal-800 border-4 border-emerald-400/30 shadow-[0_0_60px_rgba(16,185,129,0.3)] scale-105') 
                            : 'bg-slate-900 border-4 border-slate-800 shadow-inner group-hover:border-emerald-500/50'
                    }`}>
                        {connected ? (
                            micMuted ? <MicOff className="w-16 h-16 text-red-400 transition-all" /> : <Activity className="w-20 h-20 text-white animate-pulse" />
                        ) : (
                            <Mic className="w-16 h-16 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                        )}
                    </div>
                </div>

                {/* Controls Deck */}
                {connected && (
                    <div className="w-full bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 space-y-6 animate-fade-in-up shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50"></div>
                        
                        {/* Primary Actions */}
                        <div className="flex items-center justify-center gap-6">
                             <button 
                                onClick={() => setMicMuted(!micMuted)}
                                className={`p-4 rounded-xl transition-all ${micMuted ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                title={micMuted ? "Unmute" : "Mute"}
                             >
                                {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                             </button>

                             <button 
                                onClick={interruptAudio}
                                className="p-4 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                                title="Interrupt"
                             >
                                <PauseCircle className="w-6 h-6" />
                             </button>
                             
                             <button 
                                onClick={stopSession}
                                className="px-6 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                             >
                                <XCircle className="w-5 h-5" /> End Session
                             </button>
                        </div>

                        {/* Sliders Row */}
                        <div className="flex items-center gap-4 px-2">
                             {/* Volume */}
                            <div className="flex items-center gap-3 flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className="text-emerald-500">
                                    {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                                <input 
                                    type="range" min="0" max="1" step="0.1" value={volume} 
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="flex-1 accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            
                            {/* Speed */}
                            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                                <Gauge className="w-4 h-4 text-emerald-500 ml-1" />
                                <select 
                                    value={playbackSpeed}
                                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                    className="bg-transparent text-xs font-bold text-slate-400 border-none focus:ring-0 cursor-pointer py-1 pr-6"
                                >
                                    {[0.75, 1, 1.25, 1.5].map(s => <option key={s} value={s}>{s}x</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Button */}
                {!connected && (
                    <button 
                        onClick={startSession} 
                        className="relative px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-500 hover:scale-105 transition-all shadow-lg shadow-emerald-900/50 flex items-center gap-2"
                    >
                        <Mic className="w-5 h-5" /> Tap to Speak
                    </button>
                )}

                {error && (
                    <div className="mt-8 bg-red-900/20 border border-red-500/20 px-6 py-3 rounded-xl animate-fade-in-up">
                        <p className="text-red-300 text-sm font-medium">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveScholar;