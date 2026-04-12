import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class HighPowerAttenuator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'high_power_attenuator', 'High-Power Attenuator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      attenuation: 30,  // dB (30 dB as in the figure)
      maxPower: 50,     // Watts (50 W rated)
      impedance: 50,    // Ohms (50Ω)
      vswr: 1.3,        // Typical VSWR
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'RF In',
        type: 'input',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_out`,
        name: 'RF Out',
        type: 'output',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const atten = this.parameters.attenuation as number;
    const attenLinear = Math.pow(10, -atten / 20);

    // High power attenuator has slightly higher mismatch than standard
    const s11 = frequency.map(() => complex(0.05, 0.02));
    const s21 = frequency.map(() => complex(attenLinear, 0));
    const s12 = s21;
    const s22 = s11;

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'amplifier',
      'signal_generator',
      'spectrum_analyzer',
      'power_meter',
      'attenuator',
    ];
  }
}
