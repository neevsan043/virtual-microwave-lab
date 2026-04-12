import express, { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import { UserMongoModel } from '../models/UserMongo.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, password, role, registrationNumber, phoneNumber } = req.body;

    // Validate input
    if (!email || !name || !password) {
      res.status(400).json({ error: 'Email, name, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Create user
    const user = await UserModel.create(email, name, password, role || 'student', registrationNumber, phoneNumber);
    if (!user) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        registrationNumber: user.registration_number,
        phoneNumber: user.phone_number
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Verify credentials
    const user = await UserModel.verifyPassword(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const enrolledCourses = await UserModel.getEnrolledCourses(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        registrationNumber: user.registration_number,
        phoneNumber: user.phone_number,
        birthday: user.birthday,
        enrolledCourses,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, phoneNumber, registrationNumber, birthday } = req.body;

    const updatedUser = await UserModel.updateProfile(req.user.userId, {
      name,
      phoneNumber,
      registrationNumber,
      birthday
    });

    if (!updatedUser) {
      res.status(500).json({ error: 'Failed to update profile' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        registrationNumber: updatedUser.registration_number,
        phoneNumber: updatedUser.phone_number,
        birthday: updatedUser.birthday
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Password reset request (simplified version)
router.post('/reset-password-request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      res.json({ message: 'If the email exists, a reset link will be sent' });
      return;
    }

    // TODO: Implement email sending with reset token
    // For now, just return success
    res.json({ message: 'Password reset instructions sent to email' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long' });
      return;
    }

    // Change password
    const result = await UserModel.changePassword(req.user.userId, currentPassword, newPassword);

    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to change password' });
      return;
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users from MongoDB (for viewing synced data)
router.get('/users/mongodb', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Only allow admins or instructors to view all users
    const currentUser = await UserModel.findById(req.user.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'instructor')) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const users = await UserMongoModel.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Get MongoDB users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin/instructor only)
router.delete('/users/:userId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Only allow admins or instructors to delete users
    const currentUser = await UserModel.findById(req.user.userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'instructor')) {
      res.status(403).json({ error: 'Access denied. Only admins and instructors can delete users.' });
      return;
    }

    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user.userId) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }

    // Delete the user
    const result = await UserModel.deleteUser(userId);

    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to delete user' });
      return;
    }

    res.json({ 
      message: 'User deleted successfully',
      userId 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
