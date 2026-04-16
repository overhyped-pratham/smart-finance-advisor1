import { connectMongo } from '../_lib/mongo.js';
import { requireJwt } from '../_lib/auth.js';
import { setCors, isPreflight } from '../_lib/http.js';
import { User } from '../_lib/models.js';

export default async function handler(req, res) {
  setCors(res);
  if (isPreflight(req)) return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectMongo();
    const { uid } = requireJwt(req);
    const user = await User.findById(uid).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { id: user._id, email: user.email, username: user.username } });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch user' });
  }
}

