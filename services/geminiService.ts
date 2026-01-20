
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { GeneratedDua, QuranVerse, TadabburResult, Hadith, SharhResult, DhikrSuggestion, NameInsight, DreamResult, QuizQuestion, SurahMeta, FullSurahVerse } from "../types";

// --- API KEY ROTATION ENGINE ---
let currentKeyIndex = 0;

const getApiKeyPool = (): string[] => {
  try {
    const raw = process.env.API_KEY || '';
    // Support multiple keys separated by commas
    return raw.split(',').map(k => k.trim()).filter(k => k.length > 0);
  } catch (e) {
    return [];
  }
};

const getActiveApiKey = () => {
  const pool = getApiKeyPool();
  if (pool.length === 0) return '';
  return pool[currentKeyIndex % pool.length];
};

const rotateToNextKey = () => {
    const pool = getApiKeyPool();
    if (pool.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % pool.length;
        console.warn(`ZestIslam: Quota reached. Rotating to API Key #${currentKeyIndex + 1}`);
    }
};

const getAI = () => {
    const key = getActiveApiKey();
    if (!key) {
        console.error("ZestIslam: API_KEY is missing. Add your 5 keys separated by commas.");
    }
    return new GoogleGenAI({ apiKey: key });
};

const SCHOLAR_INSTRUCTION = `You are the ZestIslam Scholar, a knowledgeable and compassionate Islamic assistant created by ZestIslam.

IDENTITY & CORE RULES:
1. **Identity**: You must explicitly identify yourself as "The ZestIslam Scholar". If asked "Who created you?", answer "I was created by ZestIslam."
2. **Knowledge Source**: Base answers on the Quran and authentic Sunnah (Hadith).
3. **Tone**: Polite, respectful, clear, and wise (Hikmah).
4. **Formatting**: Use Markdown, bolding, and blockquotes for scriptural texts.`;

// --- HELPER FUNCTIONS FOR RATE LIMITING & ROTATION ---

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000, fallbackValue?: T): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        const errorMsg = error?.message || "";
        const statusCode = error?.status || error?.code;
        
        const isQuotaError = statusCode === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('exhausted');
        const isNotFoundError = errorMsg.includes("Requested entity was not found");

        if (isQuotaError || isNotFoundError) {
            rotateToNextKey(); 
            if (retries > 0) {
                await wait(delay);
                return retryOperation(operation, retries - 1, delay, fallbackValue);
            }
        }
        
        if (fallbackValue !== undefined) {
            return fallbackValue;
        }
        throw error;
    }
}

// ------------------------------------------

export const getScholarChatResponse = async (history: {role: string, content: string}[], message: string): Promise<string> => {
  return await retryOperation(async () => {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SCHOLAR_INSTRUCTION,
        temperature: 0.7,
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I apologize, I could not generate a response at this time.";
  }, 3, 1000, "I am momentarily unavailable. Please remember that patience (Sabr) is a virtue. Try your question again in a moment.");
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a 4-word title for: "${firstMessage}". Return ONLY text.`,
        });
        return response.text?.trim() || "New Conversation";
    }, 2, 500, "New Conversation");
}

export const searchQuranByType = async (query: string): Promise<QuranVerse[]> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find 5 Quranic verses for topic: "${query}". Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            surahName: { type: Type.STRING },
                            verseNumber: { type: Type.INTEGER },
                            arabicText: { type: Type.STRING },
                            translation: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                        },
                        required: ["surahName", "verseNumber", "arabicText", "translation", "explanation"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    }, 3, 1000, []); 
};

export const searchHadithByType = async (query: string): Promise<Hadith[]> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find 5 authentic Hadiths for topic: "${query}". Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            book: { type: Type.STRING },
                            hadithNumber: { type: Type.STRING },
                            chapter: { type: Type.STRING },
                            arabicText: { type: Type.STRING },
                            translation: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            grade: { type: Type.STRING }
                        },
                        required: ["book", "hadithNumber", "chapter", "arabicText", "translation", "explanation", "grade"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    }, 3, 1000, []); 
};

export const generateTadabbur = async (surah: string, verseNumber: number): Promise<TadabburResult | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Spiritual Tadabbur for ${surah}:${verseNumber}. JSON with english, urdu, hinglish keys.`,
        config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : null;
    });
};

export const generateSharh = async (book: string, hadithNumber: string): Promise<SharhResult | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Spiritual Sharh for ${book} Hadith ${hadithNumber}. JSON with english, urdu, hinglish keys.`,
        config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : null;
    });
};

export const generatePersonalizedDua = async (situation: string): Promise<GeneratedDua | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Beautiful Dua for: "${situation}". Return JSON.`,
        config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : null;
    });
};

export const getDailyInspiration = async (): Promise<{ type: 'Ayah' | 'Hadith', text: string, source: string } | null> => {
    const CACHE_KEY = 'zestislam_daily_inspiration';
    const today = new Date().toDateString();

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            // Strictly check if the cached wisdom belongs to TODAY
            if (parsed.date === today) {
                return parsed.data;
            }
        }
    } catch (e) {}

    // Only if cache is empty OR outdated, we fetch a new one
    const data = await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Provide one unique, short, inspiring Ayah or Hadith for today (${today}). Variety is essential. Avoid repeating the same common verses. Return JSON with 'type', 'text', 'source'.`,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : null;
    }, 2, 1000, { type: 'Ayah', text: 'Verily, with every hardship comes ease.', source: 'Surah Ash-Sharh 94:5' });
    
    if (data) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data }));
    }
    return data;
}

export const generateThumbnail = async (prompt: string, aspectRatio: string, size: string, usePro: boolean): Promise<string | null> => {
  return await retryOperation(async () => {
    const ai = getAI();
    const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: `Islamic aesthetic art: ${prompt}` }] },
      config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: usePro ? size as any : undefined } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  });
};

export const editIslamicImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  return await retryOperation(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { mimeType: 'image/png', data: base64Image } }, { text: prompt }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  });
};

export const generateVeoVideo = async (prompt: string, imageBase64?: string, aspectRatio: string = '16:9'): Promise<string | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const model = 'veo-3.1-fast-generate-preview';
        let operation = await ai.models.generateVideos({
            model,
            prompt,
            image: imageBase64 ? { imageBytes: imageBase64, mimeType: 'image/png' } : undefined,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as any }
        });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        return uri ? `${uri}&key=${getActiveApiKey()}` : null;
    }, 2, 2000);
};

export const findIslamicPlaces = async (query: string, lat: number, lng: number, locationName?: string): Promise<{ places: any[] }> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Search for real ${query} near ${locationName || 'current area'}. Lat: ${lat}, Lng: ${lng}. USE Google Maps.`,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
            }
        });
        return { places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
    });
}

export const searchIslamicWeb = async (query: string): Promise<{text: string, chunks: any[]} | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Research Islamic information: "${query}". Use Search.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return { 
            text: response.text || "", 
            chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
        };
    });
};

export const analyzeMedia = async (fileBase64: string, mimeType: string, prompt: string): Promise<string> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { data: fileBase64, mimeType } }, { text: prompt }] }
        });
        return response.text || "No analysis available.";
    });
};

export const transcribeMedia = async (fileBase64: string, mimeType: string): Promise<string> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { data: fileBase64, mimeType } }, { text: "Transcribe this." }] }
        });
        return response.text || "No transcription available.";
    });
}

export const textToSpeech = async (text: string, type: 'general' | 'verse' | 'hadith' | 'name' = 'general'): Promise<ArrayBuffer | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
            }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
             const binaryString = atob(base64);
             const bytes = new Uint8Array(binaryString.length);
             for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
             return bytes.buffer;
        }
        return null;
    });
}

let activeAudioSource: AudioBufferSourceNode | null = null;
export const stopGeneratedAudio = () => {
    if (activeAudioSource) { try { activeAudioSource.stop(); } catch (e) {} activeAudioSource = null; }
};

export const playGeneratedAudio = async (text: string, type: 'general' | 'verse' | 'hadith' | 'name' = 'general', speed: number = 1.0, onEnded?: () => void) => {
    try {
        stopGeneratedAudio();
        const buffer = await textToSpeech(text, type);
        if (!buffer) return;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const data = new Uint8Array(buffer);
        const dataInt16 = new Int16Array(data.buffer);
        const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speed;
        source.connect(ctx.destination);
        source.onended = () => { if (activeAudioSource === source) activeAudioSource = null; if (onEnded) onEnded(); };
        activeAudioSource = source;
        source.start(0);
    } catch (e) { console.error(e); if (onEnded) onEnded(); }
}

export const getDhikrSuggestion = async (feeling: string): Promise<DhikrSuggestion | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Dhikr for: "${feeling}". Return JSON.`,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : null;
    });
}

export const getNameInsight = async (name: string): Promise<NameInsight | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Insight for: "${name}". Return JSON.`,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : null;
    });
}

export const interpretDream = async (dream: string): Promise<DreamResult | null> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: `Interpret dream: "${dream}". JSON.`,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : null;
    });
}

export const generateQuiz = async (topic: string, difficulty: string, count: number): Promise<QuizQuestion[]> => {
    return await retryOperation(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate ${count} ${difficulty} MCQ questions about ${topic}. JSON.`,
            config: { responseMimeType: "application/json" }
        });
        return response.text ? JSON.parse(response.text) : [];
    });
}

export const fetchSurahList = async (): Promise<SurahMeta[]> => {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        return data.code === 200 ? data.data : [];
    } catch (e) { return []; }
};

export const fetchFullSurah = async (number: number): Promise<{ meta: SurahMeta, verses: FullSurahVerse[] } | null> => {
    try {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.sahih`);
        const data = await response.json();
        if (data.code === 200 && data.data.length === 2) {
            const arabicData = data.data[0];
            const englishData = data.data[1];
            return {
                meta: arabicData,
                verses: arabicData.ayahs.map((ayah: any, index: number) => ({
                    number: ayah.number,
                    text: ayah.text,
                    translation: englishData.ayahs[index].text,
                    numberInSurah: ayah.numberInSurah
                }))
            };
        }
        return null;
    } catch (e) { return null; }
};

export const fetchSurahAudio = async (number: number): Promise<string[]> => {
    try {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`);
        const data = await response.json();
        return data.code === 200 ? data.data.ayahs.map((ayah: any) => ayah.audio) : [];
    } catch (e) { return []; }
};
