
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Sparkles, Trash2, Mic, MicOff, User, Lock, LogIn, Plus, MessageSquare, Menu, X, ChevronLeft, Edit3 } from 'lucide-react';
import { getScholarChatResponse, generateChatTitle } from '../services/geminiService';
import { getUserConversations, getConversationMessages, saveUserChatMessage, deleteConversation, updateConversationTitle } from '../services/userService';
import { Message, UserProfile, Conversation } from '../types';
import { marked } from 'marked';

interface IslamicChatProps {
    user: UserProfile | null;
    onLoginClick: () => void;
}

const IslamicChat: React.FC<IslamicChatProps> = ({ user, onLoginClick }) => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // UI State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load Conversations on Mount
  useEffect(() => {
    if (user) {
        loadConversations();
    } else {
        // Guest mode default init
        setMessages([{
            id: '1',
            role: 'model',
            content: `Assalamu Alaykum. I am the ZestIslam Scholar, powered by Google Gemini. How can I assist you in your spiritual journey today?`,
            timestamp: new Date()
        }]);
    }
  }, [user]);

  const loadConversations = async () => {
      if (!user) return;
      setLoadingHistory(true);
      const convs = await getUserConversations(user.email);
      setConversations(convs);
      
      // If there are conversations, load the most recent one
      if (convs.length > 0 && !currentConversationId) {
          selectConversation(convs[0].id);
      } else if (convs.length === 0) {
          startNewChat(false);
      }
      setLoadingHistory(false);
  };

  const selectConversation = async (id: string) => {
      setCurrentConversationId(id);
      setLoading(true);
      const msgs = await getConversationMessages(id);
      if (msgs.length === 0) {
           setMessages([{
                id: '1',
                role: 'model',
                content: `Assalamu Alaykum ${user?.name}. I am the ZestIslam Scholar. How can I help?`,
                timestamp: new Date()
            }]);
      } else {
          setMessages(msgs);
      }
      setSidebarOpen(false); // Close sidebar on mobile selection
      setLoading(false);
  };

  const startNewChat = (shouldCreateRecord = false) => {
      const newId = crypto.randomUUID();
      setCurrentConversationId(newId);
      setMessages([{
          id: '1',
          role: 'model',
          content: `Assalamu Alaykum ${user ? user.name : ''}. I am the ZestIslam Scholar. Ask me anything about Islam, Quran, or Hadith.`,
          timestamp: new Date()
      }]);
      setSidebarOpen(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!user) return;
      if (window.confirm("Delete this conversation history?")) {
          await deleteConversation(user.email, id);
          
          // Optimistic UI Update
          const updated = conversations.filter(c => c.id !== id);
          setConversations(updated);
          
          if (currentConversationId === id) {
              if (updated.length > 0) selectConversation(updated[0].id);
              else startNewChat();
          }
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Clear input
    setInput('');
    
    let activeId = currentConversationId;
    let isNew = false;
    let title = 'New Conversation';

    if (!activeId) {
        activeId = crypto.randomUUID();
        setCurrentConversationId(activeId);
    }

    if (user && !conversations.find(c => c.id === activeId)) {
        isNew = true;
        title = text.slice(0, 20) + '...'; // Temporary title
    }

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        conversationId: activeId
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    if (user && activeId) {
        await saveUserChatMessage(user.email, activeId, userMsg, isNew, title);
        
        // If new, generate a better title in background
        if (isNew) {
            loadConversations(); // Refresh list immediately with temp title
            generateChatTitle(userMsg.content).then(async (aiTitle) => {
                if (user && activeId) {
                    await updateConversationTitle(user.email, activeId, aiTitle);
                    loadConversations(); // Refresh again with AI title
                }
            });
        }
    }

    // Get Response
    // We use the current 'messages' state (which doesn't have the new msg yet due to closure) 
    // but the API expects history + new prompt separate, or full history. 
    // our service takes (history, message).
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const response = await getScholarChatResponse(history, userMsg.content);

    const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: new Date(),
        conversationId: activeId
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);

    if (user && activeId) {
        await saveUserChatMessage(user.email, activeId, botMsg);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser.");
        return;
    }

    try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; 
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            // Auto-send the message when speech is recognized
            sendMessage(transcript);
        };
        recognitionRef.current = recognition;
        recognition.start();
    } catch (e) {
        setIsListening(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

      {/* --- SIDEBAR (HISTORY) --- */}
      <div className={`absolute lg:relative z-30 h-full w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Your Chats</h3>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-4">
              <button 
                onClick={() => startNewChat(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 dark:shadow-none hover:shadow-xl active:scale-95"
              >
                  <Plus className="w-5 h-5" /> New Conversation
              </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
              {loadingHistory ? (
                  <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div>
              ) : user ? (
                  conversations.length > 0 ? (
                      conversations.map(conv => (
                          <div 
                            key={conv.id}
                            onClick={() => selectConversation(conv.id)}
                            className={`group p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden ${
                                currentConversationId === conv.id 
                                ? 'bg-white dark:bg-slate-800 border-emerald-500/30 shadow-sm' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-900 border-transparent'
                            }`}
                          >
                              {currentConversationId === conv.id && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-full"></div>
                              )}
                              <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                      <MessageSquare className={`w-4 h-4 shrink-0 ${currentConversationId === conv.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                                      <h4 className={`text-sm font-bold truncate ${currentConversationId === conv.id ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                          {conv.title || 'New Conversation'}
                                      </h4>
                                  </div>
                                  <button 
                                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                                  >
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                              <p className="text-xs text-slate-400 truncate pl-7 opacity-80">{conv.lastMessage}</p>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-10 opacity-50">
                          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">No chat history found.</p>
                      </div>
                  )
              ) : (
                  <div className="text-center py-12 px-4 bg-slate-100 dark:bg-slate-900/50 rounded-3xl m-2 border border-slate-200 dark:border-slate-800">
                      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">Sign in to save your conversations and access them anywhere.</p>
                      <button onClick={onLoginClick} className="text-xs font-bold text-emerald-600 hover:underline flex items-center justify-center gap-1 mx-auto">
                          <LogIn className="w-3 h-3" /> Sign In Now
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col relative w-full lg:w-auto">
        
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-20 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">ZestIslam Scholar</h3>
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Powered by Gemini AI</p>
                    </div>
                </div>
            </div>
            
            {!user && (
                <button 
                    onClick={onLoginClick}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 rounded-xl text-xs font-bold text-white hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-all"
                >
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
            )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((msg, idx) => (
            <div
                key={msg.id}
                className={`flex gap-4 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
                {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-2 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                )}
                
                <div
                className={`max-w-[85%] md:max-w-[75%] p-5 text-sm leading-relaxed shadow-sm transition-all relative ${
                    msg.role === 'user'
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white rounded-[2rem] rounded-tr-none shadow-lg'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-[2rem] rounded-tl-none border border-slate-100 dark:border-slate-800'
                }`}
                >
                {msg.role === 'model' ? (
                    <div 
                        className="prose prose-sm prose-emerald dark:prose-invert max-w-none [&>p]:mb-3 last:[&>p]:mb-0 font-arabic"
                        dir="auto"
                        dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} 
                    />
                ) : (
                    <p dir="auto" className="whitespace-pre-wrap font-arabic">{msg.content}</p>
                )}
                </div>
            </div>
            ))}
            {loading && (
                <div className="flex justify-start gap-4 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-5 py-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-20">
            <form onSubmit={handleSend} className="relative flex items-end gap-3 max-w-4xl mx-auto">
                <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-4 rounded-2xl transition-all shadow-sm ${
                        isListening 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500 animate-pulse ring-1 ring-red-200 dark:ring-red-900' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <div className="flex-1 relative bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all flex items-center shadow-inner">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Ask the scholar..."}
                        className="w-full px-6 py-4 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white placeholder:text-slate-400"
                        dir="auto"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="mr-2 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:scale-90 shadow-md shadow-emerald-200 dark:shadow-none"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default IslamicChat;
