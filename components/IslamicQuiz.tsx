
import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, RefreshCw, Trophy, Loader2, Brain, Target, Clock, ArrowRight, Settings2, Sparkles } from 'lucide-react';
import { generateQuiz } from '../services/geminiService';
import { QuizQuestion } from '../types';

const TOPICS = [
    "General Knowledge",
    "Quranic Stories",
    "Life of Prophet (Seerah)",
    "Salah & Fiqh",
    "Islamic History"
];

const IslamicQuiz: React.FC = () => {
    // Config State
    const [topic, setTopic] = useState('General Knowledge');
    const [customTopic, setCustomTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [questionCount, setQuestionCount] = useState<number>(5);
    
    // Game State
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);

    const startQuiz = async () => {
        setLoading(true);
        const finalTopic = customTopic.trim() || topic;
        const q = await generateQuiz(finalTopic, difficulty, questionCount);
        setQuestions(q);
        setCurrentIdx(0);
        setScore(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setQuizStarted(true);
        setLoading(false);
    };

    const handleAnswer = (idx: number) => {
        if (selectedOption !== null) return; 
        setSelectedOption(idx);
        setShowExplanation(true);
        if (idx === questions[currentIdx].correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setQuizStarted(false); // End Quiz
        }
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setQuestions([]);
        setScore(0);
    }

    // --- RENDER LOADING ---
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-emerald-50 dark:border-emerald-900/30">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                    <Brain className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-6 font-medium animate-pulse">Consulting the archives...</p>
            </div>
        );
    }

    // --- RENDER RESULTS ---
    if (!quizStarted && questions.length > 0) {
        const percentage = Math.round((score / questions.length) * 100);
        let feedback = "Good Effort!";
        if (percentage === 100) feedback = "Masha'Allah, Perfect!";
        else if (percentage >= 80) feedback = "Excellent Knowledge!";
        else if (percentage < 50) feedback = "Keep Learning!";

        return (
             <div className="max-w-xl mx-auto animate-fade-in py-12">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-emerald-50 dark:border-emerald-900/30 shadow-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                    
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Trophy className="w-12 h-12 text-yellow-500 dark:text-yellow-400 drop-shadow-sm" />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{feedback}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">You answered {score} out of {questions.length} correctly.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{score * 10} pts</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</p>
                        </div>
                    </div>

                    <button 
                        onClick={resetQuiz}
                        className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" /> Play Again
                    </button>
                </div>
             </div>
        )
    }

    // --- RENDER CONFIG (START SCREEN) ---
    if (!quizStarted) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <div className="text-center space-y-2 mb-4">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Islamic Knowledge Quiz</h2>
                    <p className="text-slate-500 dark:text-slate-400">Test and expand your knowledge of the Deen.</p>
                </div>
                
                <div className="grid md:grid-cols-12 gap-6">
                    {/* Left: Configuration */}
                    <div className="md:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-emerald-50 dark:border-emerald-900/30 space-y-8">
                        
                        {/* Topics */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Brain className="w-4 h-4" /> Select Topic
                            </h3>
                            <div className="flex flex-wrap gap-3 mb-4">
                                {TOPICS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setTopic(t); setCustomTopic(''); }}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                            topic === t && !customTopic 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <input 
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="Or type a custom topic..."
                                className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-slate-800 dark:text-white transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Difficulty */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Difficulty
                                </h3>
                                <div className="space-y-2">
                                    {['easy', 'medium', 'hard'].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d as any)}
                                            className={`w-full p-3 rounded-xl text-left text-sm font-medium border-2 transition-all capitalize ${
                                                difficulty === d 
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                                                : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Count */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Questions
                                </h3>
                                <div className="space-y-2">
                                    {[5, 10, 15].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setQuestionCount(c)}
                                            className={`w-full p-3 rounded-xl text-left text-sm font-medium border-2 transition-all ${
                                                questionCount === c
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                                                : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            {c} Questions
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="md:col-span-4 flex flex-col justify-center">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2.5rem] p-8 text-white text-center shadow-xl relative overflow-hidden group cursor-pointer" onClick={startQuiz}>
                             <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                             
                             <div className="relative z-10 space-y-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-emerald-100">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-1">Start Quiz</h3>
                                    <p className="text-emerald-100 text-sm opacity-90">Ready to challenge yourself?</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER GAME (QUIZ ACTIVE) ---
    const q = questions[currentIdx];

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full uppercase tracking-wider">
                        Q{currentIdx + 1}/{questions.length}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                        {difficulty}
                    </span>
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Score: {score}</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
                    style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                ></div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                <div className="p-8 md:p-10">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 leading-snug">{q.question}</h3>
                    
                    <div className="space-y-4">
                        {q.options.map((opt, idx) => {
                            let statusClass = "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent text-slate-700 dark:text-slate-200";
                            if (selectedOption !== null) {
                                if (idx === q.correctIndex) statusClass = "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-md";
                                else if (idx === selectedOption) statusClass = "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-200 shadow-md";
                                else statusClass = "bg-slate-50 dark:bg-slate-800 opacity-40 grayscale";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selectedOption !== null}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium flex justify-between items-center group ${statusClass}`}
                                >
                                    <span className="text-lg">{opt}</span>
                                    {selectedOption !== null && idx === q.correctIndex && <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
                                    {selectedOption !== null && idx === selectedOption && idx !== q.correctIndex && <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {showExplanation && (
                    <div className="bg-emerald-50/80 dark:bg-emerald-900/20 p-8 border-t border-emerald-100 dark:border-emerald-800/50 backdrop-blur-sm animate-fade-in-up">
                        <div className="flex gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300 h-fit">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-1">Explanation</h4>
                                <p className="text-sm text-emerald-800 dark:text-emerald-200/80 leading-relaxed">
                                    {q.explanation}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={nextQuestion}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 group"
                        >
                            {currentIdx === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IslamicQuiz;
