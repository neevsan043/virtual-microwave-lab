import express, { Request, Response } from 'express';
import { ProgressModel, ProgressDocument } from '../models/Progress.js';
import { authenticateToken } from '../middleware/auth.js';
import { isMongoConnected } from '../config/database.js';

const router = express.Router();

// Get progress statistics — MUST be before /:experimentId to avoid route conflict
router.get('/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const stats = await ProgressModel.getUserStats(userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get progress stats error:', error);
    res.json({ stats: { total: 0, completed: 0, inProgress: 0, notStarted: 0 } });
  }
});

// Get all progress for current user
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const progress = await ProgressModel.getUserProgress(userId);
    res.json({ progress });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.json({ progress: [] }); // return empty instead of 500
  }
});

// Get progress for specific experiment
router.get('/:experimentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return; }
    if (!isMongoConnected) { res.status(404).json({ error: 'No progress found' }); return; }
    const progress = await ProgressModel.getExperimentProgress(userId, experimentId);
    if (!progress) { res.status(404).json({ error: 'No progress found for this experiment' }); return; }
    res.json({ progress });
  } catch (error) {
    console.error('Get experiment progress error:', error);
    res.status(404).json({ error: 'No progress found' });
  }
});

// Start an experiment
router.post('/start', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.body;
    const userId = req.user?.userId;

    if (!userId || !experimentId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const progress = await ProgressModel.startExperiment(userId, experimentId);

    res.json({ progress });
  } catch (error) {
    console.error('Start experiment error:', error);
    res.status(500).json({ error: 'Failed to start experiment' });
  }
});

// Update progress
router.put('/:experimentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    const userId = req.user?.userId;
    const updates = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    console.log('📝 Updating progress for', experimentId, 'with:', updates);

    const progress = await ProgressModel.updateProgress(userId, experimentId, updates);

    if (!progress) {
      res.status(404).json({ error: 'Progress not found' });
      return;
    }

    console.log('✅ Progress updated:', progress.status);

    res.json({ progress });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Complete an experiment
router.post('/:experimentId/complete', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    const { score } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const progress = await ProgressModel.completeExperiment(userId, experimentId, score);

    if (!progress) {
      res.status(404).json({ error: 'Progress not found' });
      return;
    }

    res.json({ progress });
  } catch (error) {
    console.error('Complete experiment error:', error);
    res.status(500).json({ error: 'Failed to complete experiment' });
  }
});




// Increment attempt count
router.post('/:experimentId/attempt', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await ProgressModel.incrementAttempts(userId, experimentId);

    res.json({ success: true });
  } catch (error) {
    console.error('Increment attempts error:', error);
    res.status(500).json({ error: 'Failed to increment attempts' });
  }
});

// Add time spent
router.post('/:experimentId/time', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    const { seconds } = req.body;
    const userId = req.user?.userId;

    if (!userId || seconds === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await ProgressModel.addTimeSpent(userId, experimentId, seconds);

    res.json({ success: true });
  } catch (error) {
    console.error('Add time spent error:', error);
    res.status(500).json({ error: 'Failed to add time' });
  }
});

export default router;
