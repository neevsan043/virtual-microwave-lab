import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class HornAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'horn_antenna', 'Horn Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      gain: 15, // dBi
      beamwidth: 30, // degrees
      frequency: 10e9, // 10 GHz (X-band)
      vswr: 1.5, // VSWR
      impedance: 50, // Ohms
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
    const gamma = (vswr - 1) / (vswr + 1); // Reflection coefficient

    const s11 = frequency.map(() => complex(gamma, 0));
    const s21 = frequency.map(() => complex(0, 0)); // Antenna radiates
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'rectangular_waveguide',
      'transmission_line',
      'amplifier',
    ];
  }
}
