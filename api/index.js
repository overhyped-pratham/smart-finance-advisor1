import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { KiteConnect } from 'kiteconnect';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// In-Memory Data (Vercel Fallback)
// ──────────────────────────────────────────────
let budget = 0;
let expenses = [
    { id: '1', name: 'Rent', amount: 1500, category: 'Housing' },
    { id: '2', name: 'Groceries', amount: 400, category: 'Food' },
    { id: '3', name: 'Gas', amount: 150, category: 'Transportation' }
];

// ──────────────────────────────────────────────
// AI Config
// ──────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'gsk_dummy' });

// ──────────────────────────────────────────────
// Zerodha Setup
// ──────────────────────────────────────────────
const kc = new KiteConnect({ api_key: process.env.ZERODHA_API_KEY });

// ──────────────────────────────────────────────
// API Routes — Budget & Expenses
// ──────────────────────────────────────────────
app.get('/api/budget', (req, res) => res.json({ amount: budget }));
app.post('/api/budget', (req, res) => {
    budget = req.body.amount;
    res.json({ success: true, amount: budget });
});

app.get('/api/expenses', (req, res) => res.json(expenses));
app.post('/api/expenses', (req, res) => {
    const newExp = req.body;
    expenses.push(newExp);
    res.json({ success: true, id: newExp.id });
});

app.delete('/api/expenses/:id', (req, res) => {
    expenses = expenses.filter(e => e.id !== req.params.id);
    res.json({ success: true });
});

// ──────────────────────────────────────────────
// Stock Data
// ──────────────────────────────────────────────
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();
        if (!data.chart?.result) return res.status(404).json({ error: 'Not found' });
        const result = data.chart.result[0];
        const prices = result.indicators.quote[0].close.filter(p => p !== null).map(p => Math.round(p * 100) / 100);
        res.json({ symbol: symbol.toUpperCase(), prices: prices.slice(-20) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ──────────────────────────────────────────────
// HF Fallbacks
// ──────────────────────────────────────────────
async function hfInference(hfToken, model, inputs, parameters = {}) {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs, parameters }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function hfSentimentFallback(hfToken, texts) {
    const results = [];
    for (const text of texts) {
        try {
            const data = await hfInference(hfToken, 'ProsusAI/finbert', text);
            const top = data[0]?.reduce((a, b) => a.score > b.score ? a : b, data[0][0]);
            results.push({ text, sentiment: top?.label?.toLowerCase() || 'neutral', confidence: Math.round((top?.score || 0.5) * 100) });
        } catch {
            results.push({ text, sentiment: 'neutral', confidence: 50 });
        }
    }
    return results;
}

async function hfMarketAnalysisFallback(hfToken, prompt, maxTokens) {
    const data = await hfInference(hfToken, 'mistralai/Mistral-7B-Instruct-v0.3', `<s>[INST] ${prompt} [/INST]`, { max_new_tokens: maxTokens || 500 });
    return data[0]?.generated_text?.trim() || 'Error';
}

// ──────────────────────────────────────────────
// Main AI Routes
// ──────────────────────────────────────────────
app.post('/api/sentiment', async (req, res) => {
    const { texts, token, hfToken: bodyHfToken } = req.body;
    const groqToken = token || process.env.GROQ_API_KEY;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;

    if (groqToken) {
        try {
            const g = new Groq({ apiKey: groqToken });
            const completion = await g.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: "Return JSON array: {sentiment, confidence} for each text." }, { role: "user", content: JSON.stringify(texts) }],
                response_format: { type: "json_object" }
            });
            const data = JSON.parse(completion.choices[0].message.content);
            const results = texts.map((text, idx) => ({ text, sentiment: (data.results || data)[idx]?.sentiment || 'neutral', confidence: (data.results || data)[idx]?.confidence || 50 }));
            return res.json({ results, provider: 'groq' });
        } catch (err) { console.error(err); }
    }

    if (hfToken) {
        const results = await hfSentimentFallback(hfToken, texts);
        return res.json({ results, provider: 'huggingface' });
    }
    res.status(401).json({ error: 'No API Key' });
});

app.post('/api/market-analysis', async (req, res) => {
    const { prompt, max_tokens, token, hfToken: bodyHfToken } = req.body;
    const groqToken = token || process.env.GROQ_API_KEY;
    const hfToken = bodyHfToken || process.env.HF_TOKEN;

    if (groqToken) {
        try {
            const g = new Groq({ apiKey: groqToken });
            const completion = await g.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: "Financial analyst." }, { role: "user", content: prompt }],
                max_tokens: max_tokens || 500
            });
            return res.json({ prompt, response: completion.choices[0].message.content.trim(), provider: 'groq' });
        } catch (err) { console.error(err); }
    }

    if (hfToken) {
        const response = await hfMarketAnalysisFallback(hfToken, prompt, max_tokens);
        return res.json({ prompt, response, provider: 'huggingface' });
    }
    res.status(401).json({ error: 'No API Key' });
});

app.get('/api/ai-status', (req, res) => {
    res.json({ status: 'ok', provider: process.env.GROQ_API_KEY ? 'groq' : 'none', fallback: process.env.HF_TOKEN ? 'huggingface' : 'none' });
});

export default app;
