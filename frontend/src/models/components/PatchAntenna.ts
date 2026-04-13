import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class PatchAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'patch_antenna', 'Patch Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      gain: 6, // dBi
      frequency: 2.4e9, // 2.4 GHz
      bandwidth: 100e6, // 100 MHz
      impedance: 50, // Ohms
      vswr: 1.5,
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_feed`,
        name: 'Feed',
        type: 'bidirectional',
        position: { x: 0, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const vswr = this.parameters.vswr as number;
    const gamma = (vswr - 1) / (vswr + 1);

    const s11 = frequency.map(() => complex(gamma, 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'transmission_line',
      'microstrip_line',
      'amplifier',
    ];
  }
}
