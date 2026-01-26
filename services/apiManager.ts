import { GoogleGenAI } from "@google/genai";

class ApiKeyManager {
    private keys: string[] = [];
    private currentIndex: number = 0;

    constructor() {
        this.refreshKeys();
    }

    private sanitizeKey(key: string | undefined): string {
        if (!key) return '';
        return key
            .replace(/["']/g, '') // Remove all quotes
            .replace(/\s/g, '')   // Remove all whitespace, newlines, tabs
            .replace(/\\n/g, '')  // Remove escaped newlines
            .trim();
    }

    public refreshKeys() {
        const foundKeys: string[] = [];

        // 1. Check for consolidated API_KEY (comma separated)
        const primaryKey = this.sanitizeKey(process.env.API_KEY);
        if (primaryKey.includes(',')) {
            const split = primaryKey.split(',').map(k => this.sanitizeKey(k)).filter(k => k.length > 0);
            foundKeys.push(...split);
        } else if (primaryKey.length > 0) {
            foundKeys.push(primaryKey);
        }

        // 2. Check for individual keys API_KEY1 through API_KEY5
        const envKeys = [
            (process.env as any).API_KEY1,
            (process.env as any).API_KEY2,
            (process.env as any).API_KEY3,
            (process.env as any).API_KEY4,
            (process.env as any).API_KEY5
        ];

        envKeys.forEach(raw => {
            const clean = this.sanitizeKey(raw);
            if (clean && !foundKeys.includes(clean)) {
                foundKeys.push(clean);
            }
        });

        this.keys = foundKeys;

        if (this.keys.length === 0) {
            console.error("ZestIslam: No valid API keys found in environment (Checked API_KEY, API_KEY1-5).");
        } else {
            console.log(`ZestIslam: API Manager initialized with ${this.keys.length} keys.`);
            this.keys.forEach((key, i) => {
                console.log(`Key #${i+1} check: Len=${key.length}, Start=${key.substring(0, 4)}...`);
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
