import { connectMongo } from './_lib/mongo.js';
import { requireJwt } from './_lib/auth.js';
import { setCors, isPreflight } from './_lib/http.js';
import { User } from './_lib/models.js';

export default async function handler(req, res) {
  setCors(res);
  if (isPreflight(req)) return res.status(200).end();

  try {
    await connectMongo();
    const { uid } = requireJwt(req);

    if (req.method === 'GET') {
      const user = await User.findById(uid).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ id: user._id, username: user.username, email: user.email, updated_at: user.updated_at });
    }

    if (req.method === 'PUT') {
      const { username, email } = req.body || {};
      if (!username && !email) return res.status(400).json({ error: 'Provide username or email to update' });

      const update = { updated_at: new Date() };
      if (username) update.username = String(username).trim();
      if (email) update.email = String(email).toLowerCase().trim();

      await User.updateOne({ _id: uid }, { $set: update }, { upsert: false });
      const updated = await User.findById(uid).lean();
      return res.json({ success: true, user: { id: updated._id, username: updated.username, email: updated.email } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message || 'Failed to handle profile' });
  }
}

