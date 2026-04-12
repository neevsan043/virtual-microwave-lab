import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class NoiseSource extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'noise_source', 'Noise Source', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      enr: 15, // Excess Noise Ratio in dB
      impedance: 50, // 50 Ohms
      enabled: true,
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_out`,
        name: 'Noise Out',
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
      'transmission_line',
      'amplifier',
      'mixer',
      'spectrum_analyzer',
    ];
  }
}
