import express, { Request, Response } from 'express';
import { CircuitModel } from '../models/Circuit.js';
import { ProgressModel } from '../models/Progress.js';
import { UserModel } from '../models/User.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all students
router.get('/students', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await UserModel.findByRole('student');
    
    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Get all circuits (instructor view)
router.get('/circuits/all', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, experimentId } = req.query;
    
    // Build filter
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (experimentId) filter.experimentId = experimentId;
    
    const circuits = await CircuitModel.getCollection()
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();
    
    res.json({ circuits });
  } catch (error) {
    console.error('Get all circuits error:', error);
    res.status(500).json({ error: 'Failed to get circuits' });
  }
});

// Get all progress (instructor view)
router.get('/progress/all', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, experimentId, status } = req.query;
    
    // Build filter
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (experimentId) filter.experimentId = experimentId;
    if (status) filter.status = status;
    
    const progress = await ProgressModel.getCollection()
      .find(filter)
      .sort({ lastAccessedAt: -1 })
      .toArray();
    
    res.json({ progress });
  } catch (error) {
    console.error('Get all progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Get student details with progress
router.get('/students/:userId', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    
    const progress = await ProgressModel.getUserProgress(userId);
    const circuits = await CircuitModel.getUserCircuits(userId);
    const stats = await ProgressModel.getUserStats(userId);
    
    res.json({
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
      progress,
      circuits: circuits.length,
      stats,
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Failed to get student details' });
  }
});

// Get class statistics
router.get('/stats/class', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await UserModel.findByRole('student');
    
    let totalCompleted = 0;
    let totalInProgress = 0;
    let totalTimeSpent = 0;
    let totalAttempts = 0;
    
    for (const student of students) {
      const stats = await ProgressModel.getUserStats(student.id);
      totalCompleted += stats.completed;
      totalInProgress += stats.inProgress;
      
      const progress = await ProgressModel.getUserProgress(student.id);
      progress.forEach(p => {
        totalTimeSpent += p.timeSpent || 0;
        totalAttempts += p.attempts || 0;
      });
    }
    
    res.json({
      totalStudents: students.length,
      totalCompleted,
      totalInProgress,
      totalTimeSpent,
      totalAttempts,
      averageTimePerStudent: students.length > 0 ? totalTimeSpent / students.length : 0,
      averageAttemptsPerStudent: students.length > 0 ? totalAttempts / students.length : 0,
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({ error: 'Failed to get class statistics' });
  }
});

// Get experiment statistics
router.get('/stats/experiment/:experimentId', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { experimentId } = req.params;
    
    const allProgress = await ProgressModel.getCollection()
      .find({ experimentId })
      .toArray();
    
    const completed = allProgress.filter(p => p.status === 'completed').length;
    const inProgress = allProgress.filter(p => p.status === 'in_progress').length;
    const notStarted = allProgress.filter(p => p.status === 'not_started').length;
    
    const totalTime = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const totalAttempts = allProgress.reduce((sum, p) => sum + (p.attempts || 0), 0);
    const scores = allProgress.filter(p => p.score !== undefined).map(p => p.score!);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    res.json({
      experimentId,
      totalStudents: allProgress.length,
      completed,
      inProgress,
      notStarted,
      completionRate: allProgress.length > 0 ? (completed / allProgress.length) * 100 : 0,
      averageTime: allProgress.length > 0 ? totalTime / allProgress.length : 0,
      averageAttempts: allProgress.length > 0 ? totalAttempts / allProgress.length : 0,
      averageScore,
    });
  } catch (error) {
    console.error('Get experiment stats error:', error);
    res.status(500).json({ error: 'Failed to get experiment statistics' });
  }
});

// Grade a student's experiment
router.post('/grade', authenticateToken, authorizeRoles('instructor', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, experimentId, score, feedback } = req.body;
    
    if (!userId || !experimentId || score === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const progress = await ProgressModel.updateProgress(userId, experimentId, {
      score,
      status: 'completed',
      completedAt: new Date(),
    });
    
    if (!progress) {
      res.status(404).json({ error: 'Progress not found' });
      return;
    }
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Grade experiment error:', error);
    res.status(500).json({ error: 'Failed to grade experiment' });
  }
});

export default router;
