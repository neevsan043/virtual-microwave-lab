import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Multimeter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'multimeter', 'Multimeter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      measurementMode: 'current', // 'current' | 'voltage' | 'resistance'
      currentRange: 10,           // Amperes (max range)
      voltageRange: 20,           // Volts (max range)
      internalResistance: 0.1,    // Ohms (current sense shunt)
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_pos`,
        name: '+',
        type: 'input',
        position: { x: 0, y: 15 },
      },
      {
        id: `${this.id}_neg`,
        name: '-',
        type: 'input',
        position: { x: 0, y: 40 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    // Multimeter is a DC measurement device; negligible RF effect
    const s11 = frequency.map(() => complex(-0.05, 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'dc_power_supply',
      'amplifier',
    ];
  }
}
