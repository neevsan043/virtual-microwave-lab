import { mongoClient } from '../config/database.js';
import { ObjectId } from 'mongodb';

export interface MongoUser {
  _id?: ObjectId;
  userId: string; // PostgreSQL user ID
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  registrationNumber?: string;
  phoneNumber?: string;
  birthday?: string;
  createdAt: Date;
  lastLogin?: Date;
  updatedAt: Date;
}

export class UserMongoModel {
  private static get collection() {
    return mongoClient.db().collection<MongoUser>('users');
  }

  // Create or update user in MongoDB (sync from PostgreSQL)
  static async syncUser(userData: {
    userId: string;
    email: string;
    name: string;
    role: 'student' | 'instructor' | 'admin';
    registrationNumber?: string;
    phoneNumber?: string;
    birthday?: string;
    createdAt?: Date;
    lastLogin?: Date;
  }): Promise<boolean> {
    try {
      const now = new Date();
      
      const mongoUser: Partial<MongoUser> = {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        registrationNumber: userData.registrationNumber || undefined,
        phoneNumber: userData.phoneNumber || undefined,
        birthday: userData.birthday || undefined,
        lastLogin: userData.lastLogin || undefined,
        updatedAt: now,
      };

      // Upsert: update if exists, insert if not
      await this.collection.updateOne(
        { userId: userData.userId },
        { 
          $set: mongoUser,
          $setOnInsert: { createdAt: userData.createdAt || now }
        },
        { upsert: true }
      );

      console.log(`✓ User synced to MongoDB: ${userData.email}`);
      return true;
    } catch (error) {
      console.error('Error syncing user to MongoDB:', error);
      return false;
    }
  }

  // Get user from MongoDB
  static async findByUserId(userId: string): Promise<MongoUser | null> {
    try {
      const user = await this.collection.findOne({ userId });
      return user;
    } catch (error) {
      console.error('Error finding user in MongoDB:', error);
      return null;
    }
  }

  // Get user by email
  static async findByEmail(email: string): Promise<MongoUser | null> {
    try {
      const user = await this.collection.findOne({ email });
      return user;
    } catch (error) {
      console.error('Error finding user by email in MongoDB:', error);
      return null;
    }
  }

  // Get all users from MongoDB
  static async getAllUsers(): Promise<MongoUser[]> {
    try {
      const users = await this.collection.find({}).sort({ createdAt: -1 }).toArray();
      return users;
    } catch (error) {
      console.error('Error getting all users from MongoDB:', error);
      return [];
    }
  }

  // Get users by role
  static async findByRole(role: 'student' | 'instructor' | 'admin'): Promise<MongoUser[]> {
    try {
      const users = await this.collection.find({ role }).sort({ name: 1 }).toArray();
      return users;
    } catch (error) {
      console.error('Error finding users by role in MongoDB:', error);
      return [];
    }
  }

  // Delete user from MongoDB
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting user from MongoDB:', error);
      return false;
    }
  }

  // Create indexes for better performance
  static async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ userId: 1 }, { unique: true });
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ role: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      console.log('✓ User indexes created in MongoDB');
    } catch (error) {
      console.error('Error creating user indexes in MongoDB:', error);
    }
  }

  // Sync all users from PostgreSQL to MongoDB
  static async syncAllUsers(pgUsers: any[]): Promise<void> {
    try {
      for (const user of pgUsers) {
        await this.syncUser({
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
      console.log(`✓ Synced ${pgUsers.length} users to MongoDB`);
    } catch (error) {
      console.error('Error syncing all users to MongoDB:', error);
    }
  }
}
