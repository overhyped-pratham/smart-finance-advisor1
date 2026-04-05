import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Loader2, Send, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

    const saveApiKey = (val) => {
        setApiKey(val);
        localStorage.setItem('groq_token', val);
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

        if (!apiKey.trim()) {
            setError('Please enter your Groq API Key.');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch('/api/market-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt.trim(), max_tokens: 250, token: apiKey.trim() })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong.');
                setLoading(false);
                return;
            }

            setResponse(data);
        } catch (err) {
            setError('Could not connect to the backend. Make sure npm run dev is running.');
        }
        setLoading(false);
    };

    const isOnline = aiStatus?.status === 'ok';

    return (
        <div className="space-y-6 mt-8">         
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                <CheckCircle2 size={16} />
                <span>Market Analysis is <strong>{isOnline ? 'online' : 'offline'}</strong>.</span>
            </div>

            <div className="bg-fintech-darkCard/40 backdrop-blur-xl rounded-2xl p-6 shadow-glass border border-white/5 relative overflow-hidden">
                <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-fintech-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <Cpu className="text-fintech-secondary" size={22} />
                    Market Analysis
                </h3>
                <p className="text-slate-400 text-sm mb-5">
                    Ask for AI-powered market analysis insights using Llama-3 parsing via Groq's high-speed chips.
                </p>

                <div className="mb-4 flex gap-3">
                    <input 
                        type="password"
                        placeholder="Paste your Groq API Key (gsk_...)"
                        value={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                        className="flex-1 bg-fintech-primary/40 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-600 focus:border-fintech-secondary/50 outline-none transition-all text-sm"
                    />
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-xs text-fintech-secondary underline flex items-center px-2">Get API Key</a>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {SAMPLE_PROMPTS.slice(0, 3).map((sp, i) => (
                        <button
                            key={i}
                            onClick={() => setPrompt(sp)}
                            className="text-xs bg-fintech-secondary/10 hover:bg-fintech-secondary/20 text-blue-300 border border-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
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
                    className="w-full bg-fintech-primary/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-fintech-secondary/50 focus:ring-1 focus:ring-fintech-secondary/30 outline-none transition-all resize-none"
                />

                <div className="flex justify-end mt-4">
                    <button
                        onClick={generateAnalysis}
                        disabled={loading}
                        className="bg-gradient-to-r from-fintech-secondary to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 shadow-neon-purple"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Generating...
                            </>
                        ) : (
                            <>
                                <Send size={16} /> Generate Analysis
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
                        className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm"
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
                        className="bg-fintech-darkCard/40 backdrop-blur-xl rounded-2xl p-6 shadow-glass border border-fintech-secondary/20 relative overflow-hidden"
                    >
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-fintech-secondary/10 rounded-full blur-[60px] pointer-events-none"></div>
                        
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <Zap className="text-fintech-secondary" size={18} />
                            AI-Generated Market Analysis
                        </h4>
                        
                        <div className="bg-fintech-primary/30 rounded-xl p-4 mb-3 border border-white/5">
                            <p className="text-slate-400 text-xs font-medium mb-1">PROMPT</p>
                            <p className="text-slate-300 text-sm">{response.prompt}</p>
                        </div>

                        <div className="bg-fintech-primary/30 rounded-xl p-4 border border-fintech-secondary/10">
                            <p className="text-fintech-secondary text-xs font-medium mb-2">RESPONSE</p>
                            <p className="text-white leading-relaxed whitespace-pre-wrap">{response.response}</p>
                        </div>

                        <p className="text-slate-600 text-xs mt-4">
                            ⚠️ This is AI-generated analysis and should not be treated as financial advice. Always consult a licensed financial advisor.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketAnalyzer;
