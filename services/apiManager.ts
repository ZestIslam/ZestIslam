import { GoogleGenAI } from "@google/genai";

class ApiKeyManager {
    public getAI() {
        const key = this.getActiveKey();
        if (!key) throw new Error("No API Key available");
        return new GoogleGenerativeAI(key);
    }
    private keys: string[] = [];
    private currentIndex: number = 0;

    constructor() {
        this.refreshKeys();
    }

    private refreshKeys() {
        // Read the primary API_KEY env var
        const mainKeyString = process.env.API_KEY || '';
        
        // Support format like: "key1", "key2", 'key3'
        if (mainKeyString.includes(',')) {
            this.keys = mainKeyString.split(',')
                .map(k => k.trim())
                // Remove leading/trailing quotes (double or single)
                .map(k => k.replace(/^["']|["']$/g, '').trim())
                .filter(k => k.length > 0);
        } else if (mainKeyString.trim().length > 0) {
            // Handle single key even if quoted
            this.keys = [mainKeyString.trim().replace(/^["']|["']$/g, '').trim()];
        }

        if (this.keys.length === 0) {
            console.error("ZestIslam: Critical Error - No valid API keys found in API_KEY environment variable.");
        } else {
            console.log(`ZestIslam: API Manager initialized with ${this.keys.length} keys.`);
        }
    }

    public getActiveKey(): string {
        if (this.keys.length === 0) return '';
        return this.keys[this.currentIndex % this.keys.length];
    }

    public rotate() {
        if (this.keys.length > 1) {
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            console.warn(`ZestIslam Security: Rotated to API Key #${this.currentIndex + 1} of ${this.keys.length}`);
        }
    }

    public getAI() {
        return new GoogleGenAI({ apiKey: this.getActiveKey() });
    }
}

export const apiManager = new ApiKeyManager();
