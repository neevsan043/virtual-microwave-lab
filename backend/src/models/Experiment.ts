import { mongoClient, isMongoConnected } from '../config/database.js';
import { ObjectId } from 'mongodb';
import { Experiment } from '../types/index.js';

function getCollection() {
  if (!mongoClient || !isMongoConnected) throw new Error('MongoDB is not connected');
  return mongoClient.db('microwave_lab').collection('experiments');
}

// Fallback experiments shown when MongoDB is unavailable
const FALLBACK_EXPERIMENTS: Experiment[] = [
  {
    id: 'default-1',
    title: 'Introduction to Transmission Lines',
    description: 'Learn the basics of microwave transmission lines and impedance matching',
    objectives: [
      'Understand transmission line theory',
      'Measure S-parameters',
      'Calculate VSWR and return loss',
    ],
    difficulty: 'beginner',
    estimatedTime: 30,
    components: ['signal_generator', 'transmission_line', 'power_meter'],
    referenceCircuit: {
      components: [],
      connections: [],
      metadata: { created: new Date(), modified: new Date(), version: '1.0' },
    },
    instructions: [
      { stepNumber: 1, title: 'Add Signal Generator', description: 'Drag a signal generator from the component library to the canvas', hint: 'Look for the 📡 icon in the Sources category' },
      { stepNumber: 2, title: 'Add Transmission Line', description: 'Add a 50Ω transmission line to the circuit', hint: 'Transmission lines are in the Passive category' },
      { stepNumber: 3, title: 'Add Power Meter', description: 'Connect a power meter to measure the output', hint: 'Power meters are in the Measurement category' },
      { stepNumber: 4, title: 'Connect Components', description: 'Click on component ports to create connections', hint: 'Use the Connect button in the toolbar' },
      { stepNumber: 5, title: 'Run Simulation', description: 'Click the Simulate button to analyze your circuit' },
    ],
  },
  {
    id: 'default-2',
    title: 'Amplifier Characterization',
    description: 'Measure gain, noise figure, and stability of an RF amplifier',
    objectives: [
      'Measure amplifier gain',
      'Analyze frequency response',
      'Check input/output matching',
    ],
    difficulty: 'intermediate',
    estimatedTime: 45,
    components: ['signal_generator', 'amplifier', 'spectrum_analyzer', 'network_analyzer'],
    referenceCircuit: {
      components: [],
      connections: [],
      metadata: { created: new Date(), modified: new Date(), version: '1.0' },
    },
    instructions: [
      { stepNumber: 1, title: 'Build Amplifier Test Setup', description: 'Create a circuit with signal generator, amplifier, and measurement instruments' },
      { stepNumber: 2, title: 'Measure S-Parameters', description: 'Use the network analyzer to measure S11 and S21' },
      { stepNumber: 3, title: 'Analyze Gain', description: 'Calculate the amplifier gain from S21 measurements' },
    ],
  },
  {
    id: 'default-3',
    title: 'Impedance Matching Network Design',
    description: 'Design and test an impedance matching network using transmission lines',
    objectives: [
      'Design matching network',
      'Minimize return loss',
      'Achieve VSWR < 2:1',
    ],
    difficulty: 'advanced',
    estimatedTime: 60,
    components: ['signal_generator', 'transmission_line', 'resistor', 'network_analyzer'],
    referenceCircuit: {
      components: [],
      connections: [],
      metadata: { created: new Date(), modified: new Date(), version: '1.0' },
    },
    instructions: [
      { stepNumber: 1, title: 'Analyze Load Impedance', description: 'Measure the load impedance using the network analyzer' },
      { stepNumber: 2, title: 'Design Matching Network', description: 'Calculate required transmission line lengths and impedances' },
      { stepNumber: 3, title: 'Implement and Test', description: 'Build the matching network and verify VSWR' },
    ],
  },
];

export class ExperimentModel {
  static async create(experiment: Omit<Experiment, 'id'>): Promise<Experiment> {
    const result = await getCollection().insertOne({
      ...experiment,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: result.insertedId.toString(),
      ...experiment,
    };
  }

  static async findById(id: string): Promise<Experiment | null> {
    // Check fallback first if MongoDB is unavailable
    if (!isMongoConnected) {
      return FALLBACK_EXPERIMENTS.find(e => e.id === id) ?? null;
    }
    const experiment = await getCollection().findOne({ _id: new ObjectId(id) });
    if (!experiment) return null;

    return {
      id: experiment._id.toString(),
      title: experiment.title,
      description: experiment.description,
      objectives: experiment.objectives,
      difficulty: experiment.difficulty,
      estimatedTime: experiment.estimatedTime,
      components: experiment.components,
      referenceCircuit: experiment.referenceCircuit,
      instructions: experiment.instructions,
    };
  }

  static async findAll(): Promise<Experiment[]> {
    // Fall back to hardcoded experiments if MongoDB is unavailable
    if (!isMongoConnected) {
      console.warn('⚠️  MongoDB unavailable — returning fallback experiments');
      return FALLBACK_EXPERIMENTS;
    }
    const experiments = await getCollection().find({}).toArray();
    
    return experiments.map(exp => ({
      id: exp._id.toString(),
      title: exp.title,
      description: exp.description,
      objectives: exp.objectives,
      difficulty: exp.difficulty,
      estimatedTime: exp.estimatedTime,
      components: exp.components,
      referenceCircuit: exp.referenceCircuit,
      instructions: exp.instructions,
    }));
  }

  static async findByDifficulty(difficulty: string): Promise<Experiment[]> {
    const experiments = await getCollection().find({ difficulty }).toArray();
    
    return experiments.map(exp => ({
      id: exp._id.toString(),
      title: exp.title,
      description: exp.description,
      objectives: exp.objectives,
      difficulty: exp.difficulty,
      estimatedTime: exp.estimatedTime,
      components: exp.components,
      referenceCircuit: exp.referenceCircuit,
      instructions: exp.instructions,
    }));
  }

  static async update(id: string, updates: Partial<Experiment>): Promise<boolean> {
    const result = await getCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await getCollection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async seedDefaultExperiments(): Promise<void> {
    const col = getCollection();
    const count = await col.countDocuments();
    if (count > 0) return; // Already seeded

    const defaultExperiments = [
      {
        title: 'Introduction to Transmission Lines',
        description: 'Learn the basics of microwave transmission lines and impedance matching',
        objectives: [
          'Understand transmission line theory',
          'Measure S-parameters',
          'Calculate VSWR and return loss',
        ],
        difficulty: 'beginner',
        estimatedTime: 30,
        components: ['signal_generator', 'transmission_line', 'power_meter'],
        referenceCircuit: {
          components: [],
          connections: [],
          metadata: { created: new Date(), modified: new Date(), version: '1.0' },
        },
        instructions: [
          {
            stepNumber: 1,
            title: 'Add Signal Generator',
            description: 'Drag a signal generator from the component library to the canvas',
            hint: 'Look for the 📡 icon in the Sources category',
          },
          {
            stepNumber: 2,
            title: 'Add Transmission Line',
            description: 'Add a 50Ω transmission line to the circuit',
            hint: 'Transmission lines are in the Passive category',
          },
          {
            stepNumber: 3,
            title: 'Add Power Meter',
            description: 'Connect a power meter to measure the output',
            hint: 'Power meters are in the Measurement category',
          },
          {
            stepNumber: 4,
            title: 'Connect Components',
            description: 'Click on component ports to create connections',
            hint: 'Use the Connect button in the toolbar',
          },
          {
            stepNumber: 5,
            title: 'Run Simulation',
            description: 'Click the Simulate button to analyze your circuit',
          },
        ],
      },
      {
        title: 'Amplifier Characterization',
        description: 'Measure gain, noise figure, and stability of an RF amplifier',
        objectives: [
          'Measure amplifier gain',
          'Analyze frequency response',
          'Check input/output matching',
        ],
        difficulty: 'intermediate',
        estimatedTime: 45,
        components: ['signal_generator', 'amplifier', 'spectrum_analyzer', 'network_analyzer'],
        referenceCircuit: {
          components: [],
          connections: [],
          metadata: { created: new Date(), modified: new Date(), version: '1.0' },
        },
        instructions: [
          {
            stepNumber: 1,
            title: 'Build Amplifier Test Setup',
            description: 'Create a circuit with signal generator, amplifier, and measurement instruments',
          },
          {
            stepNumber: 2,
            title: 'Measure S-Parameters',
            description: 'Use the network analyzer to measure S11 and S21',
          },
          {
            stepNumber: 3,
            title: 'Analyze Gain',
            description: 'Calculate the amplifier gain from S21 measurements',
          },
        ],
      },
      {
        title: 'Impedance Matching Network Design',
        description: 'Design and test an impedance matching network using transmission lines',
        objectives: [
          'Design matching network',
          'Minimize return loss',
          'Achieve VSWR < 2:1',
        ],
        difficulty: 'advanced',
        estimatedTime: 60,
        components: ['signal_generator', 'transmission_line', 'resistor', 'network_analyzer'],
        referenceCircuit: {
          components: [],
          connections: [],
          metadata: { created: new Date(), modified: new Date(), version: '1.0' },
        },
        instructions: [
          {
            stepNumber: 1,
            title: 'Analyze Load Impedance',
            description: 'Measure the load impedance using the network analyzer',
          },
          {
            stepNumber: 2,
            title: 'Design Matching Network',
            description: 'Calculate required transmission line lengths and impedances',
          },
          {
            stepNumber: 3,
            title: 'Implement and Test',
            description: 'Build the matching network and verify VSWR',
          },
        ],
      },
    ];

    await col.insertMany(defaultExperiments);
    console.log('✓ Default experiments seeded');
  }
}
