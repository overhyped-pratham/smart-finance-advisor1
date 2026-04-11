const path = require('path');
const fs = require('fs');
if (fs.existsSync(path.join(__dirname, '..', '.env.local'))) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

// ── AI SDK Setup ──
let Groq;
try {
    Groq = require('groq-sdk');
} catch (e) {
    console.warn('⚠ groq-sdk not installed. Groq provider will be unavailable.');
}

// ── Zerodha Kite (optional) ──
let kc = null;
try {
    const api_key = process.env.ZERODHA_API_KEY;
    if (api_key) {
        const { KiteConnect } = require('kiteconnect');
        kc = new KiteConnect({ api_key });
        console.log('✓ Zerodha KiteConnect initialized.');
    }
} catch (e) {
    console.warn('⚠ kiteconnect not available or ZERODHA_API_KEY not set.');
}

// Middleware
app.use(cors());
app.use(express.json());

// ── In-memory data store (replaces SQLite for reliability) ──
let storedBudget = 0;
let storedExpenses = [
    { id: '1', name: 'Rent', amount: 1500, category: 'Housing' },
    { id: '2', name: 'Groceries', amount: 400, category: 'Food' },
    { id: '3', name: 'Gas', amount: 150, category: 'Transportation' }
];

// ──────────────────────────────────────────────
// API Routes — Budget & Expenses
// ──────────────────────────────────────────────

app.get('/api/budget', (req, res) => {
    res.json({ amount: storedBudget });
});

app.post('/api/budget', (req, res) => {
    const { amount } = req.body;
    if (typeof amount === 'number' && amount >= 0) {
        storedBudget = amount;
        return res.json({ success: true, amount: storedBudget });
    }
    return res.status(400).json({ error: 'Invalid budget amount' });
});

app.get('/api/expenses', (req, res) => {
    res.json(storedExpenses);
});

app.post('/api/expenses', (req, res) => {
    const { id, name, amount, category } = req.body;
    if (!name || !amount) return res.status(400).json({ error: 'name and amount are required' });
    const expense = { id: id || Date.now().toString(), name, amount, category: category || 'Other' };
    storedExpenses.push(expense);
    res.json({ success: true, id: expense.id });
});

app.delete('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    storedExpenses = storedExpenses.filter(e => e.id !== id);
    res.json({ success: true });
});

// ──────────────────────────────────────────────
// Live Stock Data (Yahoo Finance Proxy)
// ──────────────────────────────────────────────
app.get('/api/stock', async (req, res) => {
    const symbol = req.query.symbol;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    try {
        const querySymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
        const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySymbol)}?range=1mo&interval=1d`;
        const response = await fetch(yahooUrl, {
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
        console.error('Yahoo Finance Proxy Error:', err);
        res.status(500).json({ error: 'Failed to fetch live stock data.' });
    }
});

// Also handle /api/stock/:symbol route
app.get('/api/stock/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    try {
        const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
        const response = await fetch(yahooUrl, {
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
});

// ──────────────────────────────────────────────
// Hugging Face Fallback Helper
// ──────────────────────────────────────────────
async function hfInference(hfToken, model, inputs, parameters = {}) {
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs, parameters }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HF API Error (${response.status}): ${errText}`);
    }

    return response.json();
}

// ──────────────────────────────────────────────
// Sentiment Analysis (Groq → HF → Gemini fallback chain)
// ──────────────────────────────────────────────
app.post('/api/sentiment', async (req, res) => {
    const { texts, token: bodyToken, hfToken: bodyHfToken, geminiToken: bodyGeminiToken } = req.body;
    const groqToken = bodyToken || process.env.GROQ_API_KEY;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;
    const geminiToken = bodyGeminiToken || process.env.GEMINI_API_KEY;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of texts for analysis.' });
    }

    if (!groqToken && !hfToken && !geminiToken) {
        return res.status(400).json({ error: 'No API keys configured. Please provide a Groq, HuggingFace, or Gemini API key.' });
    }

    const errors = {};

    // 1. Try Groq
    if (groqToken && Groq) {
        try {
            const client = new Groq({ apiKey: groqToken });
            const completion = await client.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "Analyze the sentiment of the following financial texts. Return a JSON array of objects with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-100) for each text." },
                    { role: "user", content: JSON.stringify(texts) }
                ],
                response_format: { type: "json_object" }
            });

            const data = JSON.parse(completion.choices[0].message.content);
            const results = texts.map((text, idx) => {
                const item = (data.results || data)[idx] || { sentiment: 'neutral', confidence: 50 };
                return { text, sentiment: item.sentiment.toLowerCase(), confidence: item.confidence };
            });

            return res.json({ results, provider: 'groq' });
        } catch (err) {
            console.error('Groq Sentiment Error:', err.message);
            errors.groq = err.message;
        }
    }

    // 2. Try HuggingFace
    if (hfToken) {
        try {
            const results = [];
            for (const text of texts) {
                const data = await hfInference(hfToken, 'ProsusAI/finbert', text);
                const top = data[0]?.reduce((a, b) => a.score > b.score ? a : b, data[0][0]);
                results.push({
                    text,
                    sentiment: top?.label?.toLowerCase() || 'neutral',
                    confidence: Math.round((top?.score || 0.5) * 100),
                });
            }
            return res.json({ results, provider: 'huggingface' });
        } catch (err) {
            console.error('HF Sentiment Error:', err.message);
            errors.huggingface = err.message;
        }
    }

    // 3. Try Gemini
    if (geminiToken) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Analyze the sentiment of the following financial texts. Return STRICTLY a JSON array of objects with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-100) for each text. Do not include markdown formatting.\n\nTexts: " + JSON.stringify(texts) }]
                    }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });
            if (!response.ok) throw new Error(await response.text());
            const responseData = await response.json();
            let textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
                const data = JSON.parse(textResponse);
                const results = texts.map((text, idx) => {
                    const item = (data.results || data)[idx] || { sentiment: 'neutral', confidence: 50 };
                    return { text, sentiment: item?.sentiment?.toLowerCase() || 'neutral', confidence: item?.confidence || 50 };
                });
                return res.json({ results, provider: 'gemini' });
            }
            throw new Error("Invalid response format from Gemini");
        } catch (err) {
            console.error('Gemini Sentiment Error:', err.message);
            errors.gemini = err.message;
        }
    }

    res.status(500).json({ error: 'All configured AI providers failed.', details: errors });
});

// ──────────────────────────────────────────────
// Market Analysis (Groq → HF → Gemini fallback chain)
// ──────────────────────────────────────────────
app.post('/api/market-analysis', async (req, res) => {
    const { prompt, max_tokens, token: bodyToken, hfToken: bodyHfToken, geminiToken: bodyGeminiToken } = req.body;
    const groqToken = bodyToken || process.env.GROQ_API_KEY;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;
    const geminiToken = bodyGeminiToken || process.env.GEMINI_API_KEY;

    if (!prompt) return res.status(400).json({ error: 'Please provide a prompt.' });

    if (!groqToken && !hfToken && !geminiToken) {
        return res.status(400).json({ error: 'No API keys configured. Please provide a Groq, HuggingFace, or Gemini API key.' });
    }

    const errors = {};

    // 1. Try Groq
    if (groqToken && Groq) {
        try {
            const client = new Groq({ apiKey: groqToken });
            const completion = await client.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are an expert financial analyst. Provide a concise, highly analytical response based on market data." },
                    { role: "user", content: prompt }
                ],
                max_tokens: max_tokens || 500,
            });
            return res.json({ prompt, response: completion.choices[0].message.content.trim(), provider: 'groq' });
        } catch (err) {
            console.error('Groq Market Error:', err.message);
            errors.groq = err.message;
        }
    }

    // 2. Try HuggingFace
    if (hfToken) {
        try {
            const data = await hfInference(
                hfToken,
                'mistralai/Mistral-7B-Instruct-v0.3',
                `<s>[INST] You are an expert financial analyst. Provide a concise, highly analytical response based on market data.\n\n${prompt} [/INST]`,
                { max_new_tokens: max_tokens || 500, return_full_text: false }
            );
            const generatedText = data[0]?.generated_text?.trim() || 'Analysis could not be generated.';
            return res.json({ prompt, response: generatedText, provider: 'huggingface' });
        } catch (err) {
            console.error('HF Market Error:', err.message);
            errors.huggingface = err.message;
        }
    }

    // 3. Try Gemini
    if (geminiToken) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "You are an expert financial analyst. Provide a concise, highly analytical response based on market data.\n\n" + prompt }]
                    }]
                })
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
                return res.json({ prompt, response: textResponse.trim(), provider: 'gemini' });
            }
            throw new Error("Invalid response from Gemini");
        } catch (err) {
            console.error('Gemini Market Error:', err.message);
            errors.gemini = err.message;
        }
    }

    res.status(500).json({ error: 'All configured AI providers failed.', details: errors });
});

// ──────────────────────────────────────────────
// Stock Prediction (local statistical)
// ──────────────────────────────────────────────
app.post('/api/predict', async (req, res) => {
    const { prices } = req.body;
    if (!prices || !Array.isArray(prices) || prices.length < 5) {
        return res.status(400).json({ error: 'At least 5 price points required' });
    }

    try {
        const n = prices.length;
        const lastPrice = prices[n - 1];
        const ma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const ma10 = n >= 10 ? prices.slice(-10).reduce((a, b) => a + b, 0) / 10 : ma5;

        // Simple linear regression
        const xMean = (n - 1) / 2;
        const yMean = prices.reduce((a, b) => a + b, 0) / n;
        let numSum = 0, denSum = 0;
        for (let i = 0; i < n; i++) {
            numSum += (i - xMean) * (prices[i] - yMean);
            denSum += (i - xMean) ** 2;
        }
        const slope = denSum !== 0 ? numSum / denSum : 0;

        const predicted = [];
        for (let i = 1; i <= 5; i++) {
            predicted.push(Math.round((lastPrice + slope * i) * 100) / 100);
        }

        const trend = slope > 0.5 ? 'BULLISH' : slope < -0.5 ? 'BEARISH' : 'NEUTRAL';
        const confidence = Math.min(95, Math.max(30, Math.round(50 + Math.abs(slope) * 10)));

        res.json({
            currentPrice: lastPrice,
            predictedPrices: predicted,
            trend,
            confidence,
            movingAverages: { ma5: Math.round(ma5 * 100) / 100, ma10: Math.round(ma10 * 100) / 100 },
            provider: 'statistical'
        });
    } catch (err) {
        res.status(500).json({ error: 'Prediction failed: ' + err.message });
    }
});

// ──────────────────────────────────────────────
// Stock Scanner
// ──────────────────────────────────────────────
app.get('/api/scan', async (req, res) => {
    const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
        'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS', 'LT.NS'];

    try {
        const results = [];
        for (const sym of symbols) {
            try {
                const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1mo&interval=1d`;
                const response = await fetch(yahooUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const data = await response.json();

                if (data.chart?.result) {
                    const meta = data.chart.result[0].meta;
                    const closePrices = data.chart.result[0].indicators.quote[0].close.filter(p => p !== null);
                    const latestPrice = meta.regularMarketPrice;
                    const prevClose = meta.previousClose;
                    const changePercent = ((latestPrice - prevClose) / prevClose * 100).toFixed(2);

                    // Simple signal
                    const ma5 = closePrices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, closePrices.length);
                    const signal = latestPrice > ma5 ? 'BUY' : latestPrice < ma5 * 0.98 ? 'SELL' : 'HOLD';

                    results.push({
                        symbol: sym.replace('.NS', ''),
                        price: latestPrice,
                        change: parseFloat(changePercent),
                        signal,
                        ma5: Math.round(ma5 * 100) / 100
                    });
                }
            } catch (e) {
                // Skip failed symbols
            }
        }

        res.json({ results, timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ error: 'Scanner failed' });
    }
});

// ──────────────────────────────────────────────
// AI Status
// ──────────────────────────────────────────────
app.get('/api/ai-status', (req, res) => {
    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasHF = !!process.env.HF_TOKEN;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    res.json({
        status: 'ok',
        model: 'llama-3.1-8b-instant',
        mode: 'groq',
        fallback: hasHF ? 'huggingface' : hasGemini ? 'gemini' : 'none',
        env: { hasGroq, hasHF, hasGemini }
    });
});

// ──────────────────────────────────────────────
// Broker Status (unified)
// ──────────────────────────────────────────────
app.get('/api/broker', (req, res) => {
    const action = req.query.action || 'status';
    if (action === 'status') {
        return res.json({
            brokers: {
                zerodha: {
                    configured: !!process.env.ZERODHA_API_KEY,
                    connected: false,
                    name: 'Zerodha Kite'
                },
                angelone: {
                    configured: !!process.env.ANGELONE_API_KEY,
                    connected: false,
                    name: 'Angel One'
                }
            }
        });
    }
    res.json({ message: `Action ${action} not implemented in local dev` });
});

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log(`  🚀 Smart Finance Advisor Backend`);
        console.log(`  📡 Running on http://localhost:${PORT}`);
        console.log('═══════════════════════════════════════════════');
        console.log('  API Keys Status:');
        console.log(`    Groq:    ${process.env.GROQ_API_KEY ? '✓ configured' : '✗ not set'}`);
        console.log(`    HF:      ${process.env.HF_TOKEN ? '✓ configured' : '✗ not set'}`);
        console.log(`    Gemini:  ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ not set'}`);
        console.log(`    Zerodha: ${process.env.ZERODHA_API_KEY ? '✓ configured' : '✗ not set'}`);
        console.log(`    Angel:   ${process.env.ANGELONE_API_KEY ? '✓ configured' : '✗ not set'}`);
        console.log('═══════════════════════════════════════════════');
        console.log('');
    });
}

module.exports = app;
