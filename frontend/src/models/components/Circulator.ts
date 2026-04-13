import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Circulator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'circulator', 'Circulator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      insertionLoss: 0.5, // dB
      isolation: 20, // dB
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_port1`,
        name: 'Port 1',
        type: 'bidirectional',
        position: { x: 40, y: 0 },
      },
      {
        id: `${this.id}_port2`,
        name: 'Port 2',
        type: 'bidirectional',
        position: { x: 80, y: 25 },
      },
      {
        id: `${this.id}_port3`,
        name: 'Port 3',
        type: 'bidirectional',
        position: { x: 40, y: 50 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const loss = this.parameters.insertionLoss as number;
    const isolation = this.parameters.isolation as number;

    const through_mag = Math.pow(10, -loss / 20);
    const iso_mag = Math.pow(10, -isolation / 20);

    // Circulator: 1→2, 2→3, 3→1
    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(through_mag, 0)); // 1→2
    const s12 = frequency.map(() => complex(iso_mag, 0)); // 2→1 isolated
    const s22 = frequency.map(() => complex(0.05, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'amplifier', 'transmission_line',
      'horn_antenna', 'dipole_antenna', 'patch_antenna', 'parabolic_antenna',
      'isolator', 'power_meter', 'directional_coupler',
    ];
  }
}
