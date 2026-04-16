import jwt from 'jsonwebtoken';

export function requireJwt(req) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  const token = header.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded?.uid) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }
    return { uid: decoded.uid };
  } catch {
    const err = new Error('Invalid token');
    err.statusCode = 403;
    throw err;
  }
}

export function issueToken(uid) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ uid }, secret, { expiresIn: '7d' });
}

