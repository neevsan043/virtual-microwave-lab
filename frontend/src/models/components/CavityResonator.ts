import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class CavityResonator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'cavity_resonator', 'Cavity Resonator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      resonantFrequency: 10e9, // Hz
      qFactor: 5000,           // unloaded Q
      couplingFactor: 0.8,     // external coupling
      cavityType: 'rectangular',// 'rectangular' | 'cylindrical' | 'coaxial'
      bandwidth3dB: 2e6,        // Hz (-3 dB bandwidth)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'Coupling 1', type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Coupling 2', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const f0 = this.parameters.resonantFrequency as number;
    const Q = this.parameters.qFactor as number;
    const bw = f0 / Q;

    const s11 = frequency.map((f) => {
      const d = (f - f0) / (bw / 2);
      const mag = d * d / (1 + d * d);
      return complex(-mag, 0);
    });
    const s21 = frequency.map((f) => {
      const d = (f - f0) / (bw / 2);
      const mag = 1 / Math.sqrt(1 + d * d);
      return complex(-mag * 0.9, 0);
    });
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'coaxial_line', 'signal_generator', 'spectrum_analyzer', 'network_analyzer'];
  }
}
