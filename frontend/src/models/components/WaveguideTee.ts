import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class WaveguideTee extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'waveguide_tee', 'Waveguide Tee', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      junctionType: 'E-plane', // 'E-plane' or 'H-plane'
      frequency: 10e9,          // Hz
      impedance: 50,            // Ohms (normalized)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_main_in`,  name: 'Main In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out1`,     name: 'Out 1',    type: 'output', position: { x: 80, y: 10 } },
      { id: `${this.id}_out2`,     name: 'Out 2',    type: 'output', position: { x: 80, y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s = 1 / Math.sqrt(2);
    const s11 = frequency.map(() => complex(0.01, 0));
    const s21 = frequency.map(() => complex(-s, 0));
    const s12 = s21;
    const s22 = frequency.map(() => complex(0.01, 0));
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'circular_waveguide', 'waveguide_coax_adapter', 'circulator'];
  }
}
