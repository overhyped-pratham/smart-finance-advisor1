import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2, Target, BarChart3, Activity, Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const POPULAR_STOCKS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 
    'AXISBANK', 'TATAMOTORS', 'SBIN', 'ITC',
    'ICICIBANK', 'BHARTIARTL', 'LT', 'BAJFINANCE',
    'AAPL', 'TSLA', 'MSFT', 'NVDA'
];

const ZerodhaPredictor = () => {
    const [selectedStock, setSelectedStock] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customQuery, setCustomQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingDropdown, setIsSearchingDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (customQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        
        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingDropdown(true);
            try {
                const res = await fetch(`/api/search-stock?q=${encodeURIComponent(customQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.results || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearchingDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [customQuery]);

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

    const getTrendColor = (trend) => {
        if (trend === 'Bullish') return 'text-cf-tertiary';
        if (trend === 'Bearish') return 'text-cf-error';
        return 'text-cf-primary';
    };

    const getTrendIcon = (trend) => {
        if (trend === 'Bullish') return <ArrowUpRight className="text-cf-tertiary" size={20} />;
        if (trend === 'Bearish') return <ArrowDownRight className="text-cf-error" size={20} />;
        return <Minus className="text-cf-primary" size={20} />;
    };

    return (
        <div className="space-y-6 mt-12 mb-8">
            <div className="bg-cf-surface-high rounded p-6 relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-cf-tertiary/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="font-display text-xl font-bold text-cf-on-surface flex items-center gap-2">
                            <TrendingUp className="text-cf-tertiary" size={22} />
                            Stock Predictor
                        </h3>
                        <p className="text-cf-on-muted text-sm mt-1">
                            ML-powered forecasts based on historical market data trends.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-cf-tertiary/10 text-cf-tertiary px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider">
                        <div className="pulse-live" style={{ backgroundColor: '#afffd1' }}></div>
                        Model Active
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-label-sm text-cf-on-muted mb-3 block">
                        Select Asset for Prediction
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {POPULAR_STOCKS.map((sym) => (
                            <button
                                key={sym}
                                onClick={() => fetchStockData(sym)}
                                disabled={loading}
                                className={`px-4 py-3 rounded text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50
                                    ${selectedStock?.symbol?.replace('.NS', '') === sym 
                                        ? 'bg-cf-tertiary/15 text-cf-tertiary shadow-glow-tertiary' 
                                        : 'bg-cf-surface-low text-cf-on-muted hover:bg-cf-surface-high hover:text-cf-on-surface'}`}
                            >
                                {sym}
                            </button>
                        ))}
                    </div>
                </div>

                {!selectedStock && !loading && (
                    <div className="text-center py-10 bg-cf-surface-low rounded mb-6">
                        <BarChart3 className="mx-auto text-cf-on-muted mb-2" size={32} />
                        <p className="text-cf-on-muted text-sm">Select an asset or search to view live historical data.</p>
                    </div>
                )}

                {loading && !selectedStock && (
                    <div className="flex justify-center py-10 mb-6">
                        <Loader2 className="animate-spin text-cf-tertiary" size={32} />
                    </div>
                )}

                {selectedStock && (
                    <div className="bg-cf-surface-lowest rounded p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={16} className="text-cf-on-muted" />
                                <span className="text-cf-on-muted text-sm">1-Month Historical: <strong className="text-cf-on-surface font-display">{selectedStock.symbol}</strong></span>
                                {selectedStock.exchange && (
                                    <span className="text-[10px] text-cf-on-muted bg-cf-surface-high px-2 py-0.5 rounded uppercase tracking-wider">{selectedStock.exchange}</span>
                                )}
                            </div>
                            <span className="text-cf-tertiary text-sm font-display font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {selectedStock.currency === 'INR' ? '₹' : '$'}{selectedStock.prices[selectedStock.prices.length - 1]}
                            </span>
                        </div>
                        {/* Sparkline-style bar chart */}
                        <div className="flex items-end gap-[2px] h-16">
                            {selectedStock.prices.map((price, idx) => {
                                const min = Math.min(...selectedStock.prices);
                                const max = Math.max(...selectedStock.prices);
                                const height = ((price - min) / (max - min)) * 100 || 5;
                                return (
                                    <div key={idx} className="flex-1 bg-cf-surface-high rounded-t-sm hover:bg-cf-tertiary/50 transition-colors group relative" style={{ height: `${Math.max(10, height)}%` }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 glass text-xs px-2 py-1 rounded text-cf-on-surface whitespace-nowrap transition-opacity z-10">
                                            {selectedStock.currency === 'INR' ? '₹' : '$'}{price}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mb-6 relative" ref={dropdownRef}>
                    <form onSubmit={handleCustomSearch} className="flex gap-3">
                        <input
                            type="text"
                            value={customQuery}
                            onChange={(e) => setCustomQuery(e.target.value)}
                            placeholder="Enter any stock symbol (e.g., ITC, TATAMOTORS, AAPL)"
                            className="input-bottomline flex-1"
                        />
                        <button type="submit" disabled={loading} className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-50">
                            <Search size={16} /> Search
                        </button>
                    </form>

                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                        {(searchResults.length > 0 || isSearchingDropdown) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 left-0 right-[100px] top-full mt-2 bg-cf-surface-high border border-white/5 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl"
                            >
                                {isSearchingDropdown ? (
                                    <div className="p-4 text-center text-cf-on-muted text-xs flex justify-center items-center">
                                        <Loader2 size={14} className="animate-spin mr-2" /> Searching Global Markets...
                                    </div>
                                ) : (
                                    <ul className="max-h-60 overflow-y-auto w-full custom-scrollbar">
                                        {searchResults.map((result) => (
                                            <li 
                                                key={result.symbol} 
                                                onClick={() => {
                                                    setCustomQuery(result.symbol);
                                                    setSearchResults([]);
                                                    fetchStockData(result.symbol);
                                                }}
                                                className="px-4 py-3 hover:bg-cf-surface-lowest cursor-pointer border-b border-white/5 last:border-none flex justify-between items-center group transition-colors"
                                            >
                                                <div>
                                                    <span className="font-bold text-cf-on-surface text-sm group-hover:text-cf-tertiary transition-colors">{result.symbol}</span>
                                                    <span className="ml-2 text-xs text-cf-on-muted truncate inline-block max-w-[150px] sm:max-w-[200px] align-bottom">{result.name}</span>
                                                </div>
                                                <span className="text-[10px] bg-cf-surface-low px-1.5 py-0.5 rounded text-cf-on-muted uppercase font-semibold">{result.exchange}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex justify-start">
                    <button
                        onClick={handlePredict}
                        disabled={loading || !selectedStock}
                        className="bg-gradient-to-r from-[#afffd1] to-[#22c55e] text-cf-bg font-bold px-6 py-3 rounded transition-all flex items-center gap-2 disabled:opacity-50 shadow-glow-tertiary hover:shadow-[0_0_24px_rgba(175,255,209,0.35)] text-sm"
                    >
                        {loading && selectedStock ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Running ML Model...
                            </>
                        ) : (
                            <>
                                <Target size={16} /> Forecast Next Price
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
                            className="mt-6 bg-cf-error/10 text-cf-error p-4 rounded text-sm"
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
                            className="mt-6 pt-6"
                        >
                            <div className="bg-cf-surface-lowest rounded p-6 shadow-glow-tertiary">
                                <p className="text-label-sm text-cf-tertiary mb-2">Prediction Result</p>
                                <div className="flex items-end gap-3 mb-4">
                                    <h4 className="text-display-md text-cf-on-surface" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {selectedStock?.currency === 'INR' ? '₹' : '$'}{prediction.predicted_price}
                                    </h4>
                                    <div className="flex items-center gap-1 mb-1 pb-1">
                                        {getTrendIcon(prediction.trend)}
                                        <span className={`text-sm font-medium ${getTrendColor(prediction.trend)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {prediction.change_percent > 0 ? '+' : ''}{prediction.change_percent}%
                                        </span>
                                    </div>
                                    <span className="text-cf-on-muted text-sm mb-1 pb-1">for {prediction.symbol} tomorrow</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-cf-surface-high rounded p-3">
                                        <p className="text-label-sm text-cf-on-muted mb-1">Model</p>
                                        <p className="text-cf-on-surface text-xs font-medium">{prediction.model}</p>
                                    </div>
                                    <div className="bg-cf-surface-high rounded p-3">
                                        <p className="text-label-sm text-cf-on-muted mb-1">Confidence</p>
                                        <p className="text-cf-tertiary font-medium">{prediction.confidence}</p>
                                    </div>
                                    <div className="bg-cf-surface-high rounded p-3">
                                        <p className="text-label-sm text-cf-on-muted mb-1">Trend</p>
                                        <p className={`font-medium ${getTrendColor(prediction.trend)}`}>{prediction.trend}</p>
                                    </div>
                                    <div className="bg-cf-surface-high rounded p-3">
                                        <p className="text-label-sm text-cf-on-muted mb-1">R² Score</p>
                                        <p className="text-cf-on-surface font-medium">{prediction.r_squared}</p>
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
