// Backend types for Virtual Microwave Lab

export interface Point {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  name: string;
  type: 'input' | 'output' | 'bidirectional';
  position: Point;
}

export interface ComponentParameters {
  [key: string]: number | string | boolean;
}

export interface SParameters {
  frequency: number[];
  s11: Complex[];
  s21: Complex[];
  s12: Complex[];
  s22: Complex[];
}

export interface Complex {
  real: number;
  imag: number;
}

export type ComponentType = 
  | 'signal_generator'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'transmission_line'
  | 'amplifier'
  | 'mixer'
  | 'oscillator'
  | 'power_meter'
  | 'spectrum_analyzer'
  | 'network_analyzer';

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  position: Point;
  rotation: number;
  parameters: ComponentParameters;
}

export interface Connection {
  id: string;
  fromComponent: string;
  fromPort: string;
  toComponent: string;
  toPort: string;
  isValid: boolean;
}

export interface CircuitData {
  components: ComponentInstance[];
  connections: Connection[];
  metadata: {
    created: Date;
    modified: Date;
    version: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  role: 'student' | 'instructor' | 'admin';
  enrolled_courses?: string[];
  created_at: Date;
  last_login: Date;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  components: ComponentType[];
  referenceCircuit: CircuitData;
  instructions: ExperimentStep[];
}

export interface ExperimentStep {
  stepNumber: number;
  title: string;
  description: string;
  hint?: string;
}

export interface StudentProgress {
  studentId: string;
  experimentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  circuitState: CircuitData;
  attempts: number;
  timeSpent: number;
  score: number;
  completedAt?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}
