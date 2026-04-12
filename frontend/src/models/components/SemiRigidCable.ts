import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class SemiRigidCable extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'semi_rigid_cable', 'Semi-Rigid Coaxial Cable', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,         // Ohms
      length: 150,           // mm
      outerDiameter: 3.58,   // mm (0.141" cable)
      frequencyMax: 40e9,    // Hz
      attenuation: 0.7,      // dB/m at 10 GHz
      velocityFactor: 0.72,
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

    const s11 = frequency.map(() => complex(0.01, 0));
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
    return ['sma_connector', 'k_connector', 'mm_connector_292', 'amplifier', 'attenuator', 'mixer'];
  }
}
