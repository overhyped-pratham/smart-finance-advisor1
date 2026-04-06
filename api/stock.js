export default async function handler(req, res) {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();
        
        if (!data.chart || !data.chart.result) {
            return res.status(404).json({ error: 'Stock not found or API limits reached.' });
        }
        
        const result = data.chart.result[0];
        const prices = result.indicators.quote[0].close.filter(p => p !== null).map(p => Math.round(p * 100) / 100);
        res.json({ symbol: symbol.toUpperCase(), prices: prices.slice(-20) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch live stock data.' });
    }
}
