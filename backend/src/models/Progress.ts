import { mongoClient } from '../config/database.js';
import { ObjectId } from 'mongodb';

const DB_NAME = 'microwave_lab';
const COLLECTION_NAME = 'progress';

export interface ProgressDocument {
  _id?: ObjectId;
  userId: string;
  experimentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  circuitSaved: boolean;
  simulationRun: boolean;
  score?: number;
  attempts: number;
  timeSpent: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export class ProgressModel {
  static getCollection() {
    return mongoClient.db(DB_NAME).collection<ProgressDocument>(COLLECTION_NAME);
  }

  /**
   * Start an experiment (mark as in_progress)
   */
  static async startExperiment(
    userId: string,
    experimentId: string
  ): Promise<ProgressDocument> {
    const collection = this.getCollection();
    
    const now = new Date();
    const existing = await collection.findOne({ userId, experimentId });

    if (existing) {
      // Update existing progress
      const result = await collection.findOneAndUpdate(
        { userId, experimentId },
        {
          $set: {
            status: 'in_progress',
            lastAccessedAt: now,
            updatedAt: now,
          },
          $setOnInsert: {
            startedAt: now,
            circuitSaved: false,
            simulationRun: false,
            attempts: 0,
            timeSpent: 0,
            createdAt: now,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );
      return result!;
    }

    // Create new progress
    const document: Partial<ProgressDocument> = {
      userId,
      experimentId,
      status: 'in_progress',
      startedAt: now,
      lastAccessedAt: now,
      circuitSaved: false,
      simulationRun: false,
      attempts: 0,
      timeSpent: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(document as ProgressDocument);
    return { ...document, _id: result.insertedId } as ProgressDocument;
  }

  /**
   * Update experiment progress
   */
  static async updateProgress(
    userId: string,
    experimentId: string,
    updates: Partial<ProgressDocument>
  ): Promise<ProgressDocument | null> {
    const collection = this.getCollection();
    
    const result = await collection.findOneAndUpdate(
      { userId, experimentId },
      {
        $set: {
          ...updates,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
      }
    );

    return result;
  }

  /**
   * Complete an experiment
   */
  static async completeExperiment(
    userId: string,
    experimentId: string,
    score?: number
  ): Promise<ProgressDocument | null> {
    const collection = this.getCollection();
    
    const now = new Date();
    const result = await collection.findOneAndUpdate(
      { userId, experimentId },
      {
        $set: {
          status: 'completed',
          completedAt: now,
          lastAccessedAt: now,
          updatedAt: now,
          ...(score !== undefined && { score }),
        },
      },
      {
        returnDocument: 'after',
      }
    );

    return result;
  }

  /**
   * Get progress for a specific experiment
   */
  static async getExperimentProgress(
    userId: string,
    experimentId: string
  ): Promise<ProgressDocument | null> {
    const collection = this.getCollection();
    return await collection.findOne({ userId, experimentId });
  }

  /**
   * Get all progress for a user
   */
  static async getUserProgress(userId: string): Promise<ProgressDocument[]> {
    const collection = this.getCollection();
    return await collection
      .find({ userId })
      .sort({ lastAccessedAt: -1 })
      .toArray();
  }

  /**
   * Get progress statistics for a user
   */
  static async getUserStats(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  }> {
    const collection = this.getCollection();
    
    const progress = await collection.find({ userId }).toArray();
    
    return {
      total: progress.length,
      completed: progress.filter(p => p.status === 'completed').length,
      inProgress: progress.filter(p => p.status === 'in_progress').length,
      notStarted: progress.filter(p => p.status === 'not_started').length,
    };
  }

  /**
   * Increment attempt count
   */
  static async incrementAttempts(
    userId: string,
    experimentId: string
  ): Promise<void> {
    const collection = this.getCollection();
    await collection.updateOne(
      { userId, experimentId },
      {
        $inc: { attempts: 1 },
        $set: { updatedAt: new Date() },
      }
    );
  }

  /**
   * Add time spent on experiment
   */
  static async addTimeSpent(
    userId: string,
    experimentId: string,
    seconds: number
  ): Promise<void> {
    const collection = this.getCollection();
    await collection.updateOne(
      { userId, experimentId },
      {
        $inc: { timeSpent: seconds },
        $set: { updatedAt: new Date() },
      }
    );
  }

  /**
   * Create indexes for better performance
   */
  static async createIndexes(): Promise<void> {
    const collection = this.getCollection();
    
    await collection.createIndex({ userId: 1, experimentId: 1 }, { unique: true });
    await collection.createIndex({ userId: 1, lastAccessedAt: -1 });
    await collection.createIndex({ userId: 1, status: 1 });
    await collection.createIndex({ experimentId: 1 });
    
    console.log('✓ Progress indexes created');
  }
}
