import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class WaveguideTermination extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'waveguide_termination', 'Waveguide Termination / Matched Load', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 10e9,    // Hz (design frequency)
      vswr: 1.05,         // excellent match
      maxPower: 5,        // Watts average
      material: 'carbon-loaded ceramic',
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`, name: 'WG Port', type: 'input', position: { x: 0, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.02, 0)); // excellent match
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'circular_waveguide', 'waveguide_tee', 'circulator', 'directional_coupler'];
  }
}
