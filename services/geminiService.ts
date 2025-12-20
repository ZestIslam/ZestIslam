
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { GeneratedDua, QuranVerse, TadabburResult, Hadith, SharhResult, DhikrSuggestion, NameInsight, DreamResult, QuizQuestion, SurahMeta, FullSurahVerse } from "../types";

// Safe API Key retrieval for browser environments
const getApiKey = () => {
  try {
    // This try-catch block allows bundlers (like Vite/Webpack) to replace 'process.env.API_KEY'
    // with a string literal during build, while preventing crashes if 'process' is undefined at runtime.
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const getAI = () => {
    const key = getApiKey();
    if (!key) {
        console.warn("ZestIslam: API_KEY is missing. Please add it to your Vercel Environment Variables.");
    }
    return new GoogleGenAI({ apiKey: key });
};

const SCHOLAR_INSTRUCTION = `You are the ZestIslam Scholar, a knowledgeable and compassionate Islamic assistant created by ZestIslam.

IDENTITY & CORE RULES:
1. **Identity**: You must explicitly identify yourself as "The ZestIslam Scholar". If asked "Who created you?", answer "I was created by ZestIslam." If asked about your technology, say "I am powered by Google Gemini."
2. **Language**: Your default language is **English**. Do NOT switch languages unless the user explicitly asks you to (e.g., "Speak Urdu") or if the user's question is entirely in another language. If the user greets in Arabic (Assalamu Alaykum), reply in English with the Arabic greeting transliterated.
3. **Knowledge Source**: Base answers on the Quran and authentic Sunnah (Hadith). Be moderate and avoid extremism.
4. **Tone**: Polite, respectful, clear, and wise (Hikmah).

FORMATTING RULES:
- Use Markdown formatting strictly.
- Use **bold** for key Islamic terms or emphasis.
- Use bullet points for lists.
- Use > Blockquotes for Quranic Ayahs or Hadith translations.`;

// --- ROBUST FALLBACK DATA ENGINE ---

const FALLBACK_QURAN: QuranVerse[] = [
    {
        surahName: "Al-Baqarah",
        verseNumber: 153,
        arabicText: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
        translation: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
        explanation: "A timeless reminder that patience (Sabr) and prayer (Salah) are our greatest tools in difficult times."
    },
    {
        surahName: "Ash-Sharh",
        verseNumber: 5,
        arabicText: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
        translation: "For indeed, with hardship [will be] ease.",
        explanation: "A divine promise that relief is attached to every difficulty."
    },
    {
        surahName: "Al-Ankabut",
        verseNumber: 69,
        arabicText: "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا ۚ وَإِنَّ اللَّهَ لَمَعَ الْمُحْسِنِينَ",
        translation: "And those who strive for Us - We will surely guide them to Our ways. And indeed, Allah is with the doers of good.",
        explanation: "Struggle in the path of Allah brings His guidance."
    }
];

const FALLBACK_HADITH: Hadith[] = [
    {
        book: "Sahih Bukhari",
        hadithNumber: "1",
        chapter: "Revelation",
        arabicText: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        translation: "Actions are but by intentions, and every man shall have but that which he intended.",
        explanation: "The foundation of all Islamic actions is the Niyyah (intention).",
        grade: "Sahih"
    },
    {
        book: "Sahih Muslim",
        hadithNumber: "2564",
        chapter: "Birr and Silah",
        arabicText: "إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ",
        translation: "Verily, Allah is Kind and He loves kindness. He confers upon kindness that which He does not confer upon severity.",
        explanation: "Gentleness is a divine attribute to be emulated.",
        grade: "Sahih"
    }
];

// --- HELPER FUNCTIONS FOR RATE LIMITING ---

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation<T>(operation: () => Promise<T>, retries = 2, delay = 2000, fallbackValue?: T): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        console.warn("Gemini Operation Failed:", error);
        if (retries > 0 && (error?.status === 429 || error?.code === 429 || error?.message?.includes('429'))) {
            await wait(delay);
            return retryOperation(operation, retries - 1, delay * 2, fallbackValue);
        }
        
        if (fallbackValue !== undefined) {
            return fallbackValue;
        }
        throw error;
    }
}

// ------------------------------------------

export const getScholarChatResponse = async (history: {role: string, content: string}[], message: string): Promise<string> => {
  try {
    return await retryOperation(async () => {
        const ai = getAI();
        const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SCHOLAR_INSTRUCTION,
            temperature: 0.7,
        },
        history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        });

        const result = await chat.sendMessage({ message });
        return result.text || "I apologize, I could not generate a response at this time.";
    }, 2, 2000, "I am taking a moment to reflect on that. While I reconnect to my sources, remember that patience (Sabr) is a virtue. How else may I assist you?");
  } catch (error: any) {
    if (error?.status === 429 || error?.code === 429) {
        return "I am receiving a lot of questions right now (Quota Exceeded). Please give me a moment to rest and try again shortly.";
    }
    return "I am currently meditating on your question. Please give me a moment and ask again, or ask about a different topic.";
  }
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a very short, concise title (max 4-5 words) for a chat that starts with this message: "${firstMessage}". Return ONLY the title text.`,
        });
        return response.text?.trim() || "New Conversation";
    } catch (e) {
        return "New Conversation";
    }
}

export const searchQuranByType = async (query: string): Promise<QuranVerse[]> => {
  try {
    return await retryOperation(async () => {
        const ai = getAI();
        const prompt = `Find up to 5 most relevant Quranic verses for the following query/emotion/topic: "${query}".
        Return the result strictly as a JSON array of objects. 
        Each object must have: "surahName" (string), "verseNumber" (number), "arabicText" (string, fully vocalized), "translation" (string, in English), and "explanation" (string, brief context).
        Do not include markdown code blocks.`;

        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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

        const text = response.text || "[]";
        return JSON.parse(text);
    }, 2, 2000, FALLBACK_QURAN); 
  } catch (error: any) {
    return FALLBACK_QURAN;
  }
};

export const searchHadithByType = async (query: string): Promise<Hadith[]> => {
  try {
    return await retryOperation(async () => {
        const ai = getAI();
        const prompt = `Find up to 5 most relevant and authentic Hadiths for the following query/emotion/topic: "${query}".
        Return the result strictly as a JSON array of objects. 
        Each object must have: 
        - "book" (e.g., Sahih Bukhari), 
        - "hadithNumber" (string), 
        - "chapter" (string topic),
        - "arabicText" (string, fully vocalized), 
        - "translation" (string, in English), 
        - "explanation" (string, brief context),
        - "grade" (string, e.g., Sahih).
        Do not include markdown code blocks.`;

        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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

        const text = response.text || "[]";
        return JSON.parse(text);
    }, 2, 2000, FALLBACK_HADITH); 
  } catch (error: any) {
    return FALLBACK_HADITH;
  }
};

export const generateTadabbur = async (surah: string, verseNumber: number): Promise<TadabburResult | null> => {
  try {
    return await retryOperation(async () => {
        const ai = getAI();
        const prompt = `Provide a deep spiritual reflection (Tadabbur) for Surah ${surah}, Verse ${verseNumber}.
        Output strictly JSON with 3 keys: 'english', 'urdu', and 'hinglish'.
        For EACH language key, provide an object with:
        - 'paragraph': A deep, meaningful summary paragraph explaining the essence of the verse.
        - 'points': An array of short, profound bullet points derived from the verse.
        Ensure Urdu text is in proper Urdu script. Hinglish should be Roman Urdu/Hindi.`;

        const contentSchema = {
            type: Type.OBJECT,
            properties: {
                paragraph: { type: Type.STRING },
                points: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["paragraph", "points"]
        };

        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                verseReference: { type: Type.STRING },
                english: contentSchema,
                urdu: contentSchema,
                hinglish: contentSchema
            },
            required: ["verseReference", "english", "urdu", "hinglish"]
            }
        }
        });

        return response.text ? JSON.parse(response.text) : null;
    });
  } catch (error) {
    return null;
  }
};

export const generateSharh = async (book: string, hadithNumber: string): Promise<SharhResult | null> => {
  try {
    return await retryOperation(async () => {
        const ai = getAI();
        const prompt = `Provide a deep spiritual commentary (Sharh) for Hadith from ${book}, number ${hadithNumber}.
        Output strictly JSON with 3 keys: 'english', 'urdu', and 'hinglish'.
        For EACH language key, provide an object with:
        - 'paragraph': A deep, meaningful summary paragraph explaining the lessons of the Hadith.
        - 'points': An array of short, actionable bullet points derived from the Hadith.
        Ensure Urdu text is in proper Urdu script. Hinglish should be Roman Urdu/Hindi.`;

        const contentSchema = {
            type: Type.OBJECT,
            properties: {
                paragraph: { type: Type.STRING },
                points: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["paragraph", "points"]
        };

        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                hadithReference: { type: Type.STRING },
                english: contentSchema,
                urdu: contentSchema,
                hinglish: contentSchema
            },
            required: ["hadithReference", "english", "urdu", "hinglish"]
            }
        }
        });

        return response.text ? JSON.parse(response.text) : null;
    });
  } catch (error) {
    return null;
  }
};

export const generatePersonalizedDua = async (situation: string): Promise<GeneratedDua | null> => {
  try {
    return await retryOperation(async () => {
        const ai = getAI();
        const prompt = `Generate a beautiful and relevant Islamic Dua (supplication) for a user who is experiencing: "${situation}".
        Return strictly a JSON object with: "title" (short descriptive title), "arabic" (vocalized Arabic text), "transliteration" (English letters), and "translation" (English meaning).`;

        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    });
  } catch (error) {
    return null;
  }
};

export const getDailyInspiration = async (): Promise<{ type: 'Ayah' | 'Hadith', text: string, source: string } | null> => {
    const CACHE_KEY = 'zestislam_daily_inspiration';
    const today = new Date().toDateString();

    const fallbacks = [
            { type: 'Ayah', text: 'So verily, with the hardship, there is relief.', source: 'Surah Ash-Sharh 94:5' },
            { type: 'Ayah', text: 'And He is with you wherever you are.', source: 'Surah Al-Hadid 57:4' },
            { type: 'Ayah', text: 'Call upon Me; I will respond to you.', source: 'Surah Ghafir 40:60' },
            { type: 'Ayah', text: 'Allah does not burden a soul beyond that it can bear.', source: 'Surah Al-Baqarah 2:286' },
            { type: 'Hadith', text: 'The best among you is the one who does not harm others with his tongue and hands.', source: 'Sahih Bukhari' },
            { type: 'Hadith', text: 'Kindness is a mark of faith, and whoever has not kindness has not faith.', source: 'Sahih Muslim' },
            { type: 'Hadith', text: 'Be in this world as if you were a stranger or a traveler.', source: 'Sahih Bukhari' }
    ] as const;

    // 1. Strict Cache Check
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.date === today && parsed.data) {
                return parsed.data;
            }
        }
    } catch (e) {
        // Ignore cache errors
    }

    // 2. Try Fetching (If not cached)
    try {
        const data = await retryOperation(async () => {
             const ai = getAI();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "Provide one short, inspiring Ayah or Hadith for today. Return JSON with 'type' (Ayah or Hadith), 'text' (English translation), 'source' (e.g., Surah Al-Baqarah 2:153 or Sahih Bukhari).",
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ["Ayah", "Hadith"] },
                            text: { type: Type.STRING },
                            source: { type: Type.STRING }
                        }
                    }
                }
            });
            const text = response.text;
            if (text) return JSON.parse(text);
            return null;
        });
        
        if (data) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data }));
            return data;
        }
    } catch (e) {
        // 3. Deterministic Fallback (If API fails)
        // Ensure same fallback for the entire day even if cache is missing/cleared/reloaded
        const dateHash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const fallbackIndex = dateHash % fallbacks.length;
        const fallback = fallbacks[fallbackIndex];
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data: fallback }));
        
        return fallback;
    }
    
    return fallbacks[0];
}

export const generateThumbnail = async (prompt: string, aspectRatio: string, size: string, usePro: boolean): Promise<string | null> => {
  try {
    const ai = getAI();
    // Use Flash Image for free tier, Pro Image for paid/high-quality
    const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const config: any = {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
    };

    // Only add size if Pro model, Flash Image doesn't support it
    if (usePro) {
        config.imageConfig.imageSize = size as any;
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: `Create a high quality, spiritual, and aesthetic Islamic thumbnail for: ${prompt}. Do not portray prophets or prohibited imagery.` }]
      },
      config
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Thumbnail Error:", error);
    return null;
  }
};

export const editIslamicImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    const ai = getAI();
    // Use gemini-2.5-flash-image for editing
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Edit Image Error:", error);
    return null;
  }
};

export const generateVeoVideo = async (prompt: string, imageBase64?: string, aspectRatio: string = '16:9'): Promise<string | null> => {
    try {
        const ai = getAI();
        const model = 'veo-3.1-fast-generate-preview';
        
        let operation;
        if (imageBase64) {
             operation = await ai.models.generateVideos({
                model,
                prompt,
                image: {
                    imageBytes: imageBase64,
                    mimeType: 'image/png'
                },
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as any
                }
            });
        } else {
            operation = await ai.models.generateVideos({
                model,
                prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as any
                }
            });
        }

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) return null;
        // Append API Key for client-side playback
        return `${uri}&key=${getApiKey()}`;
    } catch (error) {
        console.error("Veo Error:", error);
        throw error;
    }
};

export const findIslamicPlaces = async (query: string, lat: number, lng: number): Promise<any[]> => {
    try {
        return await retryOperation(async () => {
             const ai = getAI();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Find ${query} near the provided location. Provide a list with name, description, and why it's recommended.`,
                config: {
                    tools: [{ googleMaps: {} }],
                    toolConfig: {
                        retrievalConfig: {
                            latLng: { latitude: lat, longitude: lng }
                        }
                    }
                }
            });
            
            // Return raw chunks to be processed by component
            return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        });
    } catch (error) {
        console.error("Maps Error:", error);
        return [];
    }
}

export const searchIslamicWeb = async (query: string): Promise<{text: string, chunks: any[]} | null> => {
    try {
        return await retryOperation(async () => {
            const ai = getAI();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Search for accurate and respectful Islamic information regarding: "${query}". Provide a concise summary.`,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            });
            
            const text = response.text || "";
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            return { text, chunks };
        });
    } catch (error: any) {
        return {
            text: "We are experiencing high traffic. Please check the Quran and Hadith sections for direct guidance.",
            chunks: []
        };
    }
};

export const analyzeMedia = async (fileBase64: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: fileBase64, mimeType } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "No analysis available.";
    } catch (error) {
        return "Failed to analyze media due to network or quota limits.";
    }
};

export const transcribeMedia = async (fileBase64: string, mimeType: string): Promise<string> => {
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { data: fileBase64, mimeType } },
                    { text: "Transcribe this media file accurately. Identify speakers if possible. Provide a brief summary first, then the full transcript." }
                ]
            }
        });
        return response.text || "No transcription available.";
    } catch (error) {
        return "Failed to transcribe media.";
    }
}

export const textToSpeech = async (text: string, type: 'general' | 'verse' | 'hadith' | 'name' = 'general'): Promise<ArrayBuffer | null> => {
    try {
        const ai = getAI();
        let promptText = text;

        if (type === 'verse') {
            // Highly specific prompt for accuracy and slow pace - Explicitly requesting Mishary Alafasy Style
            promptText = `Recite this Quranic verse in the exact style of Qari Mishary Rashid Alafasy.
            Focus on his signature deep, emotional, and melodic Tarteel.
            Maintain a slow, measured pace with perfect Tajweed and clear pronunciation of every diacritic (Tashkeel).
            Capture the spiritual resonance and proper pauses.
            Text to recite: ${text}`;
        } else if (type === 'hadith') {
            promptText = `Read the following Hadith in clear, eloquent, and formal Arabic style: ${text}`;
        } else if (type === 'name') {
            promptText = `Pronounce the following Name of Allah clearly, slowly, and reverently in Arabic: ${text}`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: promptText }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    // Switch to 'Puck' for a male voice
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                }
            }
        });
        
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
             const binaryString = atob(base64);
             const len = binaryString.length;
             const bytes = new Uint8Array(len);
             for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
             }
             return bytes.buffer;
        }
        return null;
    } catch (error) {
        console.error("TTS Error:", error);
        return null;
    }
}

// Track active audio source to allow stopping it
let activeAudioSource: AudioBufferSourceNode | null = null;

export const stopGeneratedAudio = () => {
    if (activeAudioSource) {
        try {
            activeAudioSource.stop();
        } catch (e) {
            // Ignore errors if already stopped
        }
        activeAudioSource = null;
    }
};

export const playGeneratedAudio = async (text: string, type: 'general' | 'verse' | 'hadith' | 'name' = 'general', speed: number = 1.0, onEnded?: () => void) => {
    try {
        // Stop any currently playing audio before starting new one
        stopGeneratedAudio();

        const buffer = await textToSpeech(text, type);
        if (!buffer) return;

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Manual PCM decoding for Gemini TTS (Raw Int16, 24kHz)
        const data = new Uint8Array(buffer);
        const dataInt16 = new Int16Array(data.buffer);
        const numChannels = 1;
        const sampleRate = 24000;
        
        const frameCount = dataInt16.length / numChannels;
        const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                // Convert Int16 to Float32 [-1.0, 1.0]
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        // Apply playback speed
        source.playbackRate.value = speed;
        source.connect(ctx.destination);
        
        // Setup lifecycle hooks
        source.onended = () => {
            if (activeAudioSource === source) {
                activeAudioSource = null;
            }
            if (onEnded) onEnded();
        };

        // Track global source
        activeAudioSource = source;
        source.start(0);
        
    } catch (e) {
        console.error("Playback failed", e);
        if (onEnded) onEnded();
    }
}

// --- TASBIH & NAMES ---

export const getDhikrSuggestion = async (feeling: string): Promise<DhikrSuggestion | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Recommend a specific Islamic Dhikr/Invocation for someone feeling: "${feeling}".
            Return strictly JSON with:
            - 'arabic': text
            - 'transliteration': text
            - 'meaning': english meaning
            - 'benefit': short sentence on why this helps
            - 'target': integer (e.g. 33, 100)`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        arabic: { type: Type.STRING },
                        transliteration: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                        benefit: { type: Type.STRING },
                        target: { type: Type.INTEGER }
                    },
                    required: ["arabic", "transliteration", "meaning", "benefit", "target"]
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        return null;
    }
}

export const getNameInsight = async (name: string): Promise<NameInsight | null> => {
    try {
        const ai = getAI();
        const contentSchema = {
             type: Type.OBJECT,
             properties: {
                 meaning: { type: Type.STRING },
                 reflection: { type: Type.STRING },
                 application: { type: Type.STRING }
             },
             required: ["meaning", "reflection", "application"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Provide deep spiritual insight for the Name of Allah: "${name}".
            Output strictly JSON with keys: 'name' (the name), 'english', 'urdu', 'hinglish'.
            For EACH language key (english, urdu, hinglish), provide an object with:
            - 'meaning': Literal meaning
            - 'reflection': A profound spiritual reflection paragraph
            - 'application': Practical way to apply this attribute in daily life
            Ensure Urdu text is in proper Urdu script. Hinglish should be Roman Urdu/Hindi.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        english: contentSchema,
                        urdu: contentSchema,
                        hinglish: contentSchema
                    },
                    required: ["name", "english", "urdu", "hinglish"]
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        return null;
    }
}

// --- DREAM INTERPRETER & QUIZ ---

export const interpretDream = async (dream: string): Promise<DreamResult | null> => {
    try {
        const ai = getAI();
        const contentSchema = {
            type: Type.OBJECT,
            properties: {
                interpretation: { type: Type.STRING },
                symbols: { type: Type.ARRAY, items: { type: Type.STRING } },
                advice: { type: Type.STRING }
            },
            required: ["interpretation", "symbols", "advice"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: `Interpret this dream based on Islamic methodology (citing Ibn Sirin or general Islamic principles where applicable): "${dream}".
            Be moderate and wise.
            Output strictly JSON with 3 keys: 'english', 'urdu', 'hinglish'.
            For EACH language key, provide an object with:
            - 'interpretation': The detailed interpretation.
            - 'symbols': Array of key symbols identified.
            - 'advice': Spiritual advice or recommended adab/dua.
            Ensure Urdu text is in proper Urdu script. Hinglish should be Roman Urdu/Hindi.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        english: contentSchema,
                        urdu: contentSchema,
                        hinglish: contentSchema
                    },
                    required: ["english", "urdu", "hinglish"]
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        return null;
    }
}

export const generateQuiz = async (topic: string, difficulty: string, count: number): Promise<QuizQuestion[]> => {
    try {
        const ai = getAI();
        
        const diffPrompt = difficulty === 'hard' 
            ? "challenging and deep, requiring specific knowledge" 
            : difficulty === 'medium' 
            ? "moderately difficult" 
            : "simple and suitable for beginners";

        const topicPrompt = topic.trim() 
            ? `about "${topic}"` 
            : "covering general Islamic knowledge (Quran, Seerah, Fiqh, History)";

        const prompt = `Generate ${count} multiple choice Islamic knowledge questions ${topicPrompt}. The questions should be ${diffPrompt}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${prompt}
            Return strictly JSON array of objects with:
            - 'question': text
            - 'options': array of 4 strings
            - 'correctIndex': integer (0-3)
            - 'explanation': short explanation of the answer.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctIndex: { type: Type.INTEGER },
                            explanation: { type: Type.STRING }
                        },
                        required: ["question", "options", "correctIndex", "explanation"]
                    }
                }
            }
        });
        return response.text ? JSON.parse(response.text) : [];
    } catch (e) {
        return [];
    }
}

// --- SURAH READER (API) ---

export const fetchSurahList = async (): Promise<SurahMeta[]> => {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        if (data.code === 200) {
            return data.data;
        }
        return [];
    } catch (e) {
        return [];
    }
};

export const fetchFullSurah = async (number: number): Promise<{ meta: SurahMeta, verses: FullSurahVerse[] } | null> => {
    try {
        // Fetch Arabic and English translation (Sahih International)
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.sahih`);
        const data = await response.json();
        
        if (data.code === 200 && data.data.length === 2) {
            const arabicData = data.data[0];
            const englishData = data.data[1];
            
            const verses: FullSurahVerse[] = arabicData.ayahs.map((ayah: any, index: number) => ({
                number: ayah.number,
                text: ayah.text,
                translation: englishData.ayahs[index].text,
                numberInSurah: ayah.numberInSurah
            }));

            return {
                meta: {
                    number: arabicData.number,
                    name: arabicData.name,
                    englishName: arabicData.englishName,
                    englishNameTranslation: arabicData.englishNameTranslation,
                    numberOfAyahs: arabicData.numberOfAyahs,
                    revelationType: arabicData.revelationType
                },
                verses
            };
        }
        return null;
    } catch (e) {
        return null;
    }
};

// --- AUDIO FEATURES ---

export const fetchSurahAudio = async (number: number): Promise<string[]> => {
    try {
        // Fetches full audio playlist for the surah by Mishary Rashid Alafasy
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`);
        const data = await response.json();
        
        if (data.code === 200) {
            return data.data.ayahs.map((ayah: any) => ayah.audio);
        }
        return [];
    } catch (e) {
        return [];
    }
};

