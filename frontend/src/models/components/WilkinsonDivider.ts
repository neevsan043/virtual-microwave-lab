import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class WilkinsonDivider extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'wilkinson_divider', 'Wilkinson Divider', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      centerFrequency: 2.4e9, // Hz
      impedance: 50,          // Ohms
      isolationResistor: 100, // Ohms (2*Z0)
      insertionLoss: 3.01,    // dB (ideal equal split)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,   name: 'In',   type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out1`, name: 'Out 1', type: 'output', position: { x: 80, y: 10 } },
      { id: `${this.id}_out2`, name: 'Out 2', type: 'output', position: { x: 80, y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s = 1 / Math.sqrt(2);
    const s11 = frequency.map(() => complex(0, 0));
    const s21 = frequency.map(() => complex(-s, 0)); // -3 dB equal split
    const s12 = s21;
    const s22 = frequency.map(() => complex(0, 0));
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'amplifier', 'attenuator', 'power_splitter', 'bandpass_filter'];
  }
}
