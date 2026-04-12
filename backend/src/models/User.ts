import { pgPool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { User } from '../types/index.js';
import { UserMongoModel } from './UserMongo.js';

export class UserModel {
  static async create(email: string, name: string, password: string, role: 'student' | 'instructor' | 'admin' = 'student', registrationNumber?: string, phoneNumber?: string): Promise<User | null> {
    try {
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pgPool.query(
        `INSERT INTO users (email, name, password_hash, role, registration_number, phone_number) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, email, name, role, registration_number, phone_number, created_at, last_login`,
        [email, name, passwordHash, role, registrationNumber || null, phoneNumber || null]
      );

      const user = result.rows[0];

      // Sync to MongoDB (without password)
      if (user) {
        await UserMongoModel.syncUser({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          registrationNumber: user.registration_number,
          phoneNumber: user.phone_number,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        });
      }

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await pgPool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const result = await pgPool.query(
        'SELECT id, email, name, role, registration_number, phone_number, birthday, created_at, last_login FROM users WHERE id = $1',
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  static async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const result = await pgPool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return null;

      // Update last login
      await pgPool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Sync last login to MongoDB
      await UserMongoModel.syncUser({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        registrationNumber: user.registration_number,
        phoneNumber: user.phone_number,
        birthday: user.birthday,
        createdAt: user.created_at,
        lastLogin: new Date(),
      });

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error verifying password:', error);
      return null;
    }
  }

  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await pgPool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async enrollInCourse(userId: string, courseId: string): Promise<boolean> {
    try {
      await pgPool.query(
        'INSERT INTO user_courses (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, courseId]
      );
      return true;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return false;
    }
  }

  static async getEnrolledCourses(userId: string): Promise<string[]> {
    try {
      const result = await pgPool.query(
        'SELECT course_id FROM user_courses WHERE user_id = $1',
        [userId]
      );
      return result.rows.map(row => row.course_id);
    } catch (error) {
      console.error('Error getting enrolled courses:', error);
      return [];
    }
  }

  static async findByRole(role: 'student' | 'instructor' | 'admin'): Promise<User[]> {
    try {
      const result = await pgPool.query(
        'SELECT id, email, name, role, created_at, last_login FROM users WHERE role = $1 ORDER BY name',
        [role]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding users by role:', error);
      return [];
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const result = await pgPool.query(
        'SELECT id, email, name, role, registration_number, phone_number, birthday, created_at, last_login FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  static async updateProfile(userId: string, updates: { name?: string; phoneNumber?: string; registrationNumber?: string; birthday?: string }): Promise<User | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.phoneNumber !== undefined) {
        fields.push(`phone_number = $${paramCount++}`);
        values.push(updates.phoneNumber);
      }
      if (updates.registrationNumber !== undefined) {
        fields.push(`registration_number = $${paramCount++}`);
        values.push(updates.registrationNumber);
      }
      if (updates.birthday !== undefined) {
        fields.push(`birthday = $${paramCount++}`);
        values.push(updates.birthday);
      }

      if (fields.length === 0) {
        return await UserModel.findById(userId);
      }

      values.push(userId);
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, name, role, registration_number, phone_number, birthday, created_at, last_login
      `;

      const result = await pgPool.query(query, values);
      const user = result.rows[0];

      // Sync to MongoDB
      if (user) {
        await UserMongoModel.syncUser({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          registrationNumber: user.registration_number,
          phoneNumber: user.phone_number,
          birthday: user.birthday,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        });
      }

      return user || null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user with password hash
      const result = await pgPool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      const user = result.rows[0];
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pgPool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Delete from PostgreSQL (cascade will handle related records)
      await pgPool.query('DELETE FROM users WHERE id = $1', [userId]);
      console.log(`✓ User deleted from PostgreSQL: ${user.email}`);

      // Delete from MongoDB
      await UserMongoModel.deleteUser(userId);
      console.log(`✓ User deleted from MongoDB: ${user.email}`);

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  }
}
