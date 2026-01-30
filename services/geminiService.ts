import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeneratedDua, QuranVerse, TadabburResult, Hadith, SharhResult, DhikrSuggestion, NameInsight, DreamResult, QuizQuestion, SurahMeta, FullSurahVerse } from "../types";

const SCHOLAR_INSTRUCTION = `You are the ZestIslam Scholar, a knowledgeable and compassionate Islamic assistant created by ZestIslam.

IDENTITY & CORE RULES:
1. **Identity**: You must explicitly identify yourself as "The ZestIslam Scholar".
2. **Knowledge Source**: Base answers on the Quran and authentic Sunnah.
3. **Tone**: Polite, respectful, clear, and wise (Hikmah).
4. **Formatting**: Use Markdown for clear presentation.`;

// Using Gemini 3 Flash for all text-based tasks (Tier 1 compatible)
const DEFAULT_TEXT_MODEL = 'gemini-3-flash-preview';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced retry logic to handle transient 503 (Model Overloaded) and 429 (Rate Limit) errors.
 * Uses aggressive exponential backoff to handle high-traffic periods gracefully.
 */
async function retryOperation<T>(operation: () => Promise<T>, retries = 5, delay = 2000, fallbackValue?: T): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // Model might return error in different formats, handle them all
        const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        const isTransient = errorMessage.includes("503") || 
                            errorMessage.includes("overloaded") || 
                            errorMessage.includes("429") ||
                            errorMessage.includes("rate limit") ||
                            errorMessage.includes("UNAVAILABLE");

        console.error(`ZestIslam API Error (Retries left: ${retries}):`, errorMessage);
        
        if (retries > 0 && isTransient) {
            await wait(delay);
            return retryOperation(operation, retries - 1, delay * 2, fallbackValue);
        }
        
        if (fallbackValue !== undefined) return fallbackValue;
        throw error;
    }
}

/**
 * Safely parse JSON from model responses to prevent crashes.
 */
const safeParseJson = (text: string | undefined, fallback: any) => {
    if (!text) return fallback;
    try {
        // Remove markdown code blocks if present
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("ZestIslam: JSON Parse Error", e);
        return fallback;
    }
};

export const getScholarChatResponse = async (history: {role: string, content: string}[], message: string): Promise<string> => {
  return await retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: DEFAULT_TEXT_MODEL,
      config: { 
        systemInstruction: SCHOLAR_INSTRUCTION, 
        temperature: 0.7
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
    });
    const result = await chat.sendMessage({ message });
    return result.text || "I apologize, I could not generate a response at this time.";
  }, 5, 2000, "The ZestIslam Scholar is currently experiencing high demand. Please try your question again in a minute.");
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Generate a short 3-4 word title for an Islamic chat about: "${firstMessage}". Return ONLY text.`,
        });
        return response.text?.trim() || "New Conversation";
    }, 2, 500, "New Conversation");
}

export const searchQuranByType = async (query: string): Promise<QuranVerse[]> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Find 5 relevant Quranic verses related to: "${query}". Return JSON.`,
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
        return safeParseJson(response.text, []);
    }, 3, 1500, []); 
};

export const searchHadithByType = async (query: string): Promise<Hadith[]> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Find 5 authentic Hadiths related to: "${query}". Return JSON.`,
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
        return safeParseJson(response.text, []);
    }, 3, 1500, []); 
};

export const getDailyInspiration = async (): Promise<{ type: 'Ayah' | 'Hadith', text: string, source: string } | null> => {
    const today = new Date().toDateString();
    const CACHE_KEY = `zestislam_wisdom_${today}`;
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    const data = await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Provide one inspirational and short Ayah or Hadith for ${today}. Format as JSON with type, text, source.`,
            config: { responseMimeType: "application/json" }
        });
        return safeParseJson(response.text, null);
    }, 2, 1000, { type: 'Ayah', text: 'Indeed, with hardship [will be] ease.', source: 'Quran 94:6' });
    if (data) localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
}

export const getNameInsight = async (name: string): Promise<NameInsight | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Provide deep spiritual insight for the Name of Allah: "${name}". Return JSON with english, urdu, and hinglish versions. Each language should have meaning, reflection, and application properties.`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        english: { type: Type.OBJECT, properties: { meaning: { type: Type.STRING }, reflection: { type: Type.STRING }, application: { type: Type.STRING } }, required: ["meaning", "reflection", "application"] },
                        urdu: { type: Type.OBJECT, properties: { meaning: { type: Type.STRING }, reflection: { type: Type.STRING }, application: { type: Type.STRING } }, required: ["meaning", "reflection", "application"] },
                        hinglish: { type: Type.OBJECT, properties: { meaning: { type: Type.STRING }, reflection: { type: Type.STRING }, application: { type: Type.STRING } }, required: ["meaning", "reflection", "application"] }
                    },
                    required: ["name", "english", "urdu", "hinglish"]
                }
            }
        });
        return safeParseJson(response.text, null);
    });
}

export const interpretDream = async (dream: string): Promise<DreamResult | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL, 
            contents: `Provide an Islamic interpretation for this dream: "${dream}". Return JSON with english, urdu, hinglish keys. Each key should contain interpretation, symbols (array), and advice properties.`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        english: { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, advice: { type: Type.STRING } }, required: ["interpretation", "symbols", "advice"] },
                        urdu: { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, advice: { type: Type.STRING } }, required: ["interpretation", "symbols", "advice"] },
                        hinglish: { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, advice: { type: Type.STRING } }, required: ["interpretation", "symbols", "advice"] }
                    },
                    required: ["english", "urdu", "hinglish"]
                }
            }
        });
        return safeParseJson(response.text, null);
    });
}

export const generatePersonalizedDua = async (situation: string): Promise<GeneratedDua | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Create a beautiful, personalized Dua for someone in this situation: "${situation}". Include Arabic, Transliteration, and English Translation. Return JSON.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    arabic: { type: Type.STRING },
                    transliteration: { type: Type.STRING },
                    translation: { type: Type.STRING }
                },
                required: ["title", "arabic", "transliteration", "translation"]
            }
        }
        });
        return safeParseJson(response.text, null);
    });
};

export const getDhikrSuggestion = async (feeling: string): Promise<DhikrSuggestion | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Suggest a specific Dhikr (Remembrance of Allah) for someone feeling: "${feeling}". Format as JSON with arabic, transliteration, meaning, benefit, and target (integer) count.`,
            config: { responseMimeType: "application/json" }
        });
        return safeParseJson(response.text, null);
    });
}

export const generateQuiz = async (topic: string, difficulty: string, count: number): Promise<QuizQuestion[]> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Generate a set of ${count} ${difficulty} MCQs about ${topic} from an Islamic perspective. Format as JSON array of objects with question, options (array of 4), correctIndex (0-3), and explanation.`,
            config: { responseMimeType: "application/json" }
        });
        return safeParseJson(response.text, []);
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
        const response = await fetch(`https://api.aladhan.com/v1/surah/${number}/editions/quran-uthmani,en.sahih`);
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
        const response = await fetch(`https://api.aladhan.com/v1/surah/${number}/ar.alafasy`);
        const data = await response.json();
        return data.code === 200 ? data.data.ayahs.map((ayah: any) => ayah.audio) : [];
    } catch (e) { return []; }
};

export const textToSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
}

let activeAudioSource: AudioBufferSourceNode | null = null;
export const stopGeneratedAudio = () => {
    if (activeAudioSource) { try { activeAudioSource.stop(); } catch (e) {} activeAudioSource = null; }
};

export const playGeneratedAudio = async (text: string, type: 'general' | 'verse' | 'hadith' | 'name' = 'general', speed: number = 1.0, onEnded?: () => void) => {
    try {
        stopGeneratedAudio();
        const buffer = await textToSpeech(text);
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
    } catch (e) { if (onEnded) onEnded(); }
}

export const generateTadabbur = async (surah: string, verseNumber: number): Promise<TadabburResult | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Provide spiritual Tadabbur (reflection) for verse ${surah}:${verseNumber}. Format as JSON with english, urdu, hinglish keys. Each key should have a paragraph and a points (array) property.`,
        config: { 
            responseMimeType: "application/json"
        }
        });
        return safeParseJson(response.text, null);
    });
};

export const generateSharh = async (book: string, hadithNumber: string): Promise<SharhResult | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Provide spiritual Sharh (explanation) for ${book} Hadith ${hadithNumber}. Format as JSON with english, urdu, hinglish keys. Each key should have a paragraph and a points (array) property.`,
        config: { 
            responseMimeType: "application/json"
        }
        });
        return safeParseJson(response.text, null);
    });
};

export const findIslamicPlaces = async (query: string, lat: number, lng: number, locationName?: string): Promise<{ places: any[] }> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Find real ${query} near ${locationName || 'the user'}. Current coordinates: Lat ${lat}, Lng ${lng}. Use Google Maps and return groundings.`,
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: `Research the following Islamic topic in detail using the web: "${query}". Provide a comprehensive overview.`,
            config: { 
                tools: [{ googleSearch: {} }]
            }
        });
        return { 
            text: response.text || "", 
            chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
        };
    });
};

export const generateThumbnail = async (prompt: string, aspectRatio: string = "1:1", imageSize: string = "1K", usePro: boolean = false): Promise<string | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: `Islamic aesthetic digital art: ${prompt}. Cinematic lighting, intricate patterns, spiritual atmosphere.` }] },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any,
                    imageSize: usePro ? imageSize as any : undefined
                }
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    });
};

export const generateVeoVideo = async (prompt: string, imageB64?: string, aspectRatio: string = '16:9'): Promise<string | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Islamic cinematic visualization: ${prompt}`,
            image: imageB64 ? { imageBytes: imageB64, mimeType: 'image/png' } : undefined,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio as any
            }
        });
        while (!operation.done) {
            await wait(10000);
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) return `${downloadLink}&key=${process.env.API_KEY}`;
        return null;
    }, 1, 10000); // Fewer retries for video due to length of operation
};

export const editIslamicImage = async (base64ImageData: string, prompt: string): Promise<string | null> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType: 'image/png' } }, 
                    { text: `Edit this image based on: ${prompt}. Maintain Islamic aesthetic and modesty.` }
                ]
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    });
};

export const analyzeMedia = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: { parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } }, 
                { text: `Analyze this media from an Islamic perspective: ${prompt}` }
            ] }
        });
        return response.text || "Unable to analyze media content.";
    });
};

export const transcribeMedia = async (base64Data: string, mimeType: string): Promise<string> => {
    return await retryOperation(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: DEFAULT_TEXT_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } }, 
                    { text: "Provide a detailed transcription of this media, paying special attention to any Arabic or Islamic terminology." }
                ]
            }
        });
        return response.text || "No transcription found.";
    });
};
