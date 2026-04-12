import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class CoaxialLine extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'coaxial_line', 'Coaxial Line', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,       // Ohms
      length: 300,         // mm
      velocityFactor: 0.66,// relative to c (polyethylene dielectric)
      attenuation: 0.3,    // dB/m at 1 GHz
      frequencyMax: 18e9,  // Hz
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const Z0 = this.parameters.impedance as number;
    const length = (this.parameters.length as number) / 1000;
    const vf = this.parameters.velocityFactor as number;
    const alpha = this.parameters.attenuation as number;

    const s11 = frequency.map(() => complex(0.01, 0));
    const s21 = frequency.map((f) => {
      const beta = 2 * Math.PI * f / (3e8 * vf);
      const a = alpha * Math.sqrt(f / 1e9) * length / 1000;
      const lossLinear = Math.pow(10, -a / 20);
      return complex(lossLinear * Math.cos(-beta * length), lossLinear * Math.sin(-beta * length));
    });
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'amplifier', 'attenuator', 'spectrum_analyzer', 'sma_connector', 'n_connector', 'power_meter'];
  }
}
