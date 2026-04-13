import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Capacitor extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'capacitor', 'Capacitor', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      capacitance: 1e-12, // 1 pF
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_p1`,
        name: 'Port 1',
        type: 'bidirectional',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_p2`,
        name: 'Port 2',
        type: 'bidirectional',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const C = this.parameters.capacitance as number;
    const Z0 = this.parameters.impedance as number;

    const s11 = frequency.map(f => {
      const omega = 2 * Math.PI * f;
      const Xc = -1 / (omega * C);
      const gamma = (Xc - Z0) / (Xc + Z0);
      return complex(gamma, 0);
    });

    const s21 = frequency.map(f => {
      const omega = 2 * Math.PI * f;
      const Xc = -1 / (omega * C);
      const t = (2 * Xc) / (Xc + Z0);
      return complex(t, 0);
    });

    const s12 = s21;
    const s22 = s11;

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
