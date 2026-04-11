export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    try {
        const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();
        
        const results = data.quotes ? data.quotes
            .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
            .map(q => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchange,
                score: q.score
            })).sort((a, b) => b.score - a.score) : [];
        
        return res.json({ results });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to search stocks' });
    }
}
