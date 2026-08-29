import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load .env for local development only — do NOT override env vars already set
// by the hosting platform (Render, Vercel, etc.)
dotenv.config();

export const pgPool = new Pool(
  process.env.POSTGRES_URL
    ? {
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

// MongoDB client — with aggressive timeouts so a dead cluster fails in ~3s
const mongoUri = process.env.MONGODB_URI;
export const mongoClient = mongoUri
  ? new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 3000,   // fail fast if no server found
      connectTimeoutMS: 3000,
      socketTimeoutMS: 3000,
    })
  : null;
export let isMongoConnected = false;

// Redis client (Optional) — with aggressive connect timeout
const REDIS_CONNECT_TIMEOUT_MS = 3000;
export const redisClient = process.env.REDIS_URL
  ? createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: REDIS_CONNECT_TIMEOUT_MS },
    })
  : process.env.REDIS_HOST
  ? createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    })
  : null;
export let isRedisConnected = false;

// Initialize databases — PostgreSQL is required, MongoDB and Redis are optional
export async function initializeDatabases() {
  const maxRetries = 3;       // Reduced from 5 — fail fast for Render health checks
  const retryDelay = 2000;

  // ── PostgreSQL (required) ──────────────────────────────────────────────────
  let pgOk = false;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting PostgreSQL connection (attempt ${attempt}/${maxRetries})...`);
      const pgClient = await pgPool.connect();
      console.log('✓ PostgreSQL connected');
      pgClient.release();
      pgOk = true;
      break;
    } catch (error) {
      console.error(`PostgreSQL attempt ${attempt} failed:`, (error as Error).message);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  if (!pgOk) {
    console.error('❌ Failed to connect to PostgreSQL — cannot start server');
    return false;
  }

  // ── MongoDB (optional) ─────────────────────────────────────────────────────
  if (mongoClient) {
    try {
      console.log('Attempting MongoDB connection (3s timeout)...');
      await mongoClient.connect();
      // Ping to verify
      await mongoClient.db('admin').command({ ping: 1 });
      isMongoConnected = true;
      console.log('✓ MongoDB connected');
    } catch (mongoError) {
      console.warn('⚠️  MongoDB unavailable (circuits/experiments degraded):', (mongoError as Error).message);
      isMongoConnected = false;
    }
  } else {
    console.warn('⚠️  MONGODB_URI not set — running without MongoDB');
  }

  // ── Redis (optional) ──────────────────────────────────────────────────────
  if (redisClient) {
    try {
      console.log('Attempting Redis connection (3s timeout)...');
      await redisClient.connect();
      isRedisConnected = true;
      console.log('✓ Redis connected');
    } catch (redisError) {
      console.warn('⚠️  Redis unavailable (caching disabled):', (redisError as Error).message);
      isRedisConnected = false;
    }
  } else {
    console.warn('⚠️  No REDIS_URL or REDIS_HOST set — running without Redis');
  }

  return true;
}

// Graceful shutdown
export async function closeDatabases() {
  try { await pgPool.end(); } catch (_) {}
  if (mongoClient && isMongoConnected) {
    try { await mongoClient.close(); } catch (_) {}
  }
  if (redisClient && redisClient.isOpen) {
    try { await redisClient.quit(); } catch (_) {}
  }
  console.log('All database connections closed');
}
