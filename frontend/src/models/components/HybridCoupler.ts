import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class HybridCoupler extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'hybrid_coupler', 'Hybrid Coupler', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      couplingFactor: 3,      // dB (3 dB = equal split)
      centerFrequency: 2.4e9, // Hz
      bandwidth: 500e6,       // Hz
      impedance: 50,          // Ohms
      phaseShift: 90,         // degrees (90° or 180°)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_input`,    name: 'Input',    type: 'input',         position: { x: 0,  y: 15 } },
      { id: `${this.id}_through`,  name: 'Through',  type: 'output',        position: { x: 80, y: 15 } },
      { id: `${this.id}_coupled`,  name: 'Coupled',  type: 'output',        position: { x: 40, y: 50 } },
      { id: `${this.id}_isolated`, name: 'Isolated', type: 'bidirectional', position: { x: 0,  y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const j = Math.sqrt(-1) || 0;
    const s = 1 / Math.sqrt(2);
    const s11 = frequency.map(() => complex(0, 0));
    const s21 = frequency.map(() => complex(0, -s));  // through with -90° phase
    const s12 = s21;
    const s22 = frequency.map(() => complex(0, 0));
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'amplifier', 'power_splitter', 'directional_coupler', 'attenuator'];
  }
}
