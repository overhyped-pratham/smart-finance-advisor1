import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectMongo } from '../_lib/mongo.js';
import { issueToken } from '../_lib/auth.js';
import { setCors, isPreflight } from '../_lib/http.js';
import { User, Budget } from '../_lib/models.js';

export default async function handler(req, res) {
  setCors(res);
  if (isPreflight(req)) return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectMongo();
    const { email, password, username } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const uid = new mongoose.Types.ObjectId().toString();
    const password_hash = await bcrypt.hash(String(password), 10);
    const cleanUsername = username ? String(username).trim() : '';

    await User.create({
      _id: uid,
      email: normalizedEmail,
      username: cleanUsername,
      password_hash,
      updated_at: new Date(),
    });

    await Budget.updateOne({ _id: uid }, { $setOnInsert: { _id: uid, amount: 0, updated_at: new Date() } }, { upsert: true });

    const token = issueToken(uid);
    return res.json({ token, user: { id: uid, email: normalizedEmail, username: cleanUsername } });
  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ error: 'Failed to sign up' });
  }
}

