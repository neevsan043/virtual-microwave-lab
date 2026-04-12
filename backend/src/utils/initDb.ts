import { pgPool } from '../config/database.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inline schema as fallback in case the SQL file is not found
const INLINE_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    registration_number VARCHAR(100),
    phone_number VARCHAR(20),
    birthday DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_courses (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experiment_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    current_step INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS circuit_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experiment_id VARCHAR(255) NOT NULL,
    circuit_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_experiment_id ON student_progress(experiment_id);
CREATE INDEX IF NOT EXISTS idx_circuit_saves_user_id ON circuit_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_circuit_saves_experiment_id ON circuit_saves(experiment_id);
`;

export async function initializeSchema(): Promise<boolean> {
  try {
    let schema: string;

    // Try reading from file first
    try {
      const schemaPath = join(__dirname, '../config/schema.sql');
      schema = readFileSync(schemaPath, 'utf-8');
      console.log('✓ Loaded schema from file');
    } catch {
      // Fall back to inline schema
      console.log('ℹ Schema file not found, using inline schema');
      schema = INLINE_SCHEMA;
    }

    await pgPool.query(schema);
    console.log('✓ Database schema initialized');
    return true;
  } catch (error) {
    console.error('Error initializing schema:', error);
    return false;
  }
}
