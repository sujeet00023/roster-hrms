import mongoose from "mongoose";
import { ModuleRunner } from "vite/module-runner";

const MONGODB_URI = process.env.MONGODB_URI;

if(!MONGODB_URI){
    throw new Error(
        "MONGODB_URI is not set. copy .env.local.example to .env.local and fill it in."
    );
}

/**
 * Next.js reloads modules in dev, which would otherwise open a fresh
 * connection on every file save. Cache the connection (and the in-flight
 * connect promise) on the global object so we reuse it across reloads.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;

}

declare global {
    var _mongooseCache: MongooseCache | undefined;

}

const cache: MongooseCache = global._mongooseCache ?? {conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
    if(cache.conn) return cache.conn;

    if(!cache.promise) {
        cache.promise = mongoose.connect(MONGODB_URI as string, {
            bufferCommands: false,
        });
    }

    try {
        cache.conn = await cache.promise;

    }catch (err) {
        cache.promise = null;
        throw err;
    }

    return cache.conn;
    
}