import { mongoClient } from '../config/database.js';
import { ObjectId } from 'mongodb';

const DB_NAME = 'microwave_lab';
const COLLECTION_NAME = 'circuits';

export interface CircuitDocument {
  _id?: ObjectId;
  userId: string;
  experimentId: string;
  circuitData: {
    components: any[];
    connections: any[];
    metadata: {
      created: Date;
      modified: Date;
      version: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class CircuitModel {
  static getCollection() {
    return mongoClient.db(DB_NAME).collection<CircuitDocument>(COLLECTION_NAME);
  }

  /**
   * Save or update a circuit for a user
   */
  static async saveCircuit(
    userId: string,
    experimentId: string,
    circuitData: CircuitDocument['circuitData']
  ): Promise<CircuitDocument> {
    const collection = this.getCollection();
    
    const now = new Date();
    const document: Partial<CircuitDocument> = {
      userId,
      experimentId,
      circuitData: {
        ...circuitData,
        metadata: {
          ...circuitData.metadata,
          modified: now,
        },
      },
      updatedAt: now,
    };

    // Upsert: update if exists, insert if not
    const result = await collection.findOneAndUpdate(
      { userId, experimentId },
      {
        $set: document,
        $setOnInsert: { createdAt: now },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    return result!;
  }

  /**
   * Load a circuit for a user
   */
  static async loadCircuit(
    userId: string,
    experimentId: string
  ): Promise<CircuitDocument | null> {
    const collection = this.getCollection();
    return await collection.findOne({ userId, experimentId });
  }

  /**
   * Get all circuits for a user
   */
  static async getUserCircuits(userId: string): Promise<CircuitDocument[]> {
    const collection = this.getCollection();
    return await collection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  /**
   * Delete a circuit
   */
  static async deleteCircuit(
    userId: string,
    experimentId: string
  ): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ userId, experimentId });
    return result.deletedCount > 0;
  }

  /**
   * Get circuit statistics for a user
   */
  static async getUserStats(userId: string): Promise<{
    totalCircuits: number;
    lastModified: Date | null;
  }> {
    const collection = this.getCollection();
    
    const circuits = await collection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray();

    const totalCircuits = await collection.countDocuments({ userId });

    return {
      totalCircuits,
      lastModified: circuits.length > 0 ? circuits[0].updatedAt : null,
    };
  }

  /**
   * Create indexes for better performance
   */
  static async createIndexes(): Promise<void> {
    const collection = this.getCollection();
    
    await collection.createIndex({ userId: 1, experimentId: 1 }, { unique: true });
    await collection.createIndex({ userId: 1, updatedAt: -1 });
    await collection.createIndex({ experimentId: 1 });
    
    console.log('✓ Circuit indexes created');
  }
}
