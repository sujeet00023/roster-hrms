import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not set. Copy .env.local.example to .env.local and fill it in."
  );
}

const mongoUri: string = MONGODB_URI;

/**
 * Next.js reloads modules in development, which would otherwise
 * create a new MongoDB connection on every file save.
 
 * We cache the connection and the in-flight connection promise
 * on the global object so they can be reused across hot reloads.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache =
  global._mongooseCache ?? {
    conn: null,
    promise: null,
  };

global._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  // Already connected
  if (cache.conn) {
    return cache.conn;
  }

  // Connection is already in progress
  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri, {
  bufferCommands: false,
});
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}