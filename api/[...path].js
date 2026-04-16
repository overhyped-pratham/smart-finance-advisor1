import Groq from 'groq-sdk';
import { connectMongo } from './_lib/mongo.js';
import { setCors, isPreflight } from './_lib/http.js';
import { requireJwt, issueToken } from './_lib/auth.js';
import { User, Budget, Expense } from './_lib/models.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function readJson(req) {
  return req.body || {};
}

function getRoute(req) {
  const p = req.query?.path;
  const parts = Array.isArray(p) ? p : (typeof p === 'string' ? [p] : []);
  return '/' + parts.join('/');
}

async function hfInference(hfToken, model, inputs, parameters = {}) {
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs, parameters }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export default async function handler(req, res) {
  setCors(res);
  if (isPreflight(req)) return res.status(200).end();

  const route = getRoute(req);

  try {
    // ──────────────────────────────────────────────
    // Health
    // ──────────────────────────────────────────────
    if (route === '/ai-status' && req.method === 'GET') {
      return res.json({
        status: 'ok',
        model: 'llama-3.1-8b-instant',
        mode: 'groq',
        fallback: process.env.HF_TOKEN ? 'huggingface' : process.env.GEMINI_API_KEY ? 'gemini' : 'none',
        env: { hasGroq: !!process.env.GROQ_API_KEY, hasHF: !!process.env.HF_TOKEN, hasGemini: !!process.env.GEMINI_API_KEY },
      });
    }

    // ──────────────────────────────────────────────
    // Auth (MongoDB + JWT)
    // ──────────────────────────────────────────────
    if (route === '/auth/signup' && req.method === 'POST') {
      await connectMongo();
      const { email, password, username } = await readJson(req);
      if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
      if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

      const normalizedEmail = String(email).toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail }).lean();
      if (existing) return res.status(409).json({ error: 'Email already in use' });

      const uid = new mongoose.Types.ObjectId().toString();
      const password_hash = await bcrypt.hash(String(password), 10);
      const cleanUsername = username ? String(username).trim() : '';

      await User.create({ _id: uid, email: normalizedEmail, username: cleanUsername, password_hash, updated_at: new Date() });
      await Budget.updateOne({ _id: uid }, { $setOnInsert: { _id: uid, amount: 0, updated_at: new Date() } }, { upsert: true });

      const token = issueToken(uid);
      return res.json({ token, user: { id: uid, email: normalizedEmail, username: cleanUsername } });
    }

    if (route === '/auth/login' && req.method === 'POST') {
      await connectMongo();
      const { email, password } = await readJson(req);
      if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

      const normalizedEmail = String(email).toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail }).lean();
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      const ok = await bcrypt.compare(String(password), user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

      const token = issueToken(user._id);
      return res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
    }

    if (route === '/auth/me' && req.method === 'GET') {
      await connectMongo();
      const { uid } = requireJwt(req);
      const user = await User.findById(uid).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user: { id: user._id, email: user.email, username: user.username } });
    }

    // ──────────────────────────────────────────────
    // Profile / Budget / Expenses (MongoDB)
    // ──────────────────────────────────────────────
    if (route === '/profile') {
      await connectMongo();
      const { uid } = requireJwt(req);

      if (req.method === 'GET') {
        const user = await User.findById(uid).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ id: user._id, username: user.username, email: user.email, updated_at: user.updated_at });
      }

      if (req.method === 'PUT') {
        const { username, email } = await readJson(req);
        if (!username && !email) return res.status(400).json({ error: 'Provide username or email to update' });

        const update = { updated_at: new Date() };
        if (username) update.username = String(username).trim();
        if (email) update.email = String(email).toLowerCase().trim();

        await User.updateOne({ _id: uid }, { $set: update }, { upsert: false });
        const updated = await User.findById(uid).lean();
        return res.json({ success: true, user: { id: updated._id, username: updated.username, email: updated.email } });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (route === '/budget') {
      await connectMongo();
      const { uid } = requireJwt(req);

      if (req.method === 'GET') {
        const budget = await Budget.findById(uid).lean();
        return res.json({ amount: budget?.amount ?? 0 });
      }

      if (req.method === 'POST') {
        const { amount } = await readJson(req);
        if (typeof amount !== 'number' || amount < 0) return res.status(400).json({ error: 'Invalid budget amount' });
        await Budget.updateOne({ _id: uid }, { $set: { amount, updated_at: new Date() } }, { upsert: true });
        return res.json({ success: true, amount });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (route === '/expenses') {
      await connectMongo();
      const { uid } = requireJwt(req);

      if (req.method === 'GET') {
        const rows = await Expense.find({ user_id: uid }).sort({ created_at: -1 }).lean();
        return res.json(rows.map((r) => ({ id: r._id, ...r })));
      }

      if (req.method === 'POST') {
        const { id, name, amount, category } = await readJson(req);
        if (!name || amount === undefined || amount === null) return res.status(400).json({ error: 'name and amount are required' });
        const expenseId = id || Date.now().toString();
        await Expense.updateOne(
          { _id: expenseId },
          {
            $set: {
              user_id: uid,
              name: String(name),
              amount: Number(amount),
              category: category ? String(category) : 'Other',
            },
            $setOnInsert: { created_at: new Date() },
          },
          { upsert: true }
        );
        return res.json({ success: true, id: expenseId });
      }

      if (req.method === 'DELETE') {
        const id = req.query?.id;
        if (!id) return res.status(400).json({ error: 'Expense ID required' });
        await Expense.deleteOne({ _id: String(id), user_id: uid });
        return res.json({ success: true });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ──────────────────────────────────────────────
    // Stock / Search / Scan / Predict
    // ──────────────────────────────────────────────
    if (route === '/stock' && req.method === 'GET') {
      let symbol = req.query.symbol;
      if (Array.isArray(symbol)) symbol = symbol.join('/');
      if (!symbol) return res.status(400).json({ error: 'Symbol required. Usage: /api/stock?symbol=RELIANCE.NS' });

      try {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
        let response = await fetch(yahooUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
        });

        let data;
        try {
          data = await response.json();
        } catch {
          const altUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
          response = await fetch(altUrl, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
          data = await response.json();
        }

        if (!data.chart || !data.chart.result) {
          const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
            String(symbol).replace('.NS', '')
          )}&quotesCount=1&newsCount=0`;
          const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
          const searchData = await searchRes.json();
          if (searchData.quotes && searchData.quotes.length > 0) {
            const resolvedSymbol = searchData.quotes[0].symbol;
            const retryUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(resolvedSymbol)}?range=1mo&interval=1d`;
            const retryRes = await fetch(retryUrl, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
            data = await retryRes.json();
          }
          if (!data.chart || !data.chart.result) {
            return res.status(404).json({ error: `Stock "${symbol}" not found. Try adding .NS for Indian stocks (e.g. RELIANCE.NS)` });
          }
        }

        const result = data.chart.result[0];
        const closePrices = result.indicators.quote[0].close;
        const prices = closePrices.filter((p) => p !== null).map((p) => Math.round(p * 100) / 100);
        if (prices.length === 0) return res.status(404).json({ error: 'No price data available for this stock.' });

        const meta = result.meta;
        return res.json({
          symbol: meta.symbol || String(symbol).toUpperCase(),
          prices: prices.slice(-20),
          currency: meta.currency || 'INR',
          exchange: meta.exchangeName || 'NSE',
          regularMarketPrice: meta.regularMarketPrice || prices[prices.length - 1],
        });
      } catch (err) {
        console.error('Stock API Error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch live stock data. Yahoo Finance may be temporarily unavailable.' });
      }
    }

    if (route === '/search-stock' && req.method === 'GET') {
      const query = req.query.q;
      if (!query) return res.status(400).json({ error: 'Query required' });
      try {
        const response = await fetch(
          `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const data = await response.json();
        const results = data.quotes
          ? data.quotes
              .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
              .map((q) => ({ symbol: q.symbol, name: q.shortname || q.longname || q.symbol, exchange: q.exchange, score: q.score }))
              .sort((a, b) => b.score - a.score)
          : [];
        return res.json({ results });
      } catch {
        return res.status(500).json({ error: 'Failed to search stocks' });
      }
    }

    if (route === '/scan' && req.method === 'GET') {
      // Minimal scanner: 10 symbols like local backend (fast enough for serverless)
      const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS', 'LT.NS'];
      try {
        const results = [];
        for (const sym of symbols) {
          try {
            const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1mo&interval=1d`;
            const response = await fetch(yahooUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const data = await response.json();
            if (data.chart?.result) {
              const meta = data.chart.result[0].meta;
              const closePrices = data.chart.result[0].indicators.quote[0].close.filter((p) => p !== null);
              const latestPrice = meta.regularMarketPrice;
              const prevClose = meta.previousClose;
              const changePercent = ((latestPrice - prevClose) / prevClose) * 100;
              const ma5 = closePrices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, closePrices.length);
              const signal = latestPrice > ma5 ? 'BUY' : latestPrice < ma5 * 0.98 ? 'SELL' : 'HOLD';
              results.push({ symbol: sym.replace('.NS', ''), price: latestPrice, change: Math.round(changePercent * 100) / 100, signal, ma5: Math.round(ma5 * 100) / 100 });
            }
          } catch {
            // ignore symbol
          }
        }
        return res.json({ results, timestamp: new Date().toISOString() });
      } catch {
        return res.status(500).json({ error: 'Scanner failed' });
      }
    }

    if (route === '/predict' && req.method === 'POST') {
      const { symbol, historical_prices } = await readJson(req);
      if (!historical_prices || !Array.isArray(historical_prices) || historical_prices.length < 3) {
        return res.status(400).json({ error: 'Please provide at least 3 historical prices for prediction.' });
      }
      try {
        const n = historical_prices.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = historical_prices.reduce((a, b) => a + b, 0);
        const sumXY = historical_prices.reduce((acc, y, i) => acc + i * y, 0);
        const sumXX = Array.from({ length: n }, (_, i) => i * i).reduce((a, b) => a + b, 0);
        const denom = n * sumXX - sumX * sumX;
        const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
        const intercept = (sumY - slope * sumX) / n;
        const predictedPrice = slope * n + intercept;
        const ma5 = historical_prices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, historical_prices.length);
        const ma10 = historical_prices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, historical_prices.length);
        const weightedPrediction = predictedPrice * 0.5 + ma5 * 0.3 + ma10 * 0.2;
        const meanY = sumY / n;
        const ssRes = historical_prices.reduce((acc, y, i) => {
          const predicted = slope * i + intercept;
          return acc + Math.pow(y - predicted, 2);
        }, 0);
        const ssTot = historical_prices.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
        const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
        let confidence = 'Low';
        if (rSquared > 0.7) confidence = 'High';
        else if (rSquared > 0.4) confidence = 'Moderate';
        const lastPrice = historical_prices[historical_prices.length - 1];
        const changePercent = ((weightedPrediction - lastPrice) / lastPrice) * 100;
        const trend = weightedPrediction > lastPrice ? 'Bullish' : weightedPrediction < lastPrice ? 'Bearish' : 'Neutral';
        return res.json({
          symbol: symbol || 'UNKNOWN',
          predicted_price: Math.round(weightedPrediction * 100) / 100,
          confidence,
          model: 'Ensemble (Linear Regression + Moving Averages)',
          r_squared: Math.round(rSquared * 1000) / 1000,
          trend,
          change_percent: String(Math.round(changePercent * 100) / 100),
          ma5: Math.round(ma5 * 100) / 100,
          ma10: Math.round(ma10 * 100) / 100,
          data_points: n,
        });
      } catch (err) {
        return res.status(500).json({ error: 'Prediction model error: ' + err.message });
      }
    }

    // ──────────────────────────────────────────────
    // Sentiment / Market Analysis (Groq → HF → Gemini)
    // ──────────────────────────────────────────────
    if (route === '/sentiment' && req.method === 'POST') {
      const { texts, token, hfToken: bodyHfToken, geminiToken: bodyGeminiToken } = await readJson(req);
      const groqToken = token || process.env.GROQ_API_KEY;
      const hfToken = bodyHfToken || process.env.HF_TOKEN;
      const geminiToken = bodyGeminiToken || process.env.GEMINI_API_KEY;
      if (!texts || !Array.isArray(texts)) return res.status(400).json({ error: 'Invalid input' });

      const errors = {};
      let attempted = false;

      if (groqToken) {
        attempted = true;
        try {
          const client = new Groq({ apiKey: groqToken });
          const completion = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content:
                  "Analyze the sentiment of the following financial texts. Return a JSON array of objects with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-100) for each text.",
              },
              { role: 'user', content: JSON.stringify(texts) },
            ],
            response_format: { type: 'json_object' },
          });
          const data = JSON.parse(completion.choices[0].message.content);
          const arr = Array.isArray(data) ? data : data.results || data.sentiments || data.analysis || [data];
          const results = texts.map((text, idx) => {
            const item = arr[idx] || {};
            const sentiment = (item.sentiment || item.label || 'neutral').toString().toLowerCase();
            const confidence = item.confidence || item.score || 50;
            return { text, sentiment, confidence: typeof confidence === 'number' && confidence <= 1 ? Math.round(confidence * 100) : confidence };
          });
          return res.json({ results, provider: 'groq' });
        } catch (err) {
          errors.groq = err.message;
        }
      }

      if (hfToken) {
        attempted = true;
        try {
          const results = [];
          for (const text of texts) {
            const data = await hfInference(hfToken, 'ProsusAI/finbert', text);
            const top = data[0]?.reduce((a, b) => (a.score > b.score ? a : b), data[0][0]);
            results.push({ text, sentiment: top?.label?.toLowerCase() || 'neutral', confidence: Math.round((top?.score || 0.5) * 100) });
          }
          return res.json({ results, provider: 'huggingface' });
        } catch (err) {
          errors.huggingface = err.message;
        }
      }

      if (geminiToken) {
        attempted = true;
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text:
                          "Analyze the sentiment of the following financial texts. Return STRICTLY a JSON array of objects with 'sentiment' (positive, negative, or neutral) and 'confidence' (0-100) for each text. Do not include markdown formatting.\n\nTexts: " +
                          JSON.stringify(texts),
                      },
                    ],
                  },
                ],
                generationConfig: { response_mime_type: 'application/json' },
              }),
            }
          );
          if (!response.ok) throw new Error(await response.text());
          const responseData = await response.json();
          const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textResponse) throw new Error('Invalid response format from Gemini');
          const data = JSON.parse(textResponse);
          const results = texts.map((text, idx) => {
            const item = (data.results || data)[idx] || { sentiment: 'neutral', confidence: 50 };
            return { text, sentiment: item?.sentiment?.toLowerCase() || 'neutral', confidence: item?.confidence || 50 };
          });
          return res.json({ results, provider: 'gemini' });
        } catch (err) {
          errors.gemini = err.message;
        }
      }

      if (!attempted) return res.status(400).json({ error: 'No API keys were provided or configured.' });
      return res.status(500).json({ error: 'All configured AI providers failed.', details: errors });
    }

    if (route === '/market-analysis' && req.method === 'POST') {
      const { prompt, max_tokens, token, hfToken: bodyHfToken, geminiToken: bodyGeminiToken } = await readJson(req);
      const groqToken = token || process.env.GROQ_API_KEY;
      const hfToken = bodyHfToken || process.env.HF_TOKEN;
      const geminiToken = bodyGeminiToken || process.env.GEMINI_API_KEY;
      if (!prompt) return res.status(400).json({ error: 'Please provide a prompt.' });

      const errors = {};
      let attempted = false;

      if (groqToken) {
        attempted = true;
        try {
          const client = new Groq({ apiKey: groqToken });
          const completion = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are an expert financial analyst. Provide a concise, highly analytical response based on market data.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: max_tokens || 500,
          });
          return res.json({ prompt, response: completion.choices[0].message.content.trim(), provider: 'groq' });
        } catch (err) {
          errors.groq = err.message;
        }
      }

      if (hfToken) {
        attempted = true;
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
          errors.huggingface = err.message;
        }
      }

      if (geminiToken) {
        attempted = true;
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiToken}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'You are an expert financial analyst. Provide a concise, highly analytical response based on market data.\n\n' + prompt }] }],
              }),
            }
          );
          if (!response.ok) throw new Error(await response.text());
          const data = await response.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textResponse) throw new Error('Invalid response from Gemini');
          return res.json({ prompt, response: textResponse.trim(), provider: 'gemini' });
        } catch (err) {
          errors.gemini = err.message;
        }
      }

      if (!attempted) return res.status(400).json({ error: 'No API keys were provided or configured.' });
      return res.status(500).json({ error: 'All configured AI providers failed.', details: errors });
    }

    // ──────────────────────────────────────────────
    // Broker (status/quote only; login/portfolio not implemented serverlessly)
    // ──────────────────────────────────────────────
    if (route === '/broker' && req.method === 'GET') {
      const action = req.query.action || 'status';
      if (action === 'status') {
        return res.json({
          brokers: {
            zerodha: { configured: !!process.env.ZERODHA_API_KEY, connected: false, name: 'Zerodha Kite' },
            angelone: { configured: !!process.env.ANGELONE_API_KEY, connected: false, name: 'Angel One' },
          },
        });
      }
      return res.json({ message: `Action ${action} not implemented in serverless mode` });
    }

    return res.status(404).json({ error: `Unknown route: ${route}` });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Internal error' });
  }
}

