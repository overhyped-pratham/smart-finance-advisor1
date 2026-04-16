import bcrypt from 'bcryptjs';
import { connectMongo } from '../_lib/mongo.js';
import { issueToken } from '../_lib/auth.js';
import { setCors, isPreflight } from '../_lib/http.js';
import { User } from '../_lib/models.js';

export default async function handler(req, res) {
  setCors(res);
  if (isPreflight(req)) return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectMongo();
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = issueToken(user._id);
    return res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Failed to log in' });
  }
}

