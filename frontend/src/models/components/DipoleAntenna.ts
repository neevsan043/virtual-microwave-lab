import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class DipoleAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'dipole_antenna', 'Dipole Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      gain: 2.15, // dBi (half-wave dipole)
      length: 0.47, // wavelength fraction
      impedance: 73, // Ohms (resonant)
      vswr: 1.2,
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_feed`,
        name: 'Feed',
        type: 'input',
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
      'amplifier',
    ];
  }
}
