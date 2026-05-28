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
  RefreshCw,
  SlidersHorizontal,
  Globe,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Info,
  X,
  Activity,
  Cpu,
  GraduationCap,
  Music,
  Terminal,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';

interface GroundingSource {
  title?: string;
  uri?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: GroundingSource[];
  latency?: number;
  persona?: 'balanced' | 'academic' | 'creative' | 'coder';
}

const GET_PRESETS_FOR_PERSONA = (p: 'balanced' | 'academic' | 'creative' | 'coder') => {
  switch (p) {
    case 'academic':
      return [
        { icon: GraduationCap, text: "Compare quantum mechanics vs. general relativity visually" },
        { icon: Brain, text: "Explain string theory in 3 simple analogies" },
        { icon: Stars, text: "Contrast dark energy and dark matter in high detail" },
        { icon: Info, text: "Give me 3 scientific hypotheses of how the universe might end" }
      ];
    case 'creative':
      return [
        { icon: Stars, text: "Describe a cosmic sunset on Kepler-186f's copper mountains" },
        { icon: Compass, text: "Draft a sci-fi prologue of a rogue pilot entering a wormhole" },
        { icon: MessageSquare, text: "Imagine you are a sentient satellite orbiting Kepler-22b" },
        { icon: Music, text: "Write the lyrics of an space-farer's lunar retro ballad" }
      ];
    case 'coder':
      return [
        { icon: Terminal, text: "Write a React custom hook to fetch and persist Gemini chat history" },
        { icon: Brain, text: "Optimize a binary search algorithm in TypeScript with recursion" },
        { icon: SlidersHorizontal, text: "Draft a robust backend server rate-limiting controller in Node" },
        { icon: Bot, text: "Contrast relational SQL vs document-based databases" }
      ];
    default:
      return [
        { icon: Stars, text: "Describe a cosmic sunset on Kepler-186f" },
        { icon: Compass, text: "Draft a short sci-fi story about a rogue star pilot" },
        { icon: Brain, text: "Give me 3 mind-bending facts about string theory" },
        { icon: MessageSquare, text: "Tell me a short witty joke about dark matter" }
      ];
  }
};

const PERSONA_DETAILS = {
  balanced: {
    label: 'Cosmic Companion',
    icon: Sparkles,
    desc: 'General purpose assistant. Witty and informative.',
    color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'
  },
  academic: {
    label: 'Quantum Scholar',
    icon: GraduationCap,
    desc: 'Deep reasoning, physics, sciences, calculations.',
    color: 'border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10'
  },
  creative: {
    label: 'Starlight Bard',
    icon: Music,
    desc: 'Sci-fi narratives, metaphors, poetry, fiction.',
    color: 'border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-500/5 hover:bg-fuchsia-500/10'
  },
  coder: {
    label: 'Nebula Coder',
    icon: Terminal,
    desc: 'Clean code blocks, engineering, architecture algorithms.',
    color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
  }
};

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
        text: "Greetings, traveler! ✦ I am **Orion AI**, your upgraded cosmic companion in the MiniVerse.\n\nI have been armed with **Quantum Parameters**, enabling a dynamic split control platform. Configure my focus lenses and adjust my thermal cores in the menu.",
        timestamp: new Date().toISOString(),
        persona: 'balanced'
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Advanced upgraded state configurations
  const [persona, setPersona] = useState<'balanced' | 'academic' | 'creative' | 'coder'>(() => {
    return (localStorage.getItem('orion_persona') as any) || 'balanced';
  });
  const [temperature, setTemperature] = useState<number>(() => {
    return parseFloat(localStorage.getItem('orion_temperature') || '0.7');
  });
  const [systemDirective, setSystemDirective] = useState<string>(() => {
    return localStorage.getItem('orion_system_directive') || '';
  });
  const [showPresets, setShowPresets] = useState<boolean>(() => {
    return localStorage.getItem('orion_show_presets') !== 'false';
  });

  // Client visual indicators
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync to local systems
  useEffect(() => {
    localStorage.setItem('orion_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('orion_persona', persona);
  }, [persona]);

  useEffect(() => {
    localStorage.setItem('orion_temperature', temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem('orion_system_directive', systemDirective);
  }, [systemDirective]);

  useEffect(() => {
    localStorage.setItem('orion_show_presets', showPresets ? 'true' : 'false');
  }, [showPresets]);

  // Clean confirm timer
  useEffect(() => {
    if (showConfirmReset) {
      const timer = setTimeout(() => {
        setShowConfirmReset(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmReset]);

  // Handle auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Speech TTS Cleanup
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

    const startTime = performance.now();

    try {
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
          })),
          persona,
          temperature,
          systemDirective
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        // ignore JSON parse
      }

      if (!response.ok) {
        const serverError = data?.error || '';
        if (serverError.includes('CONFIG_ERROR')) {
          throw new Error('CONFIG_ERROR');
        }
        if (serverError.toLowerCase().includes('api key expired') || serverError.toLowerCase().includes('key invalid') || serverError.toLowerCase().includes('api_key')) {
          throw new Error('API_KEY_EXPIRED');
        }
        if (serverError === 'QUOTA_EXHAUSTED' || response.status === 429 || serverError.toLowerCase().includes('quota') || serverError.toLowerCase().includes('exhausted')) {
          throw new Error('QUOTA_EXHAUSTED');
        }
        throw new Error(serverError || 'Cosmic channel error. Please check connection and try again.');
      }

      const endTime = performance.now();
      const latencySeconds = parseFloat(((endTime - startTime) / 1000).toFixed(2));

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.text || 'Silence in deep space...',
        timestamp: new Date().toISOString(),
        sources: data.sources,
        latency: latencySeconds,
        persona: persona
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_EXPIRED') {
        setError('Your Gemini API key appears expired or invalid. Please configure a valid GEMINI_API_KEY in your Settings Secrets panel and refresh.');
      } else if (err.message === 'CONFIG_ERROR') {
        setError('The GEMINI_API_KEY is not defined. Please add it to Site settings environment variable parameters.');
      } else if (err.message === 'QUOTA_EXHAUSTED') {
        setError('QUOTA_EXHAUSTED');
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
        text: "Orbit cleared! ✦ Grounding filters and cores are active. What would you like to explore?",
        timestamp: new Date().toISOString(),
        persona: 'balanced'
      }
    ];
    setMessages(resetMessages);
    setError(null);
    setShowConfirmReset(false);
  };

  const toggleSpeech = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeakingId === id) {
        window.speechSynthesis.cancel();
        setIsSpeakingId(null);
      } else {
        window.speechSynthesis.cancel();
        // pre-process to strip markdown characters
        const clean = text
          .replace(/[#*`_~-]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // replace markdown links with title
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeakingId(null);
        utterance.onerror = () => setIsSpeakingId(null);
        window.speechSynthesis.speak(utterance);
        setIsSpeakingId(id);
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compute live local metrics safely
  const averageLatency = (() => {
    const latencies = messages.map(m => m.latency).filter((l): l is number => typeof l === 'number');
    if (latencies.length === 0) return null;
    return (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  })();

  const currentPresets = GET_PRESETS_FOR_PERSONA(persona);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full max-h-full bg-[#0a0f1d] text-white overflow-hidden font-sans">
      
      {/* Main chat layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-white/5 relative">
        
        {/* Upper Header panel */}
        <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/45 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative group">
              <Sparkles className="text-white animate-pulse" size={20} />
              <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                Orion AI
              </h2>
              <p className="text-[10px] text-white/50 flex items-center gap-1.5">
                <span>Your cosmic AI companion</span>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-400 font-bold uppercase">{persona} Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle controls sidepane visual */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 py-1.5 border rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all select-none cursor-pointer ${
                sidebarOpen 
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' 
                  : 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
              title="Quantum Parameters Panel"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Quantum Controls</span>
            </button>

            {messages.length > 1 && (
              <button 
                onClick={() => {
                  if (showConfirmReset) {
                    handleClearHistory();
                  } else {
                    setShowConfirmReset(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all font-bold text-xs select-none active:scale-95 cursor-pointer ${
                  showConfirmReset 
                    ? 'bg-red-500/20 border-red-500/30 text-red-400 font-extrabold animate-pulse' 
                    : 'border-white/5 bg-white/0 hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/20 text-white/60'
                }`}
                title="Reset conversation state"
              >
                <Trash2 size={13} />
                <span>{showConfirmReset ? "Reset?" : "Clear"}</span>
              </button>
            )}
          </div>
        </header>

        {/* Message feed area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide bg-[#0b101f]">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">

            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const isAI = m.role === 'model';
                const pDetails = m.persona ? PERSONA_DETAILS[m.persona] : null;
                const PersonaIcon = pDetails ? pDetails.icon : Bot;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-4 group/msg ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group">
                          <PersonaIcon size={18} className={`${m.persona === 'academic' ? 'text-amber-400' : m.persona === 'creative' ? 'text-fuchsia-400' : m.persona === 'coder' ? 'text-emerald-400' : 'text-indigo-400'} group-hover:scale-110 transition-transform`} />
                        </div>
                        {m.persona && (
                          <span className="text-[7.5px] uppercase tracking-wider px-1 bg-slate-950 text-slate-400 border border-white/5 rounded font-bold font-mono">
                            {m.persona}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col max-w-[85%] gap-1">
                      <div 
                        className={`rounded-3xl p-4 px-5 text-sm leading-relaxed ${
                          isAI 
                            ? 'rounded-tl-none bg-slate-900/50 text-slate-100 border border-white/5 relative overflow-hidden backdrop-blur-sm' 
                            : 'rounded-tr-none bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10'
                        }`}
                      >
                        {isAI ? (
                          <div className="markdown-body text-slate-200">
                            <Markdown>{m.text}</Markdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        )}
                        
                        {/* Search grounding source cards overlay */}
                        {isAI && m.sources && m.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/5 gap-2 flex flex-col">
                            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                              <Globe size={11} className="animate-pulse text-[#00ffd5]" />
                              <span>Grounded Search Streams:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {m.sources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-950/90 border border-white/5 hover:border-indigo-500/20 text-[10.5px] font-medium text-slate-300 hover:text-[#00ffd5] transition-all max-w-[210px] truncate"
                                  title={src.title}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] shrink-0 animate-ping" />
                                  <span className="truncate pr-0.5">{src.title || 'Verified Web Source'}</span>
                                  <ExternalLink size={10} className="opacity-40" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[9px] mt-2 opacity-40 text-right flex items-center justify-end gap-1.5">
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Tool hover actions bar */}
                      {isAI && m.id !== 'welcome' && (
                        <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500 justify-end h-5 select-none opacity-80 md:opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          {m.latency && (
                            <span className="font-mono text-[9px] text-slate-600 mr-2 flex items-center gap-1">
                              <Cpu size={10} /> Latency: {m.latency}s
                            </span>
                          )}
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:text-[#00ffd5] transition-colors rounded hover:bg-white/5"
                            title="Copy reply text"
                          >
                            {copiedId === m.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => toggleSpeech(m.id, m.text)}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 transition-colors rounded hover:bg-white/5 ${
                              isSpeakingId === m.id ? 'text-[#00ffd5] font-bold' : 'hover:text-[#00ffd5]'
                            }`}
                            title={isSpeakingId === m.id ? "Stop Speech" : "Speak text"}
                          >
                            {isSpeakingId === m.id ? <VolumeX size={11} /> : <Volume2 size={11} />}
                            <span>{isSpeakingId === m.id ? 'Mute' : 'Speak'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {!isAI && (
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-white/5 flex items-center justify-center shrink-0 shadow">
                        <span className="text-[10px] font-bold text-indigo-300">Me</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-white/5 flex items-center justify-center shrink-0 shadow animate-pulse">
                    <Bot size={18} className="text-indigo-400" />
                  </div>
                  <div className="rounded-3xl rounded-tl-none p-4 px-5 bg-slate-900/40 text-slate-100 border border-white/5 flex items-center gap-3.5 shadow-md">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-bounce delay-75"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
                    </div>
                    <span className="text-xs text-white/50 font-medium tracking-wide">
                      Orion AI processing quantum core nodes...
                    </span>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xl mx-auto w-full"
                >
                  {error === 'QUOTA_EXHAUSTED' ? (
                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-left shadow-2xl shadow-slate-950/45 animate-in fade-in zoom-in-95">
                      <div className="flex gap-4 items-start font-sans">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/35 text-amber-400">
                          <Activity className="animate-pulse" size={22} />
                        </div>
                        <div className="space-y-3 min-w-0 flex-1">
                          <div>
                            <h4 className="font-extrabold text-sm text-amber-300 tracking-tight flex items-center gap-2">
                              Quantum Signal Saturated (429 Quota Exceeded)
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed mt-1">
                              The shared Gemini API transmitter channel has reached its rate limits or message quota capacity. You can quickly bypass this by supplying your own custom API key at zero cost!
                            </p>
                          </div>
                          
                          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                            <span className="font-bold text-amber-400 text-[10px] uppercase tracking-wider block">How to attach your key:</span>
                            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed font-sans">
                              <li>Obtain a free key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={10} /></a> portal.</li>
                              <li>Open the <span className="font-semibold text-white">Settings panel</span> located in the bottom-left corner of this workspace.</li>
                              <li>Under the <span className="font-semibold text-white">Secrets / Environment Variables</span> tab, add a variable named <code className="bg-white/10 px-1 py-0.5 rounded text-amber-200">GEMINI_API_KEY</code> and set your key as the value.</li>
                              <li>Save changes, and then click the retry button below!</li>
                            </ol>
                          </div>

                          <div className="pt-1 flex items-center gap-3">
                            <button
                              onClick={() => { setError(null); }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs select-none active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                            >
                              <RefreshCw size={12} className="animate-spin-slow" />
                              <span>Retry Signal Channel</span>
                            </button>
                            <span className="text-[10px] text-slate-500">Your custom key prevents future rate constraints.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : error.includes('Settings') || error.includes('Netlify') ? (
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
                              <RefreshCw size={11} className="animate-spin-slow" />
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

        {/* Footer actions / inputs */}
        <footer className="p-6 border-t border-white/10 shrink-0 bg-slate-950/30 backdrop-blur-md relative z-10">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            
            {/* Persona Preset Prompts */}
            {showPresets && messages.length <= 1 && !loading && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Suggested for {persona} lens:</span>
                  <button 
                    type="button"
                    onClick={() => setShowPresets(false)}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Hide suggestions"
                  >
                    <X size={11} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentPresets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(p.text)}
                      className="flex items-center gap-3 p-3.5 bg-white/5 hover:bg-indigo-600/10 hover:border-indigo-500/30 border border-white/5 rounded-2xl text-left text-xs transition-all active:scale-98 select-none font-medium cursor-pointer group"
                    >
                      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/20 transition-all text-white/50 group-hover:text-[#00ffd5]/80 shrink-0">
                        <p.icon size={13} />
                      </div>
                      <span className="text-white/70 group-hover:text-white transition-colors line-clamp-1">{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main prompt input box */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="relative flex items-center"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask Orion anything... (Lens: ${persona})`}
                disabled={loading}
                className="w-full bg-[#11182c] border border-white/10 hover:border-white/15 focus:border-indigo-500 rounded-2xl py-4 pl-5 pr-14 text-sm outline-none transition-all placeholder-white/20 font-sans text-white focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-600 active:scale-95 cursor-pointer max-h-[38px] flex items-center justify-center shadow-lg shadow-indigo-600/20"
              >
                <Send size={15} />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-white/30 px-1">
              <span>Orion AI can generate inaccuracies. Ensure correctness before reference.</span>
            </div>

          </div>
        </footer>
      </div>

      {/* Upgraded Quantum Parameters Panel Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: window.innerWidth > 1024 ? 320 : '100%' }}
            exit={{ opacity: 0, width: 0 }}
            className={`w-full lg:w-80 shrink-0 bg-[#0c1224] border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto flex flex-col select-none`}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="text-indigo-400" size={17} />
                <h3 className="font-extrabold text-sm tracking-tight">Quantum Parameters</h3>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                title="Collapse Panel"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              
              {/* Persona selection blocks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400">Core Persona Lens</label>
                  <Cpu size={12} className="text-slate-500" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(PERSONA_DETAILS).map(([key, details]) => {
                    const active = persona === key;
                    const Icon = details.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setPersona(key as any)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active 
                            ? 'bg-indigo-600/10 border-indigo-500/60 text-white shadow-md' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border shrink-0 ${active ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold flex items-center gap-1">
                            {details.label}
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] shrink-0" />}
                          </div>
                          <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1 leading-tight">{details.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine-Tuning controls (Temperature) */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity size={13} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-300">Entropy Cores (Temp)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#00ffd5]">{temperature}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.2" 
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer bg-slate-800 rounded-lg appearance-none h-1.5"
                />
                <div className="flex items-center justify-between text-[8px] tracking-wide text-slate-500 font-bold uppercase">
                  <span>Cold Logic (0.1)</span>
                  <span>Supernova (1.2)</span>
                </div>
              </div>

              {/* Directive overrides */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold tracking-widest text-slate-400 block">Directive Override</label>
                <textarea
                  value={systemDirective}
                  onChange={(e) => setSystemDirective(e.target.value)}
                  placeholder="e.g. Include code blocks, Reply concisely, Translate in Spanish, Speak witty, etc."
                  rows={3}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 text-xs outline-none transition-all focus:border-indigo-500/60 text-white placeholder-white/20 resize-none font-sans"
                />
              </div>

              {/* Status Statistics */}
              <div className="pt-2 border-t border-white/5 space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Signal Diagnostics</span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-[9px] text-slate-500 block">Session Volume</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">{Math.max(0, messages.length - 1)} msg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-[9px] text-slate-500 block">Average Lag</span>
                    <span className="text-xs font-extrabold text-white mt-1 block">
                      {averageLatency ? `${averageLatency}s` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-white/10 bg-slate-950/20 text-[10px] text-white/35 font-medium leading-relaxed">
              These local directives alter Gemini 3.5 instructions in real-time. Direct key is active.
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
}
