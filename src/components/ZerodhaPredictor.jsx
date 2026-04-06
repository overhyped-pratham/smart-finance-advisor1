import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2, Target, BarChart3, Activity, Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const POPULAR_STOCKS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 
    'ZOMATO', 'TATAMOTORS', 'SBIN', 'ITC'
];

const ZerodhaPredictor = () => {
    const [selectedStock, setSelectedStock] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customQuery, setCustomQuery] = useState('');

    const fetchStockData = async (symbolToFetch) => {
        if (!symbolToFetch.trim()) return;
        
        setError(null);
        setLoading(true);
        setPrediction(null);

        try {
            const apiSymbol = symbolToFetch.toUpperCase().trim();
            const querySymbol = apiSymbol.includes('.') ? apiSymbol : `${apiSymbol}.NS`;

            // Use query parameter format (Vercel-compatible)
            let res = await fetch(`/api/stock?symbol=${encodeURIComponent(querySymbol)}`);
            let data;
            
            try {
                data = await res.json();
            } catch {
                throw new Error('Server returned invalid response. API may be temporarily down.');
            }

            if (!res.ok) {
                // If .NS failed, fallback to raw input (for US stocks like AAPL)
                if (!apiSymbol.includes('.')) {
                    const fallbackRes = await fetch(`/api/stock?symbol=${encodeURIComponent(apiSymbol)}`);
                    let fallbackData;
                    try {
                        fallbackData = await fallbackRes.json();
                    } catch {
                        throw new Error('Could not fetch stock data. Try again later.');
                    }
                    if (!fallbackRes.ok) throw new Error(fallbackData.error || 'Stock symbol not found.');
                    
                    setSelectedStock({ 
                        symbol: fallbackData.symbol, 
                        prices: fallbackData.prices,
                        currency: fallbackData.currency,
                        exchange: fallbackData.exchange
                    });
                    setCustomQuery('');
                    return;
                }
                throw new Error(data.error || 'Stock symbol not found.');
            }

            setSelectedStock({ 
                symbol: data.symbol, 
                prices: data.prices,
                currency: data.currency || 'INR',
                exchange: data.exchange || 'NSE'
            });
            setCustomQuery('');
        } catch (err) {
            setError(err.message || 'Error fetching live stock market data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomSearch = (e) => {
        e.preventDefault();
        fetchStockData(customQuery);
    };

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            // Use serverless API instead of localhost Python service
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: selectedStock.symbol,
                    historical_prices: selectedStock.prices
                })
            });

            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error('Prediction API returned invalid response.');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to predict stock price.');
            }

            setPrediction(data);
        } catch (err) {
            console.error('Prediction Error:', err);
            setError(err.message || 'Could not connect to the prediction API.');
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend) => {
        if (trend === 'Bullish') return <ArrowUpRight className="text-emerald-400" size={20} />;
        if (trend === 'Bearish') return <ArrowDownRight className="text-red-400" size={20} />;
        return <Minus className="text-amber-400" size={20} />;
    };

    const getTrendColor = (trend) => {
        if (trend === 'Bullish') return 'text-emerald-400';
        if (trend === 'Bearish') return 'text-red-400';
        return 'text-amber-400';
    };

    return (
        <div className="space-y-6 mt-12 mb-8">
            <div className="bg-fintech-darkCard/40 backdrop-blur-xl rounded-2xl p-6 shadow-glass border border-fintech-accent/10 relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-emerald-400" size={24} />
                            Stock Predictor
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            ML-powered forecasts based on historical market data trends.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium">
                        <Activity size={14} /> Model Active
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">
                        Select Asset for Prediction
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {POPULAR_STOCKS.map((sym) => (
                            <button
                                key={sym}
                                onClick={() => fetchStockData(sym)}
                                disabled={loading}
                                className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50
                                    ${selectedStock?.symbol?.replace('.NS', '') === sym 
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
                                        : 'bg-fintech-primary/40 border-white/10 text-slate-300 hover:border-white/30 hover:bg-fintech-primary/60'}`}
                            >
                                {sym}
                            </button>
                        ))}
                    </div>
                </div>

                {!selectedStock && !loading && (
                    <div className="text-center py-10 bg-fintech-primary/20 rounded-xl border border-white/5 mb-6">
                        <BarChart3 className="mx-auto text-slate-500 mb-2" size={32} />
                        <p className="text-slate-400">Select an asset or search to view live historical data.</p>
                    </div>
                )}

                {loading && !selectedStock && (
                    <div className="flex justify-center py-10 mb-6">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                )}

                {selectedStock && (
                    <div className="bg-fintech-primary/30 rounded-xl p-4 border border-white/5 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={16} className="text-slate-400" />
                                <span className="text-slate-300 text-sm font-medium">1-Month Historical Price: <strong className="text-white">{selectedStock.symbol}</strong></span>
                                {selectedStock.exchange && (
                                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{selectedStock.exchange}</span>
                                )}
                            </div>
                            <span className="text-emerald-400 text-xs font-bold">
                                {selectedStock.currency === 'INR' ? '₹' : '$'}{selectedStock.prices[selectedStock.prices.length - 1]}
                            </span>
                        </div>
                        <div className="flex items-end gap-1 h-16">
                            {selectedStock.prices.map((price, idx) => {
                                const min = Math.min(...selectedStock.prices);
                                const max = Math.max(...selectedStock.prices);
                                const height = ((price - min) / (max - min)) * 100 || 5;
                                return (
                                    <div key={idx} className="flex-1 bg-slate-800 rounded-t-sm hover:bg-emerald-500/50 transition-colors group relative" style={{ height: `${Math.max(10, height)}%` }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded text-white whitespace-nowrap transition-opacity z-10">
                                            {selectedStock.currency === 'INR' ? '₹' : '$'}{price}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <form onSubmit={handleCustomSearch} className="flex gap-3">
                        <input
                            type="text"
                            value={customQuery}
                            onChange={(e) => setCustomQuery(e.target.value)}
                            placeholder="Enter any stock symbol (e.g., ITC, TATAMOTORS, AAPL)"
                            className="flex-1 bg-fintech-primary/40 text-white placeholder-slate-500 border border-white/10 rounded-xl px-4 py-2 focus:border-emerald-500/50 outline-none transition-colors"
                        />
                        <button type="submit" disabled={loading} className="bg-fintech-primary/60 hover:bg-emerald-500/20 text-emerald-400 border border-white/10 hover:border-emerald-500/30 px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-medium disabled:opacity-50">
                            <Search size={16} /> Search Asset
                        </button>
                    </form>
                </div>

                <div className="flex justify-start">
                    <button
                        onClick={handlePredict}
                        disabled={loading || !selectedStock}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-neon-emerald"
                    >
                        {loading && selectedStock ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Running ML Model...
                            </>
                        ) : (
                            <>
                                <Target size={18} /> Forecast Next Price
                            </>
                        )}
                    </button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {prediction && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 border-t border-white/10 pt-6"
                        >
                            <div className="bg-gradient-to-br from-emerald-900/40 to-fintech-darkBg rounded-2xl p-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.1)]">
                                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-1">Prediction Result</p>
                                <div className="flex items-end gap-3 mb-4">
                                    <h4 className="text-4xl font-extrabold text-white">
                                        {selectedStock?.currency === 'INR' ? '₹' : '$'}{prediction.predicted_price}
                                    </h4>
                                    <div className="flex items-center gap-1 mb-1 pb-1">
                                        {getTrendIcon(prediction.trend)}
                                        <span className={`text-sm font-medium ${getTrendColor(prediction.trend)}`}>
                                            {prediction.change_percent > 0 ? '+' : ''}{prediction.change_percent}%
                                        </span>
                                    </div>
                                    <span className="text-slate-400 text-sm mb-1 pb-1">for {prediction.symbol} tomorrow</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <p className="text-slate-500 text-xs mb-1">Model Used</p>
                                        <p className="text-slate-300 font-medium text-xs">{prediction.model}</p>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <p className="text-slate-500 text-xs mb-1">Confidence</p>
                                        <p className="text-emerald-400 font-medium">{prediction.confidence}</p>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <p className="text-slate-500 text-xs mb-1">Trend</p>
                                        <p className={`font-medium ${getTrendColor(prediction.trend)}`}>{prediction.trend}</p>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <p className="text-slate-500 text-xs mb-1">R² Score</p>
                                        <p className="text-slate-300 font-medium">{prediction.r_squared}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ZerodhaPredictor;
