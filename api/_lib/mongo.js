import mongoose from 'mongoose';

let cached = global.__SFA_MONGO__;
if (!cached) {
  cached = global.__SFA_MONGO__ = { conn: null, promise: null };
}

export async function connectMongo() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured');

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || undefined,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

