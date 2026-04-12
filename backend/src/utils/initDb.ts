import { pgPool } from '../config/database.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initializeSchema(): Promise<boolean> {
  try {
    const schemaPath = join(__dirname, '../config/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    await pgPool.query(schema);
    console.log('✓ Database schema initialized');
    return true;
  } catch (error) {
    console.error('Error initializing schema:', error);
    return false;
  }
}
