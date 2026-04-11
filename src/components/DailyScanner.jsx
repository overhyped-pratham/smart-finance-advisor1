import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Loader2, Sparkles, AlertCircle, RefreshCw, BarChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DailyScanner = () => {
    const [scanData, setScanData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const performScan = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use serverless API instead of localhost:5001
            const res = await fetch('/api/scan');
            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error('Scanner returned invalid response. Try again.');
            }
            if (!res.ok) throw new Error(data.error || 'Failed to complete market scan.');
            setScanData(data);
        } catch (err) {
            setError(err.message || "Failed to reach the AI scanner.");
        } finally {
            setLoading(false);
        }
    };

    const getSignalColor = (signal) => {
        switch (signal) {
            case 'BUY': return 'text-cf-tertiary bg-cf-tertiary/10';
            case 'SELL': return 'text-cf-error bg-cf-error/10';
            case 'HOLD': return 'text-cf-primary bg-cf-primary/10';
            default: return 'text-cf-on-muted bg-cf-on-muted/10';
        }
    };

    const getSignalIcon = (signal) => {
        switch (signal) {
            case 'BUY': return <TrendingUp size={14} />;
            case 'SELL': return <TrendingDown size={14} />;
            default: return <Minus size={14} />;
        }
    };

    return (
        <div className="space-y-6 mt-12 mb-8">
            <div className="bg-cf-surface-high rounded p-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-cf-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="font-display text-xl font-bold text-cf-on-surface flex items-center gap-2">
                            <Radar className="text-cf-secondary" size={22} />
                            Daily AI Market Scanner
                        </h3>
                        <p className="text-cf-on-muted text-sm mt-1">
                            Analyzes top NSE stocks using RSI & MACD indicators to find technical opportunities.
                        </p>
                    </div>
                    <button
                        onClick={performScan}
                        disabled={loading}
                        className="bg-cf-gradient-secondary text-white font-bold px-5 py-2.5 rounded transition-all flex items-center gap-2 shadow-glow-secondary hover:shadow-[0_0_24px_rgba(214,116,255,0.35)] text-sm disabled:opacity-50"
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Scanning...</> : <><RefreshCw size={16} /> Run Scan</>}
                    </button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-cf-error/10 text-cf-error p-4 rounded text-sm flex items-start gap-3 mb-6"
                        >
                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {loading && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <div className="inline-flex relative">
                                <Radar className="text-cf-secondary/30 animate-ping absolute top-0 left-0" size={48} />
                                <Radar className="text-cf-secondary relative z-10" size={48} />
                            </div>
                            <p className="text-cf-on-surface mt-6 font-display font-medium tracking-wide">Scanning NSE Stocks...</p>
                            <p className="text-cf-on-muted text-xs mt-2">Computing RSI & MACD across top stocks via Yahoo Finance.</p>
                        </motion.div>
                    )}

                    {!loading && !scanData && !error && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                            className="text-center py-12 bg-cf-surface-low rounded"
                        >
                            <BarChart className="mx-auto text-cf-on-muted mb-2" size={32} />
                            <p className="text-cf-on-muted text-sm">Launch a scan to discover top algorithmic picks today.</p>
                        </motion.div>
                    )}

                    {!loading && scanData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center justify-between mb-4 bg-cf-secondary/10 p-3 rounded">
                                <p className="text-sm text-cf-secondary">
                                    <Sparkles size={14} className="inline mr-1.5 align-text-bottom" />
                                    Scanned <strong>{scanData.scanned_count}</strong> stocks from top <strong>{scanData.total_exchange_count}</strong> NSE tickers.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {scanData.ai_picks.map((pick, i) => (
                                    <div key={i} className={`bg-cf-surface-low rounded p-4 hover:bg-cf-surface-high transition-colors ${i % 2 === 0 ? '' : 'bg-cf-surface-lowest'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <span className="text-label-sm text-cf-on-muted block mb-1">#{i + 1} Pick</span>
                                                <h4 className="font-display text-lg font-bold text-cf-on-surface">{pick.stock}</h4>
                                            </div>
                                            <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${getSignalColor(pick.signal)}`}>
                                                {getSignalIcon(pick.signal)}
                                                {pick.signal}
                                            </div>
                                        </div>
                                        {pick.currentPrice && (
                                            <p className="text-cf-on-muted text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>₹{pick.currentPrice}</p>
                                        )}
                                        {pick.rsi !== null && (
                                            <div className="flex gap-3 mt-2 text-xs">
                                                <span className="text-cf-on-muted">RSI: <span className="text-cf-on-surface">{pick.rsi}</span></span>
                                                {pick.macd !== null && (
                                                    <span className="text-cf-on-muted">MACD: <span className="text-cf-on-surface">{pick.macd}</span></span>
                                                )}
                                            </div>
                                        )}
                                        {pick.reasons && pick.reasons.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {pick.reasons.slice(0, 2).map((reason, j) => (
                                                    <span key={j} className="text-[10px] bg-cf-surface-high text-cf-on-muted px-2 py-0.5 rounded">{reason}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {scanData.ai_picks.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-cf-on-muted">
                                        No strong buy/sell signals found in this scan batch. Market might be heavily neutral.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DailyScanner;
