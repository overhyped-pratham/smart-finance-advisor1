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
// Groq AI Integration (Llama-3.1-8b)
// ──────────────────────────────────────────────
app.post('/api/sentiment', async (req, res) => {
    const { texts, token } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of texts for analysis.' });
    }
    
    if (!token) {
        return res.status(401).json({ error: 'Please provide a Groq API Key.' });
    }

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
        // Assuming data is { results: [...] } or just an array
        const results = texts.map((text, idx) => {
            const item = (data.results || data)[idx] || { sentiment: 'neutral', confidence: 50 };
            return {
                text,
                sentiment: item.sentiment.toLowerCase(),
                confidence: item.confidence,
            };
        });

        res.json({ results });
    } catch (err) {
        console.error('Groq Sentiment Error:', err);
        res.status(500).json({ error: 'Failed to process sentiment via Groq.' });
    }
});

app.post('/api/market-analysis', async (req, res) => {
    const { prompt, max_tokens, token } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Please provide a prompt.' });
    }
    
    if (!token) {
        return res.status(401).json({ error: 'Please provide a Groq API Key.' });
    }

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

        res.json({
            prompt: prompt,
            response: completion.choices[0].message.content.trim()
        });

    } catch (err) {
        console.error('Groq AI error:', err);
        res.status(500).json({ error: 'Failed to process request via Groq AI. Check your API key.' });
    }
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
    res.json({ status: 'ok', model: 'llama-3.1-8b-instant', mode: 'groq' });
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
