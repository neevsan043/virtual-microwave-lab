import api from './api';
import { ExperimentProgress } from '../types';

export const progressService = {
  /**
   * Get all progress records for the current user
   */
  async getUserProgress(): Promise<ExperimentProgress[]> {
    try {
      const response = await api.get('/progress');
      return response.data.progress || [];
    } catch (error: any) {
      console.error('Failed to fetch user progress from API, using localStorage:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('experiment_progress') || '{}';
      const allProgress = JSON.parse(stored);
      return Object.values(allProgress) as ExperimentProgress[];
    }
  },

  /**
   * Get progress for a specific experiment
   */
  async getExperimentProgress(experimentId: string): Promise<ExperimentProgress | null> {
    try {
      const response = await api.get(`/progress/${experimentId}`);
      return response.data.progress;
    } catch (error: any) {
      console.error('Failed to fetch experiment progress from API, using localStorage:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('experiment_progress') || '{}';
      const allProgress = JSON.parse(stored);
      return allProgress[experimentId] || null;
    }
  },

  /**
   * Start an experiment (mark as in_progress)
   */
  async startExperiment(experimentId: string): Promise<ExperimentProgress> {
    try {
      const response = await api.post('/progress/start', { experimentId });
      return response.data.progress;
    } catch (error: any) {
      // Fallback: create local progress record
      const progress: ExperimentProgress = {
        id: `progress_${Date.now()}`,
        experimentId,
        userId: 'current_user',
        status: 'in_progress',
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        circuitSaved: false,
        simulationRun: false,
      };
      
      // Store in localStorage as fallback
      const stored = localStorage.getItem('experiment_progress') || '{}';
      const allProgress = JSON.parse(stored);
      allProgress[experimentId] = progress;
      localStorage.setItem('experiment_progress', JSON.stringify(allProgress));
      
      return progress;
    }
  },

  /**
   * Update experiment progress
   */
  async updateProgress(
    experimentId: string,
    updates: Partial<ExperimentProgress>
  ): Promise<ExperimentProgress> {
    try {
      const response = await api.put(`/progress/${experimentId}`, updates);
      return response.data.progress;
    } catch (error: any) {
      // Fallback: update local progress record
      const stored = localStorage.getItem('experiment_progress') || '{}';
      const allProgress = JSON.parse(stored);
      
      if (allProgress[experimentId]) {
        allProgress[experimentId] = {
          ...allProgress[experimentId],
          ...updates,
          lastAccessedAt: new Date(),
        };
        localStorage.setItem('experiment_progress', JSON.stringify(allProgress));
        return allProgress[experimentId];
      }
      
      throw error;
    }
  },

  /**
   * Mark experiment as completed
   */
  async completeExperiment(experimentId: string, score?: number): Promise<ExperimentProgress> {
    try {
      const response = await api.post(`/progress/${experimentId}/complete`, { score });
      return response.data.progress;
    } catch (error: any) {
      // Fallback: update local progress record
      const stored = localStorage.getItem('experiment_progress') || '{}';
      const allProgress = JSON.parse(stored);
      
      if (allProgress[experimentId]) {
        allProgress[experimentId] = {
          ...allProgress[experimentId],
          status: 'completed',
          completedAt: new Date(),
          lastAccessedAt: new Date(),
          score,
        };
        localStorage.setItem('experiment_progress', JSON.stringify(allProgress));
        return allProgress[experimentId];
      }
      
      throw error;
    }
  },

  /**
   * Get progress statistics
   */
  async getProgressStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  }> {
    try {
      const response = await api.get('/progress/stats');
      return response.data.stats;
    } catch (error: any) {
      // Fallback: calculate from localStorage
      const stored = localStorage.getItem('experiment_progress') || '{}';
      const allProgress = JSON.parse(stored);
      const progressArray = Object.values(allProgress) as ExperimentProgress[];
      
      return {
        total: progressArray.length,
        completed: progressArray.filter(p => p.status === 'completed').length,
        inProgress: progressArray.filter(p => p.status === 'in_progress').length,
        notStarted: 0,
      };
    }
  },

  /**
   * Get local progress from localStorage (fallback)
   */
  getLocalProgress(): Record<string, ExperimentProgress> {
    const stored = localStorage.getItem('experiment_progress') || '{}';
    return JSON.parse(stored);
  },
};
