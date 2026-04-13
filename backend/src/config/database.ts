import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import dotenv from 'dotenv';

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

// MongoDB client
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
}
export const mongoClient = new MongoClient(mongoUri || '');

// Redis client (Optional)
export const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

// Initialize database connections with retry logic
export async function initializeDatabases() {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to databases (attempt ${attempt}/${maxRetries})...`);

      // Test PostgreSQL connection
      const pgClient = await pgPool.connect();
      console.log('✓ PostgreSQL connected');
      pgClient.release();

      // Connect to MongoDB
      console.log('Attempting MongoDB connection...');
      await mongoClient.connect();
      console.log('✓ MongoDB connected');

      // Connect to Redis (Optional)
      console.log('Attempting Redis connection...');
      try {
        await redisClient.connect();
        console.log('✓ Redis connected');
      } catch (redisError) {
        console.warn('⚠️ Redis connection failed (Optional). Continuing without Redis.');
      }

      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('All database connection attempts failed');
        return false;
      }
    }
  }
  
  return false;
}

// Graceful shutdown
export async function closeDatabases() {
  await pgPool.end();
  await mongoClient.close();
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  console.log('All database connections closed');
}
