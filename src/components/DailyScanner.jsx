import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Loader2, Sparkles, AlertCircle, RefreshCw, BarChart } from 'lucide-react';

const DailyScanner = () => {
    const [scanData, setScanData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const performScan = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:5001/scan');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to complete market scan.');
            setScanData(data);
        } catch (err) {
            setError(err.message || "Failed to reach the AI scanner microservice.");
        } finally {
            setLoading(false);
        }
    };

    const getSignalColor = (signal) => {
        switch (signal) {
            case 'BUY': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'SELL': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'HOLD': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-6 mt-12 mb-8">
            <div className="bg-fintech-darkCard/40 backdrop-blur-xl rounded-2xl p-6 shadow-glass border border-indigo-500/20 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Radar className="text-indigo-400" size={24} />
                            Daily AI Market Scanner
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Analyzes the NSE equity database using TA indicators (RSI & MACD) on parallel threads to find top technical opportunities.
                        </p>
                    </div>
                    <button
                        onClick={performScan}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Scanning Market...</> : <><RefreshCw size={16} /> Run Full Scan</>}
                    </button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm flex items-start gap-3 mb-6"
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
                                <Radar className="text-indigo-500/30 animate-ping absolute top-0 left-0" size={48} />
                                <Radar className="text-indigo-400 relative z-10" size={48} />
                            </div>
                            <p className="text-slate-300 mt-6 font-medium tracking-wide">Executing Parallel Strategy Scan...</p>
                            <p className="text-slate-500 text-xs mt-2">Fetching live yfinance data & computing RSI/MACD across the NSE.</p>
                        </motion.div>
                    )}

                    {!loading && !scanData && !error && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                            className="text-center py-12 bg-fintech-primary/20 rounded-xl border border-white/5"
                        >
                            <BarChart className="mx-auto text-slate-500 mb-2" size={32} />
                            <p className="text-slate-400">Launch a scan to discover top algorithmic picks today.</p>
                        </motion.div>
                    )}

                    {!loading && scanData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center justify-between mb-4 bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/20">
                                <p className="text-sm text-indigo-200">
                                    <Sparkles size={14} className="inline mr-1.5 align-text-bottom" />
                                    Scanned <strong>{scanData.scanned_count}</strong> stocks randomly from total <strong>{scanData.total_exchange_count}</strong> NSE tickers.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {scanData.ai_picks.map((pick, i) => (
                                    <div key={i} className="bg-fintech-primary/40 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-fintech-primary/60 transition-colors">
                                        <div>
                                            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 block">#{i + 1} Recommendation</span>
                                            <h4 className="text-lg font-bold text-white">{pick.stock}</h4>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getSignalColor(pick.signal)}`}>
                                            {pick.signal}
                                        </div>
                                    </div>
                                ))}
                                {scanData.ai_picks.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-slate-400">
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
