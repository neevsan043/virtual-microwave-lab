import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class FunctionGenerator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'function_generator', 'Function Generator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 1e6,      // Hz
      amplitude: 1.0,      // Vpp
      waveform: 'sine',    // 'sine' | 'square' | 'triangle' | 'sawtooth' | 'pulse'
      dcOffset: 0,         // V
      impedance: 50,       // Ohms
      frequencyMax: 30e6,  // Hz
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_out`,  name: 'Output',   type: 'output', position: { x: 80, y: 15 } },
      { id: `${this.id}_sync`, name: 'Sync Out', type: 'output', position: { x: 80, y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.01, 0));
    const s21 = frequency.map(() => complex(1.0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['attenuator', 'amplifier', 'oscilloscope', 'spectrum_analyzer', 'mixer', 'bandpass_filter'];
  }
}
