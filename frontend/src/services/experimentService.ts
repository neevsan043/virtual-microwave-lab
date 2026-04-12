import api from './api';
import { Experiment } from '../types';

export const experimentService = {
  async getAllExperiments(): Promise<Experiment[]> {
    try {
      const response = await api.get('/experiments');
      return response.data.experiments;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch experiments');
    }
  },

  async getExperimentById(id: string): Promise<Experiment> {
    try {
      const response = await api.get(`/experiments/${id}`);
      return response.data.experiment;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch experiment');
    }
  },

  async getExperimentsByDifficulty(difficulty: string): Promise<Experiment[]> {
    try {
      const response = await api.get(`/experiments/difficulty/${difficulty}`);
      return response.data.experiments;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch experiments');
    }
  },

  async createExperiment(experiment: Omit<Experiment, 'id'>): Promise<Experiment> {
    try {
      const response = await api.post('/experiments', experiment);
      return response.data.experiment;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create experiment');
    }
  },

  async updateExperiment(id: string, updates: Partial<Experiment>): Promise<void> {
    try {
      await api.put(`/experiments/${id}`, updates);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update experiment');
    }
  },

  async deleteExperiment(id: string): Promise<void> {
    try {
      await api.delete(`/experiments/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete experiment');
    }
  },
};
