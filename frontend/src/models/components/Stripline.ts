import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Stripline extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'stripline', 'Stripline', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,         // Ohms
      length: 30,            // mm
      substrateHeight: 1.6,  // mm (total height between ground planes)
      dielectricConstant: 4.5, // FR4 typical
      lossTangent: 0.02,
      attenuation: 0.15,     // dB/cm at 10 GHz
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const er = this.parameters.dielectricConstant as number;
    const length = (this.parameters.length as number) / 1000;
    const alpha = this.parameters.attenuation as number;

    const s11 = frequency.map(() => complex(0.03, 0));
    const s21 = frequency.map((f) => {
      const beta = 2 * Math.PI * f * Math.sqrt(er) / 3e8;
      const a = alpha * (f / 10e9) * length * 100;
      const lossLinear = Math.pow(10, -a / 20);
      return complex(lossLinear * Math.cos(-beta * length), lossLinear * Math.sin(-beta * length));
    });
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['microstrip_line', 'bandpass_filter', 'directional_coupler', 'power_splitter'];
  }
}
