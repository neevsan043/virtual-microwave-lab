export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  registrationNumber?: string;
  phoneNumber?: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  objectives: string[];
  instructions: string[];
  requiredComponents: string[];
  createdBy?: string;
  createdAt?: Date;
}

export interface ExperimentProgress {
  id: string;
  experimentId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  circuitSaved: boolean;
  simulationRun: boolean;
  score?: number;
}

export interface Circuit {
  id?: string;
  experimentId: string;
  userId: string;
  components: any[];
  connections: any[];
  lastModified: Date;
}

export interface SimulationResult {
  sParameters: {
    frequency: number[];
    s11: number[];
    s21: number[];
    s12: number[];
    s22: number[];
  };
  powerMeasurements: {
    inputPower: number;
    outputPower: number;
    gain: number;
  };
  spectrumData: {
    frequency: number[];
    magnitude: number[];
  };
  success?: boolean;
}

export type ComponentType = 
  // Sources
  | 'signal_generator'
  | 'oscillator'
  | 'noise_source'
  // Passive Components
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'transmission_line'
  // Active Components
  | 'amplifier'
  | 'mixer'
  | 'attenuator'
  | 'phase_shifter'
  // Power Division/Combination
  | 'power_splitter'
  | 'power_combiner'
  | 'directional_coupler'
  | 'hybrid_coupler'
  | 'wilkinson_divider'
  // Filters
  | 'lowpass_filter'
  | 'highpass_filter'
  | 'bandpass_filter'
  | 'bandstop_filter'
  // Waveguides
  | 'rectangular_waveguide'
  | 'circular_waveguide'
  | 'coaxial_line'
  | 'microstrip_line'
  | 'stripline'
  // Waveguide Components
  | 'waveguide_tee'
  | 'waveguide_bend'
  | 'waveguide_twist'
  | 'circulator'
  | 'isolator'
  // Antennas
  | 'dipole_antenna'
  | 'patch_antenna'
  | 'horn_antenna'
  | 'parabolic_antenna'
  | 'yagi_antenna'
  // Measurement Instruments
  | 'power_meter'
  | 'spectrum_analyzer'
  | 'network_analyzer'
  | 'oscilloscope'
  | 'frequency_counter'
  | 'signal_analyzer'
  // Power Supply & Test Equipment
  | 'dc_power_supply'
  | 'multimeter'
  | 'high_power_attenuator'
  // Sources (additional)
  | 'function_generator'
  | 'vector_signal_generator'
  | 'gunn_diode_oscillator'
  | 'klystron_oscillator'
  | 'magnetron'
  | 'vco'
  // Measurement (additional)
  | 'swr_meter'
  | 'field_strength_meter'
  | 'slotted_line'
  | 'noise_figure_analyzer'
  | 'free_space_kit'
  // Antennas (additional)
  | 'monopole_antenna'
  | 'loop_antenna'
  | 'helical_antenna'
  | 'reflector'
  | 'antenna_positioner'
  // Infrastructure / Support
  | 'anechoic_chamber'
  | 'antenna_mast'
  | 'turntable'
  | 'ground_plane'
  // Connectors
  | 'sma_connector'
  | 'n_connector'
  | 'bnc_connector'
  | 'k_connector'
  | 'mm_connector_292'
  | 'mm_connector_185'
  | 'balun'
  // Cables
  | 'semi_rigid_cable'
  | 'flexible_rf_cable'
  // Passive RF
  | 'rf_load'
  | 'waveguide_termination'
  | 'waveguide_coax_adapter'
  | 'cavity_resonator'
  | 'cpw_line'
  | 'microwave_absorber'
  | 'rogers_substrate'
  | 'rt_duroid_substrate'
  | 'fr4_substrate'
  // Semiconductors / Active
  | 'pin_diode'
  | 'schottky_diode'
  | 'varactor_diode'
  | 'hemt'
  | 'frequency_multiplier'
  | 'bias_tee';

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

export interface Connection {
  id: string;
  fromComponent: string;
  fromPort: string;
  toComponent: string;
  toPort: string;
  isValid: boolean;
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

export interface CircuitData {
  components: any[];
  connections: Connection[];
  metadata: {
    created: Date;
    modified: Date;
    version: string;
  };
}
