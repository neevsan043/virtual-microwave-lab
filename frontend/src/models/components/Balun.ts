import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Balun extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'balun', 'Balun', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      centerFrequency: 144e6,  // Hz
      bandwidth: 20e6,          // Hz
      impedanceUnbalanced: 50,  // Ohms (coax side)
      impedanceBalanced: 200,   // Ohms (dipole/balanced side)
      transformRatio: 4,        // impedance ratio (1:4)
      insertionLoss: 0.5,       // dB
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_p1`,  name: 'Unbalanced (Coax)', type: 'bidirectional',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_p2`,  name: 'Balanced +',        type: 'bidirectional', position: { x: 80, y: 10 } },
      { id: `${this.id}_p3`,  name: 'Balanced −',        type: 'bidirectional', position: { x: 80, y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const il = Math.pow(10, -(this.parameters.insertionLoss as number) / 20);
    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(-il / Math.sqrt(2), 0));
    const s12 = s21;
    const s22 = frequency.map(() => complex(0.05, 0));
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['coaxial_line', 'dipole_antenna', 'loop_antenna', 'yagi_antenna', 'signal_generator'];
  }
}
