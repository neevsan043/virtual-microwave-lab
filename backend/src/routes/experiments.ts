import express, { Request, Response } from 'express';
import { ExperimentModel } from '../models/Experiment.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all experiments
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const experiments = await ExperimentModel.findAll();
    res.json({ experiments });
  } catch (error) {
    console.error('Get experiments error:', error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

// Get experiment by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const experiment = await ExperimentModel.findById(id);

    if (!experiment) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    res.json({ experiment });
  } catch (error) {
    console.error('Get experiment error:', error);
    res.status(500).json({ error: 'Failed to fetch experiment' });
  }
});

// Get experiments by difficulty
router.get('/difficulty/:level', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { level } = req.params;
    const experiments = await ExperimentModel.findByDifficulty(level);
    res.json({ experiments });
  } catch (error) {
    console.error('Get experiments by difficulty error:', error);
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

// Create new experiment (instructors only)
router.post('/', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const experimentData = req.body;

    if (!experimentData.title || !experimentData.description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const experiment = await ExperimentModel.create(experimentData);
    res.status(201).json({ experiment, message: 'Experiment created successfully' });
  } catch (error) {
    console.error('Create experiment error:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

// Update experiment (instructors only)
router.put('/:id', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = await ExperimentModel.update(id, updates);

    if (!success) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    res.json({ message: 'Experiment updated successfully' });
  } catch (error) {
    console.error('Update experiment error:', error);
    res.status(500).json({ error: 'Failed to update experiment' });
  }
});

// Delete experiment (instructors only)
router.delete('/:id', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await ExperimentModel.delete(id);

    if (!success) {
      res.status(404).json({ error: 'Experiment not found' });
      return;
    }

    res.json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    console.error('Delete experiment error:', error);
    res.status(500).json({ error: 'Failed to delete experiment' });
  }
});

export default router;
