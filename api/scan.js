/**
 * Stock Scanner API - Serverless replacement for Python ai-service scan endpoint
 * Scans a curated list of top NSE stocks using Yahoo Finance data
 * and computes RSI + MACD signals
 */

const TOP_NSE_STOCKS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR',
    'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'HCLTECH', 'AXISBANK',
    'ASIANPAINT', 'MARUTI', 'SUNPHARMA', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV',
    'WIPRO', 'ULTRACEMCO', 'NTPC', 'TATAMOTORS', 'POWERGRID', 'M&M',
    'JSWSTEEL', 'TATASTEEL', 'ADANIENT', 'ADANIPORTS', 'COALINDIA',
    'TECHM', 'GRASIM', 'INDUSINDBK', 'CIPLA', 'DRREDDY', 'DIVISLAB',
    'NESTLEIND', 'EICHERMOT', 'HEROMOTOCO', 'BAJAJ-AUTO', 'ZOMATO',
    'ONGC', 'APOLLOHOSP', 'TATACONSUM', 'HINDALCO', 'BPCL',
    'SBILIFE', 'HDFCLIFE', 'BRITANNIA', 'UPL'
];

function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0, losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateEMA(prices, period) {
    if (prices.length < period) return [];
    const k = 2 / (period + 1);
    let ema = [prices.slice(0, period).reduce((a, b) => a + b, 0) / period];
    
    for (let i = period; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[ema.length - 1] * (1 - k));
    }
    return ema;
}

function calculateMACD(prices) {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    
    if (ema12.length === 0 || ema26.length === 0) return null;
    
    // Align the EMAs
    const diff = ema12.length - ema26.length;
    const macdLine = [];
    for (let i = 0; i < ema26.length; i++) {
        macdLine.push(ema12[i + diff] - ema26[i]);
    }
    
    return macdLine.length > 0 ? macdLine[macdLine.length - 1] : null;
}

async function fetchStockData(symbol) {
    const ticker = `${symbol}.NS`;
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=3mo&interval=1d`;
    
    try {
        const res = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        const data = await res.json();
        
        if (!data.chart?.result?.[0]) return null;
        
        const result = data.chart.result[0];
        const prices = result.indicators.quote[0].close.filter(p => p !== null);
        const meta = result.meta;
        
        if (prices.length < 30) return null;
        
        return {
            symbol,
            prices,
            currentPrice: meta.regularMarketPrice || prices[prices.length - 1],
            previousClose: meta.previousClose
        };
    } catch (err) {
        return null;
    }
}

function scoreStock(stockData) {
    const { prices } = stockData;
    
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    
    let score = 0;
    let reasons = [];
    
    if (rsi !== null) {
        if (rsi < 35) { score += 2; reasons.push(`RSI Oversold (${rsi.toFixed(1)})`); }
        else if (rsi < 45) { score += 1; reasons.push(`RSI Low (${rsi.toFixed(1)})`); }
        else if (rsi > 70) { score -= 1; reasons.push(`RSI Overbought (${rsi.toFixed(1)})`); }
    }
    
    if (macd !== null) {
        if (macd > 0) { score += 1; reasons.push('MACD Bullish'); }
        else { score -= 1; reasons.push('MACD Bearish'); }
    }
    
    // Price momentum (5-day)
    const recent = prices.slice(-5);
    const momentum = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100;
    if (momentum > 2) { score += 1; reasons.push(`+${momentum.toFixed(1)}% 5d momentum`); }
    else if (momentum < -3) { reasons.push(`${momentum.toFixed(1)}% 5d momentum`); }
    
    let signal = 'HOLD';
    if (score >= 2) signal = 'BUY';
    else if (score <= -1) signal = 'SELL';
    
    return {
        stock: stockData.symbol,
        signal,
        score,
        rsi: rsi ? Math.round(rsi * 10) / 10 : null,
        macd: macd ? Math.round(macd * 100) / 100 : null,
        currentPrice: Math.round(stockData.currentPrice * 100) / 100,
        reasons
    };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Select a random subset to avoid timeout (Vercel has 10s limit for hobby)
        const sampleSize = Math.min(25, TOP_NSE_STOCKS.length);
        const shuffled = [...TOP_NSE_STOCKS].sort(() => Math.random() - 0.5);
        const selectedStocks = shuffled.slice(0, sampleSize);

        // Fetch all stock data in parallel (batched)
        const batchSize = 5;
        const results = [];
        
        for (let i = 0; i < selectedStocks.length; i += batchSize) {
            const batch = selectedStocks.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(fetchStockData));
            results.push(...batchResults);
        }

        // Score and rank
        const scoredStocks = results
            .filter(r => r !== null)
            .map(scoreStock)
            .sort((a, b) => b.score - a.score);

        const topPicks = scoredStocks.slice(0, 10);

        return res.json({
            scanned_count: results.filter(r => r !== null).length,
            total_exchange_count: TOP_NSE_STOCKS.length,
            ai_picks: topPicks,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[Scanner Error]', err);
        return res.status(500).json({ error: err.message || 'Market scan failed' });
    }
}
