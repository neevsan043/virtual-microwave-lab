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
        connectionTimeoutMillis: 2000,
      }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'microwave_lab',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// MongoDB client
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/microwave_lab';
export const mongoClient = new MongoClient(mongoUri);

// Redis client
export const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
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
      await mongoClient.connect();
      console.log('✓ MongoDB connected');

      // Connect to Redis
      await redisClient.connect();
      console.log('✓ Redis connected');

      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      
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
  await redisClient.quit();
  console.log('All database connections closed');
}
