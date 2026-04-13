import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Isolator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'isolator', 'Isolator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      insertionLoss: 0.5, // dB (forward)
      isolation: 20, // dB (reverse)
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'Input',
        type: 'input',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_out`,
        name: 'Output',
        type: 'output',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const loss = this.parameters.insertionLoss as number;
    const isolation = this.parameters.isolation as number;

    const forward_mag = Math.pow(10, -loss / 20);
    const reverse_mag = Math.pow(10, -isolation / 20);

    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(forward_mag, 0)); // Forward
    const s12 = frequency.map(() => complex(reverse_mag, 0)); // Reverse (isolated)
    const s22 = frequency.map(() => complex(0.05, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'amplifier', 'transmission_line',
      'circulator', 'power_meter', 'directional_coupler',
      'horn_antenna', 'dipole_antenna', 'patch_antenna',
    ];
  }
}
