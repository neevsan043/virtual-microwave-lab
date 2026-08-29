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

// Load .env for local development only — do NOT override env vars already set
// by the hosting platform (Render, Vercel, etc.)
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

// Track server readiness
let serverReady = false;

// Health check endpoint — always responds regardless of optional DB status
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Virtual Microwave Lab API is running',
    ready: serverReady,
    databases: {
      postgresql: serverReady ? 'connected' : 'initializing',
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

    // ── Start HTTP server immediately so health checks respond right away ──
    httpServer.listen(PORT, () => {
      console.log(`\n✅ HTTP server listening on port ${PORT}`);
      console.log(`   Mode: ${process.env.NODE_ENV}`);
      console.log(`   Frontend: ${process.env.FRONTEND_URL}\n`);
    });

    // ── Initialize database connections (runs after server is already listening) ──
    const dbConnected = await initializeDatabases();
    if (!dbConnected) {
      console.error('❌ Failed to connect to PostgreSQL — API will not function correctly');
      // Do NOT exit — let the server keep running so health checks still respond
      return;
    }

    // Initialize PostgreSQL schema
    await initializeSchema();

    // MongoDB-dependent setup (only if connected)
    if (isMongoConnected) {
      await UserMongoModel.createIndexes();
      await CircuitModel.createIndexes();
      await ProgressModel.createIndexes();
      await ExperimentModel.seedDefaultExperiments();
    } else {
      console.warn('⚠️  MongoDB unavailable — skipping index creation and experiment seeding');
    }

    serverReady = true;
    console.log('\n🎉 Server fully initialized and ready!');
  } catch (error) {
    console.error('Startup error (non-fatal):', error);
    // Server stays up even if post-start init fails
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
