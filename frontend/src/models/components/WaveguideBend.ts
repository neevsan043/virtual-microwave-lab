import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class WaveguideBend extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'waveguide_bend', 'Waveguide Bend', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      bendType: 'E-plane',  // 'E-plane' or 'H-plane'
      bendAngle: 90,        // degrees
      bendRadius: 30,       // mm
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.02, 0));
    const s21 = frequency.map(() => complex(0.998, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'circular_waveguide', 'waveguide_tee', 'waveguide_coax_adapter'];
  }
}
