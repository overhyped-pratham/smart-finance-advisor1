/**
 * Budget API - Serverless endpoint
 * GET  /api/budget         - Get current budget
 * POST /api/budget          - Set budget { amount: number }
 * 
 * Note: On Vercel serverless, there's no persistent storage.
 * The client uses localStorage as primary storage; this API
 * is a placeholder that returns graceful responses.
 */

// In-memory store (resets on cold start - client localStorage is primary)
let storedBudget = 0;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        return res.json({ amount: storedBudget });
    }

    if (req.method === 'POST') {
        const { amount } = req.body || {};
        if (typeof amount === 'number' && amount >= 0) {
            storedBudget = amount;
            return res.json({ success: true, amount: storedBudget });
        }
        return res.status(400).json({ error: 'Invalid budget amount' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
