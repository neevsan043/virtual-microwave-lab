import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

async function testMongo() {
  console.log('Testing MongoDB...');
  try {
    const mongoClient = new MongoClient('mongodb+srv://agrawaalneev746_db_user:xivg7Evr1MPIGTgF@cluster0.km2nrcz.mongodb.net/?appName=Cluster0');
    await mongoClient.connect();
    console.log('MongoDB SUCCESS');
    await mongoClient.close();
  } catch (e) {
    console.error('MongoDB ERROR:', e.message);
  }
}

async function testRedis() {
  console.log('Testing Redis...');
  try {
    const redisClient = createClient({ url: 'rediss://default:gQAAAAAAAVQoAAIncDFiYjI2OWVkNWQ0NDI0YmJjODIyYjU1MjJmYjMyZWU1NnAxODcwODA@smooth-buzzard-87080.upstash.io:6379' });
    
    redisClient.on('error', err => console.error('Redis Event Error:', err.message));
    
    await redisClient.connect();
    console.log('Redis SUCCESS');
    await redisClient.quit();
  } catch (e) {
    console.error('Redis ERROR:', e.message);
  }
}

async function run() {
  await testMongo();
  await testRedis();
  process.exit(0);
}

run();
