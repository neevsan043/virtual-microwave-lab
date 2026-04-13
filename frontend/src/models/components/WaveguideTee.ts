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
      { id: `${this.id}_port1`,    name: 'Port 1 (Branch)', type: 'bidirectional', position: { x: 40, y: 0 } },
      { id: `${this.id}_port2`,    name: 'Port 2 (Collinear)', type: 'bidirectional', position: { x: 0,  y: 25 } },
      { id: `${this.id}_port3`,    name: 'Port 3 (Collinear)', type: 'bidirectional', position: { x: 80, y: 25 } },
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
