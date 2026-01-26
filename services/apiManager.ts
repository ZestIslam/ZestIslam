import { GoogleGenAI } from "@google/genai";

class ApiKeyManager {
    private keys: string[] = [];
    private currentIndex: number = 0;

    constructor() {
        this.refreshKeys();
    }

    public refreshKeys() {
        // ALWAYS use process.env.API_KEY exclusively
        const rawKey = process.env.API_KEY || "";
        
        if (rawKey.includes(',')) {
            // Support rotation if user provided comma-separated keys
            this.keys = rawKey.split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);
        } else if (rawKey.trim()) {
            this.keys = [rawKey.trim()];
        } else {
            this.keys = [];
        }

        if (this.keys.length === 0) {
            console.error("ZestIslam: No valid API key found in environment variable API_KEY.");
        } else {
            console.log(`ZestIslam: API Manager initialized with ${this.keys.length} key(s).`);
        }
    }

    public getActiveKey(): string {
        if (this.keys.length === 0) {
            this.refreshKeys();
        }
        if (this.keys.length === 0) return "";
        return this.keys[this.currentIndex % this.keys.length];
    }

    public rotate() {
        if (this.keys.length > 1) {
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            console.warn(`ZestIslam: Rotating API key (Current index: ${this.currentIndex})`);
        }
    }

    public getAI() {
        const key = this.getActiveKey();
        if (!key) {
            throw new Error("ZestIslam: API Key is missing. Ensure process.env.API_KEY is set correctly.");
        }
        return new GoogleGenAI({ apiKey: key });
    }
}

export const apiManager = new ApiKeyManager();
