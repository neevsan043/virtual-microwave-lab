import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class SignalGenerator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'signal_generator', 'Signal Generator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 2.4e9, // 2.4 GHz
      power: 0, // 0 dBm
      impedance: 50, // 50 Ohms
      enabled: true,
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_out`,
        name: 'RF Out',
        type: 'output',
        position: { x: 60, y: 30 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    // Signal generator has simple S-parameters
    // S11 represents output match, S21 is not applicable for source
    const s11 = frequency.map(() => complex(0.1, 0)); // Good output match
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
