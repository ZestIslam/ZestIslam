export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export interface PrayerTimeData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export interface QuranVerse {
  surahName: string;
  verseNumber: number;
  arabicText: string;
  translation: string;
  explanation: string;
}

export interface Hadith {
  book: string;
  hadithNumber: string;
  chapter: string;
  arabicText: string;
  translation: string;
  explanation: string;
  grade: string;
}

export interface HadithBook {
    id: string;
    name: string;
    arabicName: string;
    description: string;
    totalHadiths: number;
    editionId: string;
}

export interface GeneratedDua {
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
}

export interface UserProfile {
  name: string;
  email: string;
  joinedDate: Date;
}

export enum AppView {
  HOME = 'HOME',
  QURAN = 'QURAN',
  HADEES = 'HADEES',
  UNIFIED = 'UNIFIED',
  CHAT = 'CHAT',
  DUA = 'DUA',
  PRAYER = 'PRAYER',
  THUMBNAIL = 'THUMBNAIL',
  MEDIA = 'MEDIA',
  FINDER = 'FINDER',
  LIVE = 'LIVE',
  TASBIH = 'TASBIH',
  NAMES = 'NAMES',
  DREAM = 'DREAM',
  QUIZ = 'QUIZ',
  ABOUT = 'ABOUT',
  CONTACT = 'CONTACT',
  LOGIN = 'LOGIN',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface TadabburContent {
  paragraph: string;
  points: string[];
}

export interface TadabburResult {
  verseReference: string;
  english: TadabburContent;
  urdu: TadabburContent;
  hinglish: TadabburContent;
}

export interface SharhResult {
  hadithReference: string;
  english: TadabburContent;
  urdu: TadabburContent;
  hinglish: TadabburContent;
}

export interface DhikrSuggestion {
  arabic: string;
  transliteration: string;
  meaning: string;
  benefit: string;
  target: number;
}

export interface NameInsight {
  name: string;
  english: { meaning: string; reflection: string; application: string };
  urdu: { meaning: string; reflection: string; application: string };
  hinglish: { meaning: string; reflection: string; application: string };
}

export interface DreamResult {
    english: { interpretation: string; symbols: string[]; advice: string };
    urdu: { interpretation: string; symbols: string[]; advice: string };
    hinglish: { interpretation: string; symbols: string[]; advice: string };
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface SurahMeta {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export interface FullSurahVerse {
    number: number;
    text: string;
    translation: string;
    numberInSurah: number;
}
