const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const KiteConnect = require('kiteconnect').KiteConnect;

const app = express();
const PORT = 5000;

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'gsk_dummy_key_to_prevent_startup_crash' });

// Zerodha Kite Connect Setup
const api_key = process.env.ZERODHA_API_KEY;
const api_secret = process.env.ZERODHA_API_SECRET;
const kc = new KiteConnect({
    api_key: api_key
});

// Middleware
app.use(cors());
app.use(express.json());

// Set up SQLite database
const isVercel = process.env.VERCEL === '1';
const dbFile = isVercel ? '/tmp/database.sqlite' : path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite Database.');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS budget (id INTEGER PRIMARY KEY, amount REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        name TEXT,
        amount REAL,
        category TEXT
    )`);
    
    db.get('SELECT count(*) as count FROM budget', (err, row) => {
        if (row && row.count === 0) {
            db.run('INSERT INTO budget (id, amount) VALUES (1, 0)');
        }
    });

    db.get('SELECT count(*) as count FROM expenses', (err, row) => {
        if (row && row.count === 0) {
            const initialExpenses = [
                { id: '1', name: 'Rent', amount: 1500, category: 'Housing' },
                { id: '2', name: 'Groceries', amount: 400, category: 'Food' },
                { id: '3', name: 'Gas', amount: 150, category: 'Transportation' }
            ];
            const stmt = db.prepare('INSERT INTO expenses (id, name, amount, category) VALUES (?, ?, ?, ?)');
            initialExpenses.forEach(exp => {
                stmt.run([exp.id, exp.name, exp.amount, exp.category]);
            });
            stmt.finalize();
        }
    });
});

// ──────────────────────────────────────────────
// API Routes — Budget & Expenses
// ──────────────────────────────────────────────

app.get('/api/budget', (req, res) => {
    db.get('SELECT amount FROM budget WHERE id = 1', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ amount: row ? row.amount : 0 });
    });
});

app.post('/api/budget', (req, res) => {
    const { amount } = req.body;
    db.run('UPDATE budget SET amount = ? WHERE id = 1', [amount], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, amount });
    });
});

app.get('/api/expenses', (req, res) => {
    db.all('SELECT * FROM expenses', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/expenses', (req, res) => {
    const { id, name, amount, category } = req.body;
    db.run(
        'INSERT INTO expenses (id, name, amount, category) VALUES (?, ?, ?, ?)',
        [id, name, amount, category],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id });
        }
    );
});

app.delete('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ──────────────────────────────────────────────
// Live Stock Market Data Integration (Yahoo Finance Proxy)
// ──────────────────────────────────────────────
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();
        
        if (!data.chart || !data.chart.result) {
            return res.status(404).json({ error: 'Stock not found or API limits reached.' });
        }
        
        const result = data.chart.result[0];
        const prices = result.indicators.quote[0].close.filter(p => p !== null).map(p => Math.round(p * 100) / 100);
        
        const latestPrices = prices.slice(-20);
        
        res.json({ symbol: symbol.toUpperCase(), prices: latestPrices });
    } catch (err) {
        console.error('Yahoo Finance Proxy Error:', err);
        res.status(500).json({ error: 'Failed to fetch live stock data.' });
    }
});

// ──────────────────────────────────────────────
// Hugging Face Fallback Helper
// ──────────────────────────────────────────────
async function hfInference(hfToken, model, inputs, parameters = {}) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
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

async function hfSentimentFallback(hfToken, texts) {
    // Use FinBERT for financial sentiment analysis
    const results = [];
    for (const text of texts) {
        try {
            const data = await hfInference(hfToken, 'ProsusAI/finbert', text);
            // FinBERT returns [[{label, score}, ...]] — pick the top result
            const top = data[0]?.reduce((a, b) => a.score > b.score ? a : b, data[0][0]);
            results.push({
                text,
                sentiment: top?.label?.toLowerCase() || 'neutral',
                confidence: Math.round((top?.score || 0.5) * 100),
            });
        } catch (innerErr) {
            console.error('HF FinBERT error for text:', innerErr.message);
            results.push({ text, sentiment: 'neutral', confidence: 50 });
        }
    }
    return results;
}

async function hfMarketAnalysisFallback(hfToken, prompt, maxTokens) {
    // Use Mistral-7B-Instruct for text generation
    const data = await hfInference(
        hfToken,
        'mistralai/Mistral-7B-Instruct-v0.3',
        `<s>[INST] You are an expert financial analyst. Provide a concise, highly analytical response based on market data.\n\n${prompt} [/INST]`,
        { max_new_tokens: maxTokens || 500, return_full_text: false }
    );
    return data[0]?.generated_text?.trim() || 'Analysis could not be generated.';
}

// ──────────────────────────────────────────────
// Groq AI Integration (Llama-3.1-8b) + Hugging Face Fallback
// ──────────────────────────────────────────────
app.post('/api/sentiment', async (req, res) => {
    const { texts, token, hfToken: bodyHfToken } = req.body;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of texts for analysis.' });
    }
    
    if (!token && !hfToken) {
        return res.status(401).json({ error: 'Please provide a Groq API Key or a Hugging Face Token.' });
    }

    // ── Try Groq first ──
    if (token) {
        try {
            const client = new Groq({ apiKey: token });
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
                return {
                    text,
                    sentiment: item.sentiment.toLowerCase(),
                    confidence: item.confidence,
                };
            });

            return res.json({ results, provider: 'groq' });
        } catch (err) {
            console.error('Groq Sentiment Error (will try HF fallback):', err.message);
        }
    }

    // ── Fallback to Hugging Face ──
    if (hfToken) {
        try {
            console.log('⤷ Falling back to Hugging Face for sentiment...');
            const results = await hfSentimentFallback(hfToken, texts);
            return res.json({ results, provider: 'huggingface' });
        } catch (err) {
            console.error('HF Sentiment Fallback Error:', err.message);
        }
    }

    res.status(500).json({ error: 'Both Groq and Hugging Face failed. Please check your API keys.' });
});

app.post('/api/market-analysis', async (req, res) => {
    const { prompt, max_tokens, token, hfToken: bodyHfToken } = req.body;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;

    if (!prompt) {
        return res.status(400).json({ error: 'Please provide a prompt.' });
    }
    
    if (!token && !hfToken) {
        return res.status(401).json({ error: 'Please provide a Groq API Key or a Hugging Face Token.' });
    }

    // ── Try Groq first ──
    if (token) {
        try {
            const client = new Groq({ apiKey: token });
            const completion = await client.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are an expert financial analyst. Provide a concise, highly analytical response based on market data." },
                    { role: "user", content: prompt }
                ],
                max_tokens: max_tokens || 500,
            });

            return res.json({
                prompt: prompt,
                response: completion.choices[0].message.content.trim(),
                provider: 'groq'
            });
        } catch (err) {
            console.error('Groq AI error (will try HF fallback):', err.message);
        }
    }

    // ── Fallback to Hugging Face ──
    if (hfToken) {
        try {
            console.log('⤷ Falling back to Hugging Face for market analysis...');
            const generatedText = await hfMarketAnalysisFallback(hfToken, prompt, max_tokens);
            return res.json({
                prompt: prompt,
                response: generatedText,
                provider: 'huggingface'
            });
        } catch (err) {
            console.error('HF Market Analysis Fallback Error:', err.message);
        }
    }

    res.status(500).json({ error: 'Both Groq and Hugging Face failed. Please check your API keys.' });
});

// ──────────────────────────────────────────────
// Zerodha / Kite Connect Integration
// ──────────────────────────────────────────────
app.get('/api/zerodha/login', (req, res) => {
    const loginUrl = kc.getLoginURL();
    res.json({ url: loginUrl });
});

app.post('/api/zerodha/session', async (req, res) => {
    const { request_token } = req.body;
    if (!request_token) return res.status(400).json({ error: 'Request token is required' });

    try {
        const response = await kc.generateSession(request_token, api_secret);
        // In a real app, you'd store these tokens securely (session/db)
        res.json({
            success: true,
            user_id: response.user_id,
            access_token: response.access_token
        });
    } catch (err) {
        console.error('Zerodha Session Error:', err);
        res.status(500).json({ error: 'Failed to generate Zerodha session' });
    }
});

app.get('/api/ai-status', (req, res) => {
    const hfAvailable = !!process.env.HF_TOKEN;
    res.json({ 
        status: 'ok', 
        model: 'llama-3.1-8b-instant', 
        mode: 'groq',
        fallback: hfAvailable ? 'huggingface' : 'none',
        fallbackModels: hfAvailable ? ['ProsusAI/finbert', 'mistralai/Mistral-7B-Instruct-v0.3'] : []
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Closed the database connection.');
        process.exit(0);
    });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
