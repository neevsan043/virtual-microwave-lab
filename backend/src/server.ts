import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabases, closeDatabases, isMongoConnected, isRedisConnected } from './config/database.js';
import { initializeSchema } from './utils/initDb.js';
import { ExperimentModel } from './models/Experiment.js';
import { CircuitModel } from './models/Circuit.js';
import { ProgressModel } from './models/Progress.js';
import { UserMongoModel } from './models/UserMongo.js';
import authRoutes from './routes/auth.js';
import circuitRoutes from './routes/circuits.js';
import experimentRoutes from './routes/experiments.js';
import progressRoutes from './routes/progress.js';
import instructorRoutes from './routes/instructor.js';
import aiAnalysisRoutes from './routes/aiAnalysis.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Allow both the production Vercel URL and local development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/circuits', circuitRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/ai', aiAnalysisRoutes);

// Health check endpoint — always responds regardless of optional DB status
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Virtual Microwave Lab API is running',
    databases: {
      postgresql: 'connected',
      mongodb: isMongoConnected ? 'connected' : 'unavailable',
      redis: isRedisConnected ? 'connected' : 'unavailable',
    },
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize databases and start server
async function startServer() {
  try {
    console.log('🚀 Starting Virtual Microwave Lab API...\n');
    
    // Initialize database connections
    const dbConnected = await initializeDatabases();
    if (!dbConnected) {
      console.error('❌ Failed to connect to databases');
      process.exit(1);
    }

    // Initialize database schema
    await initializeSchema();

    // Create MongoDB indexes and seed experiments only if MongoDB is available
    if (isMongoConnected) {
      await UserMongoModel.createIndexes();
      await CircuitModel.createIndexes();
      await ProgressModel.createIndexes();
      await ExperimentModel.seedDefaultExperiments();
    } else {
      console.warn('⚠️  MongoDB unavailable — skipping index creation and experiment seeding');
    }

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`\n✅ Server running in ${process.env.NODE_ENV} mode`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Frontend: ${process.env.FRONTEND_URL}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await closeDatabases();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await closeDatabases();
  process.exit(0);
});

startServer();
