import express, { Request, Response } from 'express';
import { CircuitModel } from '../models/Circuit.js';
import { ProgressModel } from '../models/Progress.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Save circuit (MongoDB)
router.post('/save', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId, circuitData } = req.body;
    const userId = req.user?.userId;

    if (!userId || !experimentId || !circuitData) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Save to MongoDB
    const savedCircuit = await CircuitModel.saveCircuit(userId, experimentId, circuitData);

    // Update progress to mark circuit as saved
    await ProgressModel.updateProgress(userId, experimentId, {
      circuitSaved: true,
      lastAccessedAt: new Date(),
    });

    res.json({ 
      success: true, 
      message: 'Circuit saved successfully',
      circuitId: savedCircuit._id,
    });
  } catch (error) {
    console.error('Save circuit error:', error);
    res.status(500).json({ error: 'Failed to save circuit' });
  }
});

// Load circuit (MongoDB)
router.get('/load/:experimentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const circuit = await CircuitModel.loadCircuit(userId, experimentId);

    if (!circuit) {
      res.status(404).json({ error: 'No saved circuit found' });
      return;
    }

    // Update last accessed time
    await ProgressModel.updateProgress(userId, experimentId, {
      lastAccessedAt: new Date(),
    });

    res.json({
      circuitData: circuit.circuitData,
      lastSaved: circuit.updatedAt,
    });
  } catch (error) {
    console.error('Load circuit error:', error);
    res.status(500).json({ error: 'Failed to load circuit' });
  }
});

// Auto-save circuit (MongoDB, no error response on failure)
router.post('/autosave', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId, circuitData } = req.body;
    const userId = req.user?.userId;

    if (!userId || !experimentId || !circuitData) {
      res.status(200).json({ success: false });
      return;
    }

    await CircuitModel.saveCircuit(userId, experimentId, circuitData);

    res.json({ success: true });
  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(200).json({ success: false });
  }
});

// Get all user circuits
router.get('/user/all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const circuits = await CircuitModel.getUserCircuits(userId);

    res.json({ circuits });
  } catch (error) {
    console.error('Get user circuits error:', error);
    res.status(500).json({ error: 'Failed to get circuits' });
  }
});

// Get circuit statistics
router.get('/user/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const stats = await CircuitModel.getUserStats(userId);

    res.json({ stats });
  } catch (error) {
    console.error('Get circuit stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Delete circuit save (MongoDB)
router.delete('/delete/:experimentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const deleted = await CircuitModel.deleteCircuit(userId, experimentId);

    if (!deleted) {
      res.status(404).json({ error: 'Circuit not found' });
      return;
    }

    res.json({ success: true, message: 'Circuit deleted successfully' });
  } catch (error) {
    console.error('Delete circuit error:', error);
    res.status(500).json({ error: 'Failed to delete circuit' });
  }
});

export default router;
