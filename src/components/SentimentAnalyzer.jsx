import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Sparkles, ArrowUp, ArrowDown, Minus, Plus, Trash2, Shield, ChevronDown } from 'lucide-react';

const SAMPLE_HEADLINES = [
    "Apple stock surges to all-time high after record quarterly earnings",
    "Federal Reserve announces surprise interest rate cut",
    "Tech sector faces massive sell-off amid recession fears",
    "Inflation rises unexpectedly, consumer spending declines sharply",
    "Tesla reports strong growth in EV deliveries, beating analyst expectations",
    "Global markets rally as supply chain constraints begin to ease",
    "Oil prices plunge to 5-month low amid slow demand recovery",
    "Nvidia unveils next-generation AI chip, sending shares up 8%",
    "Major retail chain declares bankruptcy after consecutive quarterly losses",
    "Housing market cools down as mortgage rates hit 7% mark"
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
            case 'positive': return 'text-cf-tertiary';
            case 'negative': return 'text-cf-error';
            case 'neutral': return 'text-cf-primary';
            default: return 'text-cf-on-muted';
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
            case 'positive': return 'shadow-glow-tertiary';
            case 'negative': return 'shadow-glow-error';
            case 'neutral': return 'shadow-glow-primary';
            default: return '';
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-cf-surface-high rounded p-6 relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-cf-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="font-display text-xl font-bold text-cf-on-surface flex items-center gap-2">
                        <Brain className="text-cf-primary" size={22} />
                        Sentiment Engine
                    </h3>
                    <button
                        onClick={loadSampleData}
                        className="btn-ghost text-sm flex items-center gap-2"
                    >
                        <Sparkles size={14} />
                        Load Samples
                    </button>
                </div>

                <p className="text-cf-on-muted text-sm mb-6">
                    Enter financial news headlines below. AI will classify each as <span className="text-cf-tertiary">Positive</span>, <span className="text-cf-error">Negative</span>, or <span className="text-cf-primary">Neutral</span> sentiment.
                </p>

                <div className="mb-6 flex gap-3">
                    <input 
                        type="password"
                        placeholder="Paste your Groq API Key (gsk_...)"
                        value={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                        className="input-bottomline flex-1"
                    />
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-xs text-cf-primary flex items-center px-2 hover:underline">Get Key</a>
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
                            <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-xs text-cf-secondary flex items-center px-2 hover:underline">Get Token</a>
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
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-cf-primary-container flex items-center px-2 hover:underline">Get Key</a>
                        </div>
                    </>
                )}

                <div className="space-y-3">
                    {headlines.map((headline, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span className="text-cf-primary font-mono text-sm w-6 text-right shrink-0">{index + 1}.</span>
                            <input
                                type="text"
                                value={headline}
                                onChange={(e) => updateHeadline(index, e.target.value)}
                                placeholder="Enter a financial news headline..."
                                className="input-bottomline flex-1"
                            />
                            {headlines.length > 1 && (
                                <button
                                    onClick={() => removeHeadline(index)}
                                    className="text-cf-on-muted hover:text-cf-error p-2 rounded hover:bg-cf-error/10 transition-colors shrink-0"
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
                        className="btn-ghost text-sm flex items-center gap-2"
                    >
                        <Plus size={14} /> Add Headline
                    </button>
                    <button
                        onClick={analyzeSentiment}
                        disabled={loading}
                        className="btn-primary ml-auto flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <Brain size={16} /> Analyze
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
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h3 className="font-display text-xl font-bold text-cf-on-surface flex items-center gap-2">
                            <Sparkles className="text-cf-primary" size={20} />
                            Analysis Results
                            {provider && (
                                <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded ${
                                    provider === 'groq' 
                                        ? 'bg-cf-primary/10 text-cf-primary' 
                                        : provider === 'gemini'
                                            ? 'bg-cf-primary-container/10 text-cf-primary-container'
                                            : 'bg-cf-secondary/10 text-cf-secondary'
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
                                        className={`bg-cf-surface-high rounded p-4 text-center ${getSentimentGlow(sentiment)}`}
                                    >
                                        <div className={`text-3xl font-display font-bold ${getSentimentColor(sentiment)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</div>
                                        <div className="text-cf-on-muted text-label-sm mt-1">{sentiment}</div>
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
                                className={`bg-cf-surface-high rounded p-5 transition-all ${getSentimentGlow(result.sentiment)}`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <p className="text-cf-on-surface text-sm flex-1 leading-relaxed">"{result.text}"</p>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className={`flex items-center gap-1 font-display font-bold text-lg ${getSentimentColor(result.sentiment)}`}>
                                            {getSentimentIcon(result.sentiment)}
                                            <span className="capitalize">{result.sentiment}</span>
                                        </div>
                                        <span className="text-cf-on-muted text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>({result.confidence}%)</span>
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
