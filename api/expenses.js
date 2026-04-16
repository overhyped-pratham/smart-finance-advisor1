import { connectMongo } from './_lib/mongo.js';
import { requireJwt } from './_lib/auth.js';
import { setCors, isPreflight } from './_lib/http.js';
import { Expense } from './_lib/models.js';

export default async function handler(req, res) {
  setCors(res);
  if (isPreflight(req)) return res.status(200).end();

  try {
    await connectMongo();
    const { uid } = requireJwt(req);

    if (req.method === 'GET') {
      const rows = await Expense.find({ user_id: uid }).sort({ created_at: -1 }).lean();
      return res.json(rows.map((r) => ({ id: r._id, ...r })));
    }

    if (req.method === 'POST') {
      const { id, name, amount, category } = req.body || {};
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
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to handle expenses' });
  }
}
