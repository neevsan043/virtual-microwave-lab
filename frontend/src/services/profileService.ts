import api from './api';

export interface ProfileUpdateData {
  name?: string;
  phoneNumber?: string;
  registrationNumber?: string;
  birthday?: string;
}

export const profileService = {
  async updateProfile(data: ProfileUpdateData): Promise<{ message: string; user: any }> {
    const response = await api.put('/auth/profile', data);
    
    // Update localStorage with new user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...currentUser,
      ...response.data.user,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return response.data;
  },

  async getCurrentProfile(): Promise<any> {
    const response = await api.get('/auth/me');
    
    // Update localStorage with fresh user data
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data.user;
  },
};
