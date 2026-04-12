import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Oscillator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'oscillator', 'Oscillator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 2.4e9, // 2.4 GHz
      power: 0, // 0 dBm
      phaseNoise: -100, // dBc/Hz at 10 kHz offset
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_out`,
        name: 'RF Out',
        type: 'output',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.1, 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'resistor',
      'capacitor',
      'inductor',
      'transmission_line',
      'amplifier',
      'mixer',
      'power_meter',
      'spectrum_analyzer',
    ];
  }
}
