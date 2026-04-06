/**
 * Unified Broker API - Supports Zerodha Kite & Angel One SmartAPI
 * 
 * Endpoints:
 *   GET  /api/broker?action=status        - Check broker connection status
 *   POST /api/broker?action=login          - Login to broker
 *   GET  /api/broker?action=portfolio      - Get holdings/portfolio
 *   GET  /api/broker?action=quote&symbol=X - Get live quote
 */

// In-memory session store (use Redis/DB in production)
const sessions = {
    zerodha: { connected: false, token: null },
    angelone: { connected: false, token: null }
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const action = req.query.action || 'status';
    const broker = req.query.broker || req.body?.broker || 'all';

    try {
        switch (action) {
            case 'status':
                return handleStatus(req, res);
            case 'login':
                return handleLogin(req, res, broker);
            case 'portfolio':
                return handlePortfolio(req, res, broker);
            case 'quote':
                return handleQuote(req, res);
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (err) {
        console.error('[Broker API Error]', err);
        return res.status(500).json({ error: err.message || 'Internal broker API error' });
    }
}

function handleStatus(req, res) {
    const zerodhaKey = process.env.ZERODHA_API_KEY;
    const angelKey = process.env.ANGELONE_API_KEY;

    return res.json({
        brokers: {
            zerodha: {
                configured: !!zerodhaKey,
                connected: sessions.zerodha.connected,
                name: 'Zerodha Kite',
                icon: 'https://kite.zerodha.com/static/images/kite-logo.svg'
            },
            angelone: {
                configured: !!angelKey,
                connected: sessions.angelone.connected,
                name: 'Angel One',
                icon: 'https://www.angelone.in/favicon.ico'
            }
        }
    });
}

async function handleLogin(req, res, broker) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST method required for login' });
    }

    const body = req.body || {};

    if (broker === 'zerodha') {
        return loginZerodha(req, res, body);
    } else if (broker === 'angelone') {
        return loginAngelOne(req, res, body);
    } else {
        return res.status(400).json({ error: 'Specify broker: zerodha or angelone' });
    }
}

async function loginZerodha(req, res, body) {
    const apiKey = body.apiKey || process.env.ZERODHA_API_KEY;
    const apiSecret = body.apiSecret || process.env.ZERODHA_API_SECRET;

    if (!apiKey || !apiSecret) {
        return res.status(400).json({ 
            error: 'Zerodha API key and secret are required.',
            help: 'Set ZERODHA_API_KEY and ZERODHA_API_SECRET in environment variables or pass in request body.'
        });
    }

    // Zerodha uses OAuth-style flow: redirect user to Kite login page
    const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`;
    
    sessions.zerodha.connected = true;
    
    return res.json({ 
        success: true,
        broker: 'zerodha',
        loginUrl,
        message: 'Redirect user to loginUrl to complete Kite authentication.'
    });
}

async function loginAngelOne(req, res, body) {
    const apiKey = body.apiKey || process.env.ANGELONE_API_KEY;
    const clientId = body.clientId || process.env.ANGELONE_CLIENT_ID;
    const password = body.password || process.env.ANGELONE_PASSWORD;
    const totp = body.totp || process.env.ANGELONE_TOTP;

    if (!apiKey) {
        return res.status(400).json({ 
            error: 'Angel One API key is required.',
            help: 'Set ANGELONE_API_KEY in environment variables or pass in request body.'
        });
    }

    if (!clientId || !password) {
        return res.status(400).json({ 
            error: 'Angel One Client ID and Password are required for session generation.',
            help: 'Set ANGELONE_CLIENT_ID and ANGELONE_PASSWORD in env vars, or pass in request body.'
        });
    }

    try {
        // Angel One SmartAPI Login via REST
        const loginRes = await fetch('https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-UserType': 'USER',
                'X-SourceID': 'WEB',
                'X-ClientLocalIP': '127.0.0.1',
                'X-ClientPublicIP': '127.0.0.1',
                'X-MACAddress': '00:00:00:00:00:00',
                'X-PrivateKey': apiKey
            },
            body: JSON.stringify({
                clientcode: clientId,
                password: password,
                totp: totp || ''
            })
        });

        const loginData = await loginRes.json();

        if (loginData.status === false || !loginData.data?.jwtToken) {
            return res.status(401).json({ 
                error: loginData.message || 'Angel One login failed.',
                details: loginData
            });
        }

        sessions.angelone = {
            connected: true,
            token: loginData.data.jwtToken,
            refreshToken: loginData.data.refreshToken,
            feedToken: loginData.data.feedToken
        };

        return res.json({
            success: true,
            broker: 'angelone',
            message: 'Angel One login successful!',
            feedToken: loginData.data.feedToken ? true : false
        });
    } catch (err) {
        return res.status(500).json({ 
            error: 'Failed to connect to Angel One API.',
            details: err.message
        });
    }
}

async function handlePortfolio(req, res, broker) {
    if (broker === 'angelone' && sessions.angelone.connected && sessions.angelone.token) {
        try {
            const holdingsRes = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getHolding', {
                headers: {
                    'Authorization': `Bearer ${sessions.angelone.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-UserType': 'USER',
                    'X-SourceID': 'WEB',
                    'X-ClientLocalIP': '127.0.0.1',
                    'X-ClientPublicIP': '127.0.0.1',
                    'X-MACAddress': '00:00:00:00:00:00',
                    'X-PrivateKey': process.env.ANGELONE_API_KEY
                }
            });
            const holdingsData = await holdingsRes.json();
            return res.json({ broker: 'angelone', holdings: holdingsData.data || [] });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to fetch Angel One portfolio' });
        }
    }

    return res.json({
        broker: broker,
        holdings: [],
        message: 'Not connected to any broker. Please login first.'
    });
}

async function handleQuote(req, res) {
    const symbol = req.query.symbol;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    // Use Yahoo Finance as universal fallback for quotes
    try {
        const querySymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
        const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySymbol)}?range=1d&interval=5m`;
        const response = await fetch(yahooUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();

        if (data.chart?.result) {
            const meta = data.chart.result[0].meta;
            return res.json({
                symbol: meta.symbol,
                price: meta.regularMarketPrice,
                previousClose: meta.previousClose,
                change: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2),
                currency: meta.currency,
                exchange: meta.exchangeName
            });
        }

        return res.status(404).json({ error: 'Quote not found' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch quote' });
    }
}
