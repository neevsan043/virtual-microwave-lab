import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class FlexibleRfCable extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'flexible_rf_cable', 'Low-Loss Flexible RF Cable', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,         // Ohms
      length: 1000,          // mm (1 m)
      frequencyMax: 26.5e9,  // Hz (LMR-195 equivalent)
      attenuation: 1.5,      // dB/m at 10 GHz
      velocityFactor: 0.83,
      minBendRadius: 20,     // mm
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const alpha = this.parameters.attenuation as number;
    const length = (this.parameters.length as number) / 1000;
    const vf = this.parameters.velocityFactor as number;

    const s11 = frequency.map(() => complex(0.02, 0));
    const s21 = frequency.map((f) => {
      const a = alpha * Math.sqrt(f / 10e9) * length;
      const lossLinear = Math.pow(10, -a / 20);
      const beta = 2 * Math.PI * f / (3e8 * vf);
      return complex(lossLinear * Math.cos(-beta * length), lossLinear * Math.sin(-beta * length));
    });
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['sma_connector', 'n_connector', 'bnc_connector', 'attenuator', 'amplifier', 'signal_generator', 'spectrum_analyzer'];
  }
}
