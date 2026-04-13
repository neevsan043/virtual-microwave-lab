import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class PowerCombiner extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'power_combiner', 'Power Combiner', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      insertionLoss: 0.5, // dB
      isolation: 20, // dB between input ports
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_p1`,
        name: 'Port 1',
        type: 'bidirectional',
        position: { x: 0, y: 15 },
      },
      {
        id: `${this.id}_p2`,
        name: 'Port 2',
        type: 'bidirectional',
        position: { x: 0, y: 35 },
      },
      {
        id: `${this.id}_p3`,
        name: 'Port 3',
        type: 'bidirectional',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const loss = this.parameters.insertionLoss as number;
    const combine_mag = Math.pow(10, -loss / 20) / Math.sqrt(2); // 3dB + loss

    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(combine_mag, 0));
    const s12 = frequency.map(() => complex(combine_mag, 0));
    const s22 = frequency.map(() => complex(0.05, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'amplifier',
      'transmission_line',
      'power_meter',
      'spectrum_analyzer',
    ];
  }
}
