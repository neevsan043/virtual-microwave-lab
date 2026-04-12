import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class WaveguideTwist extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'waveguide_twist', 'Waveguide Twist', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      twistAngle: 90,   // degrees (polarisation rotation)
      length: 50,       // mm
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.01, 0));
    const s21 = frequency.map(() => complex(0.999, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'circular_waveguide', 'waveguide_bend', 'horn_antenna'];
  }
}
