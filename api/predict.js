/**
 * Stock Prediction API - Serverless replacement for Python ai-service/app.py
 * Uses simple linear regression for stock price prediction
 */

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST method required' });
    }

    const { symbol, historical_prices } = req.body || {};

    if (!historical_prices || !Array.isArray(historical_prices) || historical_prices.length < 3) {
        return res.status(400).json({ error: 'Please provide at least 3 historical prices for prediction.' });
    }

    try {
        // Simple Linear Regression
        const n = historical_prices.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = historical_prices.reduce((a, b) => a + b, 0);
        const sumXY = historical_prices.reduce((acc, y, i) => acc + i * y, 0);
        const sumXX = Array.from({ length: n }, (_, i) => i * i).reduce((a, b) => a + b, 0);

        const denom = n * sumXX - sumX * sumX;
        const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
        const intercept = (sumY - slope * sumX) / n;
        const predictedPrice = slope * n + intercept;

        // Moving Average prediction for additional insight
        const ma5 = historical_prices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, historical_prices.length);
        const ma10 = historical_prices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, historical_prices.length);

        // Weighted average of linear regression and moving averages
        const weightedPrediction = (predictedPrice * 0.5 + ma5 * 0.3 + ma10 * 0.2);

        // Calculate prediction confidence based on R-squared
        const meanY = sumY / n;
        const ssRes = historical_prices.reduce((acc, y, i) => {
            const predicted = slope * i + intercept;
            return acc + Math.pow(y - predicted, 2);
        }, 0);
        const ssTot = historical_prices.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
        const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
        
        let confidence = 'Low';
        if (rSquared > 0.7) confidence = 'High';
        else if (rSquared > 0.4) confidence = 'Moderate';

        // Determine trend direction
        const lastPrice = historical_prices[historical_prices.length - 1];
        const changePercent = ((weightedPrediction - lastPrice) / lastPrice * 100).toFixed(2);
        const trend = weightedPrediction > lastPrice ? 'Bullish' : weightedPrediction < lastPrice ? 'Bearish' : 'Neutral';

        return res.json({
            symbol: symbol || 'UNKNOWN',
            predicted_price: Math.round(weightedPrediction * 100) / 100,
            confidence,
            model: 'Ensemble (Linear Regression + Moving Averages)',
            r_squared: Math.round(rSquared * 1000) / 1000,
            trend,
            change_percent: changePercent,
            ma5: Math.round(ma5 * 100) / 100,
            ma10: Math.round(ma10 * 100) / 100,
            data_points: n
        });
    } catch (err) {
        console.error('[Predict Error]', err);
        return res.status(500).json({ error: 'Prediction model error: ' + err.message });
    }
}
