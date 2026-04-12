import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Microstrip extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'microstrip_line', 'Microstrip Line', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      length: 0.01, // meters (10 mm)
      width: 0.001, // meters (1 mm)
      impedance: 50, // Ohms
      effectivePermittivity: 2.5, // Typical for FR4
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'In',
        type: 'input',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_out`,
        name: 'Out',
        type: 'output',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const length = this.parameters.length as number;
    const eff_er = this.parameters.effectivePermittivity as number;
    const c = 3e8; // Speed of light

    const s11: any[] = [];
    const s21: any[] = [];

    frequency.forEach(f => {
      const beta = 2 * Math.PI * f * Math.sqrt(eff_er) / c;
      const phase = -beta * length;
      const atten = 0.1 * length * Math.sqrt(f / 1e9); // Frequency-dependent loss
      const mag = Math.exp(-atten);
      
      s11.push(complex(0.05, 0));
      s21.push(complex(mag * Math.cos(phase), mag * Math.sin(phase)));
    });

    const s12 = s21;
    const s22 = s11;

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'patch_antenna',
      'amplifier',
      'power_meter',
    ];
  }
}
