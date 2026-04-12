import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Resistor extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'resistor', 'Resistor', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      resistance: 50, // 50 Ohms
      tolerance: 5, // 5%
      powerRating: 0.25, // 0.25 Watts
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'Port 1',
        type: 'bidirectional',
        position: { x: 0, y: 15 },
      },
      {
        id: `${this.id}_out`,
        name: 'Port 2',
        type: 'bidirectional',
        position: { x: 60, y: 15 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const R = this.parameters.resistance as number;
    const Z0 = 50; // System impedance

    // Calculate reflection coefficient
    const gamma = (R - Z0) / (R + Z0);

    // Calculate transmission coefficient
    const tau = (2 * R) / (R + Z0);

    const s11 = frequency.map(() => complex(gamma, 0));
    const s21 = frequency.map(() => complex(tau, 0));
    const s12 = frequency.map(() => complex(tau, 0)); // Reciprocal
    const s22 = frequency.map(() => complex(gamma, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
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
