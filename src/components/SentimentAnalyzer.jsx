import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Sparkles, ArrowUp, ArrowDown, Minus, Plus, Trash2, Shield, ChevronDown } from 'lucide-react';

const SAMPLE_HEADLINES = [
    "Apple stock surges to all-time high after record quarterly earnings",
    "Federal Reserve announces surprise interest rate cut",
    "Tech sector faces massive sell-off amid recession fears",
    "Inflation rises unexpectedly, consumer spending declines sharply",
    "Tesla reports strong growth in EV deliveries, beating analyst expectations"
];

const SentimentAnalyzer = () => {
    const [headlines, setHeadlines] = useState(['']);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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

    const addHeadline = () => {
        setHeadlines([...headlines, '']);
    };

    const removeHeadline = (index) => {
        if (headlines.length <= 1) return;
        setHeadlines(headlines.filter((_, i) => i !== index));
    };

    const updateHeadline = (index, value) => {
        const updated = [...headlines];
        updated[index] = value;
        setHeadlines(updated);
    };

    const loadSampleData = () => {
        setHeadlines([...SAMPLE_HEADLINES]);
        setResults(null);
        setError(null);
    };

    const analyzeSentiment = async () => {
        const validTexts = headlines.filter(h => h.trim().length > 0);
        if (validTexts.length === 0) {
            setError('Please enter at least one financial headline.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/sentiment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: validTexts, token: apiKey.trim() || undefined, hfToken: hfToken.trim() || undefined, geminiToken: geminiToken.trim() || undefined })
            });

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = data.error || 'Something went wrong.';
                if (data.details && Object.keys(data.details).length > 0) {
                    errorMessage += ' Details: ' + Object.entries(data.details).map(([k,v]) => `${k.toUpperCase()}=${v}`).join(' | ');
                }
                setError(errorMessage);
                setLoading(false);
                return;
            }

            setResults(data.results);
            setProvider(data.provider || 'groq');
        } catch (err) {
            setError('Could not connect to the backend server. Make sure it is running.');
        }
        setLoading(false);
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'text-emerald-400';
            case 'negative': return 'text-red-400';
            case 'neutral': return 'text-amber-400';
            default: return 'text-slate-400';
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return <ArrowUp size={18} />;
            case 'negative': return <ArrowDown size={18} />;
            case 'neutral': return <Minus size={18} />;
            default: return null;
        }
    };

    const getSentimentGlow = (sentiment) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'shadow-[0_0_15px_rgba(52,211,153,0.3)] border-emerald-500/30';
            case 'negative': return 'shadow-[0_0_15px_rgba(248,113,113,0.3)] border-red-500/30';
            case 'neutral': return 'shadow-[0_0_15px_rgba(251,191,36,0.3)] border-amber-500/30';
            default: return 'border-white/5';
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-fintech-darkCard/40 backdrop-blur-xl rounded-2xl p-6 shadow-glass border border-white/5 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Brain className="text-fintech-accent" size={24} />
                        Sentiment Engine
                    </h3>
                    <button
                        onClick={loadSampleData}
                        className="text-sm bg-fintech-secondary/20 hover:bg-fintech-secondary/40 text-fintech-accent border border-fintech-accent/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={14} />
                        Load Sample Headlines
                    </button>
                </div>

                <p className="text-slate-400 text-sm mb-6">
                    Enter financial news headlines below. Llama-3 AI will classify each as <span className="text-emerald-400">Positive</span>, <span className="text-red-400">Negative</span>, or <span className="text-amber-400">Neutral</span> sentiment.
                </p>

                <div className="mb-6 flex gap-3">
                    <input 
                        type="password"
                        placeholder="Paste your Groq API Key (gsk_...)"
                        value={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                        className="flex-1 bg-fintech-primary/40 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-600 focus:border-fintech-accent/50 outline-none transition-all text-sm"
                    />
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-xs text-fintech-accent underline flex items-center px-2">Get API Key</a>
                </div>

                {/* Hugging Face Fallback Token */}
                <button 
                    onClick={() => setShowFallback(!showFallback)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
                >
                    <Shield size={12} />
                    <span>Backup: Hugging Face / Gemini API</span>
                    <ChevronDown size={12} className={`transition-transform ${showFallback ? 'rotate-180' : ''}`} />
                </button>
                {showFallback && (
                    <>
                        <div className="mb-6 flex gap-3 animate-fadeIn">
                            <input 
                                type="password"
                                placeholder="Paste your Hugging Face Token (hf_...)"
                                value={hfToken}
                                onChange={(e) => saveHfToken(e.target.value)}
                                className="flex-1 bg-amber-900/20 border border-amber-500/20 rounded-xl px-4 py-2 text-white placeholder-slate-600 focus:border-amber-400/50 outline-none transition-all text-sm"
                            />
                            <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-xs text-amber-400 underline flex items-center px-2">Get HF Token</a>
                        </div>
                        <div className="mb-6 flex gap-3 animate-fadeIn">
                            <input 
                                type="password"
                                placeholder="Paste your Gemini API Key (AIza...)"
                                value={geminiToken}
                                onChange={(e) => saveGeminiToken(e.target.value)}
                                className="flex-1 bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-2 text-white placeholder-slate-600 focus:border-blue-400/50 outline-none transition-all text-sm"
                            />
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline flex items-center px-2">Get Gemini Key</a>
                        </div>
                    </>
                )}

                <div className="space-y-3">
                    {headlines.map((headline, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span className="text-fintech-accent font-mono text-sm w-6 text-right shrink-0">{index + 1}.</span>
                            <input
                                type="text"
                                value={headline}
                                onChange={(e) => updateHeadline(index, e.target.value)}
                                placeholder="Enter a financial news headline..."
                                className="flex-1 bg-fintech-primary/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-fintech-accent/50 focus:ring-1 focus:ring-fintech-accent/30 outline-none transition-all"
                            />
                            {headlines.length > 1 && (
                                <button
                                    onClick={() => removeHeadline(index)}
                                    className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={addHeadline}
                        className="text-sm border border-dashed border-white/10 text-slate-400 hover:text-white hover:border-white/30 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Plus size={14} /> Add Headline
                    </button>
                    <button
                        onClick={analyzeSentiment}
                        disabled={loading}
                        className="ml-auto bg-gradient-to-r from-fintech-accent to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-neon-cyan"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <Brain size={18} /> Analyze
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
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-fintech-accent" size={20} />
                            Analysis Results
                            {provider && (
                                <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${
                                    provider === 'groq' 
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                                        : provider === 'gemini'
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                    via {provider === 'groq' ? 'Groq (Llama-3)' : provider === 'gemini' ? 'Gemini (1.5 Flash)' : 'HuggingFace (FinBERT)'}
                                </span>
                            )}
                        </h3>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {['positive', 'negative', 'neutral'].map(sentiment => {
                                const count = results.filter(r => r.sentiment.toLowerCase() === sentiment).length;
                                return (
                                    <motion.div
                                        key={sentiment}
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        className={`bg-fintech-darkCard/60 backdrop-blur-md rounded-2xl p-4 text-center border ${getSentimentGlow(sentiment)}`}
                                    >
                                        <div className={`text-3xl font-extrabold ${getSentimentColor(sentiment)}`}>{count}</div>
                                        <div className="text-slate-400 text-sm capitalize mt-1">{sentiment}</div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {results.map((result, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-fintech-darkCard/40 backdrop-blur-xl rounded-2xl p-5 border transition-all ${getSentimentGlow(result.sentiment)}`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <p className="text-white text-sm flex-1 leading-relaxed">"{result.text}"</p>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className={`flex items-center gap-1 font-bold text-lg ${getSentimentColor(result.sentiment)}`}>
                                            {getSentimentIcon(result.sentiment)}
                                            <span className="capitalize">{result.sentiment}</span>
                                        </div>
                                        <span className="text-slate-500 text-sm">({result.confidence}%)</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SentimentAnalyzer;
