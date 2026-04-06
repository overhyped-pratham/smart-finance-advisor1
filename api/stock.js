export default async function handler(req, res) {
    // Support both /api/stock?symbol=X and /api/stock/X via Vercel's catch-all
    let symbol = req.query.symbol;
    
    // Handle Vercel's URL routing - if symbol is an array (catch-all), join it
    if (Array.isArray(symbol)) {
        symbol = symbol.join('/');
    }
    
    if (!symbol) return res.status(400).json({ error: 'Symbol required. Usage: /api/stock?symbol=RELIANCE.NS' });

    try {
        // Try Yahoo Finance v8 chart API first
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
        let response = await fetch(yahooUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        
        let data;
        try {
            data = await response.json();
        } catch (_) {
            // If Yahoo v8 fails, try alternative Yahoo Finance endpoint
            const altUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
            response = await fetch(altUrl, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            data = await response.json();
        }
        
        if (!data.chart || !data.chart.result) {
            // Fallback: try the Yahoo Finance search + quote endpoint
            const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol.replace('.NS', ''))}&quotesCount=1&newsCount=0`;
            const searchRes = await fetch(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
            });
            const searchData = await searchRes.json();
            
            if (searchData.quotes && searchData.quotes.length > 0) {
                const resolvedSymbol = searchData.quotes[0].symbol;
                const retryUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(resolvedSymbol)}?range=1mo&interval=1d`;
                const retryRes = await fetch(retryUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
                });
                data = await retryRes.json();
            }
            
            if (!data.chart || !data.chart.result) {
                return res.status(404).json({ error: `Stock "${symbol}" not found. Try adding .NS for Indian stocks (e.g. RELIANCE.NS)` });
            }
        }
        
        const result = data.chart.result[0];
        const closePrices = result.indicators.quote[0].close;
        const prices = closePrices.filter(p => p !== null).map(p => Math.round(p * 100) / 100);
        
        if (prices.length === 0) {
            return res.status(404).json({ error: 'No price data available for this stock.' });
        }
        
        const meta = result.meta;
        res.json({ 
            symbol: meta.symbol || symbol.toUpperCase(), 
            prices: prices.slice(-20),
            currency: meta.currency || 'INR',
            exchange: meta.exchangeName || 'NSE',
            regularMarketPrice: meta.regularMarketPrice || prices[prices.length - 1]
        });
    } catch (err) {
        console.error('Stock API Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch live stock data. Yahoo Finance may be temporarily unavailable.' });
    }
}
