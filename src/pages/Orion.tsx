import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Compass, 
  Brain, 
  Stars,
  MessageSquare,
  Bot,
  Key,
  RefreshCw
} from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const PRESETS = [
  { icon: Stars, text: "Describe a cosmic sunset on Kepler-186f" },
  { icon: Compass, text: "Draft a short sci-fi story about a rogue star pilot" },
  { icon: Brain, text: "Give me 3 mind-bending facts about string theory" },
  { icon: MessageSquare, text: "Tell me a short witty joke about dark matter" }
];

export default function Orion() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('orion_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        text: "Greetings, traveler! ✦ I am **Orion AI**, your cosmic companion in the MiniVerse.\n\nAsk me anything! From complex quantum mathematics and programming code to creating space adventures or explaining daily phenomena—I'm ready to navigate the stars with you.",
        timestamp: new Date().toISOString()
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto reset of confirm state after 4 seconds
  useEffect(() => {
    if (showConfirmReset) {
      const timer = setTimeout(() => {
        setShowConfirmReset(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmReset]);

  // Save chat history to local storage
  useEffect(() => {
    localStorage.setItem('orion_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Handle auto scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Make a clean server-side POST API call to our proxy endpoint
      const response = await fetch('/api/orion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map(m => ({
            role: m.role,
            text: m.text
          }))
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        // Ignore json parse error if response isn't JSON
      }

      if (!response.ok) {
        const serverError = data?.error || '';
        if (serverError.includes('CONFIG_ERROR')) {
          throw new Error('CONFIG_ERROR');
        }
        if (serverError.toLowerCase().includes('api key expired') || serverError.toLowerCase().includes('key invalid') || serverError.toLowerCase().includes('api_key')) {
          throw new Error('API_KEY_EXPIRED');
        }
        throw new Error(serverError || 'Cosmic communication channel failed. Please check connection and try again.');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.text || 'Silence in deep space...',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_EXPIRED') {
        setError('Your Gemini API key appears to be expired or invalid. Please check your workspace Settings under the "Secrets" panel to configure or renew your GEMINI_API_KEY, then refresh the page to resume chatting.');
      } else if (err.message === 'CONFIG_ERROR') {
        setError('The GEMINI_API_KEY is not defined on Netlify. Please head to your Netlify Dashboard under Site Settings -> Environment Variables and register a new variable named GEMINI_API_KEY with your valid Gemini key.');
      } else {
        setError(err.message || 'An error occurred while connecting to Orion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const resetMessages: ChatMessage[] = [
      {
        id: 'welcome',
        role: 'model',
        text: "Orbit cleared! ✦ I am ready for our next journey. What would you like to explore?",
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(resetMessages);
    setError(null);
    setShowConfirmReset(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-screen max-h-screen bg-[#0f172a] text-white">
      
      {/* Upper header summary panel */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="text-white animate-pulse" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              Orion AI <span className="text-[10px] uppercase bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full tracking-widest">Active</span>
            </h2>
            <p className="text-[11px] font-bold text-indigo-400 capitalize tracking-widest mt-0.5">By MINIVERSE</p>
          </div>
        </div>

        {messages.length > 1 && (
          <button 
            onClick={() => {
              if (showConfirmReset) {
                handleClearHistory();
              } else {
                setShowConfirmReset(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all font-bold text-xs select-none active:scale-95 cursor-pointer ${
              showConfirmReset 
                ? 'bg-red-500/20 border-red-500/30 text-red-400 font-extrabold animate-pulse' 
                : 'border-white/5 bg-white/0 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-white/60'
            }`}
            title="Clear Chat History"
          >
            <Trash2 size={13} />
            <span>{showConfirmReset ? "Confirm Reset?" : "Reset Orbit"}</span>
          </button>
        )}
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isAI = m.role === 'model';
              return (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-4 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-indigo-400" />
                    </div>
                  )}

                  <div 
                    className={`max-w-[85%] rounded-3xl p-4 px-5 text-sm leading-relaxed ${
                      isAI 
                        ? 'p-4 rounded-tl-none bg-slate-900/40 text-slate-100 border border-white/5' 
                        : 'rounded-tr-none bg-indigo-600 text-white shadow-xl shadow-indigo-600/10'
                    }`}
                  >
                    {isAI ? (
                      <div className="markdown-body text-slate-200">
                        <Markdown>{m.text}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    )}
                    
                    <div className={`text-[9px] mt-1.5 lowercase opacity-40 text-right`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {!isAI && (
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white/50">Me</span>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-indigo-400" />
                </div>
                <div className="rounded-3xl rounded-tl-none p-4 px-5 bg-slate-900/40 text-slate-100 border border-white/5 shadow-md flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-300"></span>
                  </div>
                  <span className="text-xs text-white/50 tracking-wider">Consulting cosmic intelligence star networks...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto"
              >
                {error.includes('Settings') || error.includes('Netlify') ? (
                  <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl text-left shadow-xl shadow-indigo-950/20 animate-in fade-in zoom-in-95">
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/35">
                        <Key className="text-indigo-400" size={18} />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="font-extrabold text-sm text-indigo-200 tracking-tight">Cosmic Transmitter Key Required</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{error}</p>
                        <div className="pt-2">
                          <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs select-none active:scale-95 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                          >
                            <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '4s' }} />
                            <span>Retry Connection</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs text-center font-medium font-sans">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Preset cosmic prompts & input footer area */}
      <footer className="p-6 border-t border-white/10 shrink-0 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          
          {/* Presets - Show only when chat is basically empty or just welcome message */}
          {messages.length <= 1 && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="flex items-center gap-3 p-3.5 bg-white/5 hover:bg-indigo-600/10 hover:border-indigo-500/30 border border-white/5 rounded-2xl text-left text-xs transition-all active:scale-98 select-none font-medium cursor-pointer group"
                >
                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/20 transition-all text-white/50 group-hover:text-indigo-300 shrink-0">
                    <p.icon size={14} />
                  </div>
                  <span className="text-white/70 group-hover:text-white transition-colors line-clamp-1">{p.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Prompt Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Orion AI anything... (e.g. quantum science, coding, stories, general questions)"
              disabled={loading}
              className="w-full bg-[#131d35] border border-white/10 hover:border-white/15 focus:border-indigo-500 rounded-2xl py-4 pl-5 pr-14 text-sm outline-none transition-all placeholder-white/20 font-sans"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-600 active:scale-95 cursor-pointer max-h-[38px] flex items-center justify-center shadow-lg shadow-indigo-600/20"
            >
              <Send size={15} />
            </button>
          </form>

          <p className="text-[10px] text-white/30 text-center">
            Orion can occasionally formulate stellar inaccuracies. Consider cross-referencing important details.
          </p>

        </div>
      </footer>

    </div>
  );
}
