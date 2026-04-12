import api from './api';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  registrationNumber?: string;
  phoneNumber?: string;
  birthday?: string;
  createdAt: string;
  lastLogin?: string;
}

export const userManagementService = {
  async getAllUsers(): Promise<UserData[]> {
    const response = await api.get('/auth/users/mongodb');
    return response.data.users.map((user: any) => ({
      id: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      registrationNumber: user.registrationNumber,
      phoneNumber: user.phoneNumber,
      birthday: user.birthday,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }));
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },
};
