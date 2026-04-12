import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class CircularWaveguide extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'circular_waveguide', 'Circular Waveguide', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      radius: 23.0,       // mm (WC-50 standard)
      length: 100,        // mm
      cutoffFrequency: 3.69e9, // Hz (TE11 mode)
      conductivity: 5.8e7,    // S/m (copper)
      attenuation: 0.05,      // dB/m
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'Port 1', type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Port 2', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const fc = this.parameters.cutoffFrequency as number;
    const length = (this.parameters.length as number) / 1000;
    const alpha = this.parameters.attenuation as number;

    const s11 = frequency.map((f) => f < fc ? complex(-0.9, 0) : complex(0.02, 0));
    const s21 = frequency.map((f) => {
      if (f < fc) return complex(0, 0);
      const beta = 2 * Math.PI * f / 3e8 * Math.sqrt(1 - (fc / f) ** 2);
      const lossLinear = Math.pow(10, -alpha * length / 20000);
      return complex(lossLinear * Math.cos(-beta * length), lossLinear * Math.sin(-beta * length));
    });
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'waveguide_coax_adapter', 'circulator', 'isolator', 'waveguide_tee'];
  }
}
