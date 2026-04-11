import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Loader2, Send, Zap, AlertTriangle, CheckCircle2, Shield, ChevronDown } from 'lucide-react';

const SAMPLE_PROMPTS = [
    "Analyze the market outlook for Apple stock in Q2 2026:",
    "What is the investment potential of Tesla given the current EV market trends:",
    "Provide a brief market analysis for the S&P 500 index considering recent inflation data:",
    "Analyze the risks and opportunities in the cryptocurrency market for conservative investors:",
    "What sectors should investors focus on during a period of rising interest rates:"
];

const MarketAnalyzer = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [aiStatus, setAiStatus] = useState(null);
    const [apiKey, setApiKey] = useState(localStorage.getItem('groq_token') || '');
    const [hfToken, setHfToken] = useState(localStorage.getItem('hf_token') || '');
    const [geminiToken, setGeminiToken] = useState(localStorage.getItem('gemini_token') || '');
    const [showFallback, setShowFallback] = useState(false);
    const [provider, setProvider] = useState(null);

    const saveApiKey = (val) => {
        setApiKey(val);
        localStorage.setItem('groq_token', val);
    };

    const saveHfToken = (val) => {
        setHfToken(val);
        localStorage.setItem('hf_token', val);
    };

    const saveGeminiToken = (val) => {
        setGeminiToken(val);
        localStorage.setItem('gemini_token', val);
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/ai-status');
            const data = await res.json();
            setAiStatus(data);
        } catch {
            setAiStatus({ status: 'offline', model_loaded: false });
        }
    };

    const generateAnalysis = async () => {
        if (!prompt.trim()) {
            setError('Please enter a market analysis prompt.');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch('/api/market-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt.trim(), max_tokens: 250, token: apiKey.trim() || undefined, hfToken: hfToken.trim() || undefined, geminiToken: geminiToken.trim() || undefined })
            });

            const data = await res.json();

            if (!res.ok) {
                let errorMessage = data.error || 'Something went wrong.';
                if (data.details && Object.keys(data.details).length > 0) {
                    errorMessage += ' Details: ' + Object.entries(data.details).map(([k,v]) => `${k.toUpperCase()}=${v}`).join(' | ');
                }
                setError(errorMessage);
                setLoading(false);
                return;
            }

            setResponse(data);
            setProvider(data.provider || 'groq');
        } catch (err) {
            setError('Could not connect to the backend. Make sure npm run dev is running.');
        }
        setLoading(false);
    };

    const isOnline = aiStatus?.status === 'ok';

    return (
        <div className="space-y-6 mt-8">         
            <div className={`flex items-center gap-3 px-4 py-3 rounded text-sm ${isOnline ? 'bg-cf-tertiary/10 text-cf-tertiary' : 'bg-cf-error/10 text-cf-error'}`}>
                <div className={isOnline ? 'pulse-live' : 'w-2 h-2 rounded-full bg-cf-error'}></div>
                <span>Market Analysis is <strong>{isOnline ? 'online' : 'offline'}</strong>.</span>
                {aiStatus?.fallback === 'huggingface' && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-cf-secondary/10 text-cf-secondary px-2 py-0.5 rounded">HF Backup Ready</span>
                )}
            </div>

            <div className="bg-cf-surface-high rounded p-6 relative overflow-hidden">
                <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cf-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

                <h3 className="font-display text-xl font-bold text-cf-on-surface flex items-center gap-2 mb-2">
                    <Cpu className="text-cf-secondary" size={20} />
                    Market Analysis
                </h3>
                <p className="text-cf-on-muted text-sm mb-5">
                    Ask for AI-powered market analysis insights using Llama-3 parsing via Groq's high-speed chips.
                </p>

                <div className="mb-4 flex gap-3">
                    <input 
                        type="password"
                        placeholder="Paste your Groq API Key (gsk_...)"
                        value={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                        className="input-bottomline flex-1"
                    />
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-xs text-cf-secondary hover:underline flex items-center px-2">Get Key</a>
                </div>

                {/* Fallback tokens */}
                <button 
                    onClick={() => setShowFallback(!showFallback)}
                    className="flex items-center gap-2 text-xs text-cf-on-muted hover:text-cf-on-surface transition-colors mb-3"
                >
                    <Shield size={12} />
                    <span>Backup: Hugging Face / Gemini API</span>
                    <ChevronDown size={12} className={`transition-transform ${showFallback ? 'rotate-180' : ''}`} />
                </button>
                {showFallback && (
                    <>
                        <div className="mb-4 flex gap-3 animate-fadeIn">
                            <input 
                                type="password"
                                placeholder="Hugging Face Token (hf_...)"
                                value={hfToken}
                                onChange={(e) => saveHfToken(e.target.value)}
                                className="input-bottomline flex-1"
                                style={{ borderBottomColor: '#d674ff' }}
                            />
                            <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-xs text-cf-secondary hover:underline flex items-center px-2">Get Token</a>
                        </div>
                        <div className="mb-4 flex gap-3 animate-fadeIn">
                            <input 
                                type="password"
                                placeholder="Gemini API Key (AIza...)"
                                value={geminiToken}
                                onChange={(e) => saveGeminiToken(e.target.value)}
                                className="input-bottomline flex-1"
                                style={{ borderBottomColor: '#00eefc' }}
                            />
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-cf-primary-container hover:underline flex items-center px-2">Get Key</a>
                        </div>
                    </>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                    {SAMPLE_PROMPTS.slice(0, 3).map((sp, i) => (
                        <button
                            key={i}
                            onClick={() => setPrompt(sp)}
                            className="btn-ghost text-xs px-3 py-1.5"
                        >
                            {sp.substring(0, 50)}...
                        </button>
                    ))}
                </div>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your market analysis prompt..."
                    rows={4}
                    className="w-full bg-cf-surface-lowest rounded p-4 text-cf-on-surface placeholder-cf-outline text-sm focus:outline-none focus:ring-1 focus:ring-cf-secondary/40 transition-all resize-none"
                />

                <div className="flex justify-end mt-4">
                    <button
                        onClick={generateAnalysis}
                        disabled={loading}
                        className="bg-cf-gradient-secondary text-white font-bold px-6 py-2.5 rounded transition-all flex items-center gap-2 disabled:opacity-40 shadow-glow-secondary hover:shadow-[0_0_24px_rgba(214,116,255,0.35)] text-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Generating...
                            </>
                        ) : (
                            <>
                                <Send size={14} /> Generate Analysis
                            </>
                        )}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-cf-error/10 text-cf-error p-4 rounded text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {response && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-cf-surface-high rounded p-6 shadow-glow-secondary relative overflow-hidden"
                    >
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-cf-secondary/10 rounded-full blur-[60px] pointer-events-none"></div>
                        
                        <h4 className="font-display text-lg font-bold text-cf-on-surface flex items-center gap-2 mb-4">
                            <Zap className="text-cf-secondary" size={18} />
                            AI-Generated Market Analysis
                            {provider && (
                                <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded ${
                                    provider === 'groq' 
                                        ? 'bg-cf-primary/10 text-cf-primary' 
                                        : provider === 'gemini'
                                            ? 'bg-cf-primary-container/10 text-cf-primary-container'
                                            : 'bg-cf-secondary/10 text-cf-secondary'
                                }`}>
                                    via {provider === 'groq' ? 'Groq (Llama-3)' : provider === 'gemini' ? 'Gemini (1.5 Flash)' : 'HuggingFace (Mistral-7B)'}
                                </span>
                            )}
                        </h4>
                        
                        <div className="bg-cf-surface-lowest rounded p-4 mb-3">
                            <p className="text-label-sm text-cf-on-muted mb-1">PROMPT</p>
                            <p className="text-cf-on-surface text-sm">{response.prompt}</p>
                        </div>

                        <div className="bg-cf-surface-lowest rounded p-4">
                            <p className="text-label-sm text-cf-secondary mb-2">RESPONSE</p>
                            <p className="text-cf-on-surface leading-relaxed whitespace-pre-wrap text-sm">{response.response}</p>
                        </div>

                        <p className="text-cf-on-muted text-xs mt-4">
                            ⚠️ This is AI-generated analysis and should not be treated as financial advice.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketAnalyzer;
