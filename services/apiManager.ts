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

        // 1. Check for consolidated API_KEY
        const primaryKey = this.sanitizeKey(process.env.API_KEY);
        if (primaryKey.includes(',')) {
            const split = primaryKey.split(',').map(k => this.sanitizeKey(k)).filter(k => k.length > 0);
            foundKeys.push(...split);
        } else if (primaryKey.length > 0) {
            foundKeys.push(primaryKey);
        }

        // 2. Check for individual keys API_KEY1 through API_KEY5
        const env = process.env as any;
        const keysToCheck = ['API_KEY1', 'API_KEY2', 'API_KEY3', 'API_KEY4', 'API_KEY5'];

        keysToCheck.forEach(keyName => {
            const clean = this.sanitizeKey(env[keyName]);
            if (clean && !foundKeys.includes(clean)) {
                foundKeys.push(clean);
            }
        });

        this.keys = foundKeys;

        if (this.keys.length === 0) {
            console.error("ZestIslam: No valid API keys detected in environment variables.");
        } else {
            console.log(`ZestIslam: API Manager initialized with ${this.keys.length} keys.`);
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
            console.warn(`ZestIslam: Error detected. Rotating to API Key #${this.currentIndex + 1}.`);
        }
    }

    public getAI() {
        const key = this.getActiveKey();
        if (!key) throw new Error("No API Key Available");
        return new GoogleGenAI({ apiKey: key });
    }
}

export const apiManager = new ApiKeyManager();
