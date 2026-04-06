/**
 * Expenses API - Serverless endpoint
 * GET    /api/expenses           - Get all expenses
 * POST   /api/expenses           - Add expense { name, category, amount, id }
 * DELETE /api/expenses?id=X      - Delete expense by ID
 * 
 * Note: On Vercel serverless, there's no persistent storage.
 * The client uses localStorage as primary storage; this API
 * is a placeholder that returns graceful responses.
 */

// In-memory store (resets on cold start - client localStorage is primary)
let storedExpenses = [];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        return res.json(storedExpenses);
    }

    if (req.method === 'POST') {
        const expense = req.body;
        if (!expense || !expense.name || !expense.amount) {
            return res.status(400).json({ error: 'Expense name and amount are required' });
        }
        const newExpense = {
            id: expense.id || Date.now().toString(),
            name: expense.name,
            category: expense.category || 'Other',
            amount: Number(expense.amount)
        };
        storedExpenses.push(newExpense);
        return res.json({ success: true, expense: newExpense });
    }

    if (req.method === 'DELETE') {
        const id = req.query.id;
        if (id) {
            storedExpenses = storedExpenses.filter(e => e.id !== id);
            return res.json({ success: true });
        }
        return res.status(400).json({ error: 'Expense ID required' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
