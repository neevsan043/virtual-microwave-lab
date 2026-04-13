import { api, API_BASE_URL } from './api';

export interface AISpatialComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
}

export interface AISpatialConnection {
  from: string;
  to: string;
}

export interface AIAnalysisResult {
  success: boolean;
  detectedComponents: any[];   // raw parts from AI
  matchedComponents: AISpatialComponent[]; // mapped spatial instances
  unmatchedComponents: string[];  // detected but not in library
  matchedNames: string[];         // human-readable matched names
  connections: AISpatialConnection[]; // graph edges
}

export const aiService = {
  async analyzeCircuitImage(imageFile: File): Promise<AIAnalysisResult> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post<AIAnalysisResult>(
      '/ai/analyze-circuit',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let the browser set Content-Type with the correct boundary
        },
        timeout: 90_000, // 90 s — image uploads + Gemini processing can be slow
        validateStatus: (status) => status < 500, // let 429 reach catch block as error
      }
    );

    // Surface 429 as a proper error so the countdown UI triggers
    if (response.status === 429) {
      const err: any = new Error('quota');
      err.response = response;
      throw err;
    }

    return response.data;
  },
};
