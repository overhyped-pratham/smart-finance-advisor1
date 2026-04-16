import { connectMongo } from './_lib/mongo.js';
import { requireJwt } from './_lib/auth.js';
import { setCors, isPreflight } from './_lib/http.js';
import { Budget } from './_lib/models.js';

export default async function handler(req, res) {
  setCors(res);
  if (isPreflight(req)) return res.status(200).end();

  try {
    await connectMongo();
    const { uid } = requireJwt(req);

    if (req.method === 'GET') {
      const budget = await Budget.findById(uid).lean();
      return res.json({ amount: budget?.amount ?? 0 });
    }

    if (req.method === 'POST') {
      const { amount } = req.body || {};
      if (typeof amount !== 'number' || amount < 0) return res.status(400).json({ error: 'Invalid budget amount' });
      await Budget.updateOne({ _id: uid }, { $set: { amount, updated_at: new Date() } }, { upsert: true });
      return res.json({ success: true, amount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to handle budget' });
  }
}
