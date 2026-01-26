import { GoogleGenAI } from "@google/genai";

class ApiKeyManager {
    private keys: string[] = [];
    private currentIndex: number = 0;

    constructor() {
        this.refreshKeys();
    }

    private sanitizeKey(key: any): string {
        if (!key || typeof key !== 'string') return '';
        return key
            .replace(/["']/g, '') // Remove all quotes
            .replace(/\s/g, '')   // Remove all whitespace
            .replace(/\\n/g, '')  // Remove escaped newlines
            .trim();
    }

    public refreshKeys() {
        const foundKeys: string[] = [];
        
        // As per system instructions, the API key must be obtained EXCLUSIVELY from process.env.API_KEY.
        // To satisfy the user's request for "2 apis", we check if the string is comma-separated.
        const primaryKey = this.sanitizeKey(process.env.API_KEY);
        
        if (primaryKey.includes(',')) {
            const split = primaryKey.split(',')
                .map(k => this.sanitizeKey(k))
                .filter(k => k.length > 0);
            
            // Limit to 2 keys as requested by user
            foundKeys.push(...split.slice(0, 2));
        } else if (primaryKey.length > 0) {
            foundKeys.push(primaryKey);
        }

        this.keys = foundKeys;

        if (this.keys.length === 0) {
            console.error("ZestIslam: No valid API key detected in process.env.API_KEY.");
        } else {
            console.log(`ZestIslam: API Manager initialized with ${this.keys.length} key(s) from process.env.API_KEY.`);
        }
    }

    public getActiveKey(): string {
        if (this.keys.length === 0) {
            this.refreshKeys();
        }
        if (this.keys.length === 0) return '';
        return this.keys[this.currentIndex % this.keys.length];
    }

    public rotate() {
        if (this.keys.length > 1) {
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            console.warn(`ZestIslam: Rotating to API Key #${this.currentIndex + 1}.`);
        }
    }

    public getAI() {
        const key = this.getActiveKey();
        if (!key) {
            // Final attempt to refresh if someone just injected it
            this.refreshKeys();
            const retryKey = this.getActiveKey();
            if (!retryKey) throw new Error("No API Key Available. Please ensure process.env.API_KEY is set.");
            return new GoogleGenAI({ apiKey: retryKey });
        }
        return new GoogleGenAI({ apiKey: key });
    }
}

export const apiManager = new ApiKeyManager();
