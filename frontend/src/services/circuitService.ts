import api from './api';
import { CircuitData } from '../types';

export const circuitService = {
  async saveCircuit(experimentId: string, circuitData: CircuitData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/circuits/save', {
        experimentId,
        circuitData,
      });
      
      // Also save to localStorage as backup
      this.saveToLocalStorage(experimentId, circuitData);
      
      return response.data;
    } catch (error: any) {
      // Fallback to localStorage
      this.saveToLocalStorage(experimentId, circuitData);
      return { success: true, message: 'Circuit saved locally' };
    }
  },

  async loadCircuit(experimentId: string): Promise<CircuitData | null> {
    console.log('🔍 Loading circuit for experiment:', experimentId);
    try {
      const response = await api.get(`/circuits/load/${experimentId}`);
      console.log('✅ Circuit loaded from API:', response.data);
      return response.data.circuitData;
    } catch (error: any) {
      console.log('⚠️ API failed, trying localStorage:', error.message);
      // Fallback to localStorage
      return this.loadFromLocalStorage(experimentId);
    }
  },

  async autoSaveCircuit(experimentId: string, circuitData: CircuitData): Promise<void> {
    try {
      await api.post('/circuits/autosave', {
        experimentId,
        circuitData,
      });
      
      // Also save to localStorage
      this.saveToLocalStorage(experimentId, circuitData);
    } catch (error) {
      console.error('Auto-save API failed, saving to localStorage');
      // Fallback to localStorage
      this.saveToLocalStorage(experimentId, circuitData);
    }
  },

  saveToLocalStorage(experimentId: string, circuitData: CircuitData): void {
    try {
      const key = `circuit_${experimentId}`;
      localStorage.setItem(key, JSON.stringify(circuitData));
      console.log(`Circuit saved to localStorage: ${key}`);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  loadFromLocalStorage(experimentId: string): CircuitData | null {
    try {
      const key = `circuit_${experimentId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const circuitData = JSON.parse(data);
        console.log(`✅ Circuit loaded from localStorage: ${key}`, {
          components: circuitData.components?.length || 0,
          connections: circuitData.connections?.length || 0
        });
        return circuitData;
      }
      console.log(`ℹ️ No circuit found in localStorage for key: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
      return null;
    }
  },

  async exportCircuit(circuitData: CircuitData): Promise<Blob> {
    const json = JSON.stringify(circuitData, null, 2);
    return new Blob([json], { type: 'application/json' });
  },

  async importCircuit(file: File): Promise<CircuitData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const circuitData = JSON.parse(e.target?.result as string);
          resolve(circuitData);
        } catch (error) {
          reject(new Error('Invalid circuit file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
};
