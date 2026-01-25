import { GoogleGenAI } from "@google/genai";

class ApiKeyManager {
    private keys: string[] = [];
    private currentIndex: number = 0;

    constructor() {
        this.refreshKeys();
    }

    public refreshKeys() {
        // Read the primary API_KEY env var
        // Strip ALL whitespace characters, quotes, and hidden formatting characters
        const rawKeyString = (process.env.API_KEY || '')
            .replace(/["']/g, '') // Remove quotes
            .replace(/\s/g, '')   // Remove all whitespace/newlines
            .trim();
        
        if (rawKeyString.includes(',')) {
            this.keys = rawKeyString.split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);
        } else if (rawKeyString.length > 0) {
            this.keys = [rawKeyString];
        }

        if (this.keys.length === 0) {
            console.error("ZestIslam: API_KEY is empty. Please set it in Vercel/Hosting settings.");
        } else {
            // Log obfuscated key info for debugging
            this.keys.forEach((key, i) => {
                console.log(`ZestIslam: Key #${i+1} loaded (Length: ${key.length}, Starts with: ${key.substring(0, 3)}...)`);
            });
        }
    }

    public getActiveKey(): string {
        if (this.keys.length === 0) {
            this.refreshKeys();
        }
        return this.keys[this.currentIndex % this.keys.length] || '';
    }

    public rotate() {
        if (this.keys.length > 1) {
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            console.warn(`ZestIslam: Error detected. Rotating to API Key #${this.currentIndex + 1}.`);
        }
    }

    public getAI() {
        const key = this.getActiveKey();
        return new GoogleGenAI({ apiKey: key });
    }
}

export const apiManager = new ApiKeyManager();
