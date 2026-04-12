import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class RfLoad extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'rf_load', 'RF Load (50Ω Termination)', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,       // Ohms
      maxPower: 2,         // Watts
      frequencyMax: 18e9,  // Hz
      vswr: 1.1,           // max VSWR up to rated frequency
      returnLoss: 26,      // dB
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`, name: 'In', type: 'input', position: { x: 0, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const rl = this.parameters.returnLoss as number;
    const s11 = frequency.map(() => complex(-Math.pow(10, -rl / 20), 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'amplifier', 'attenuator', 'power_splitter', 'directional_coupler', 'coaxial_line'];
  }
}
