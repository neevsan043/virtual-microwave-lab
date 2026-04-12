import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Magnetron extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'magnetron', 'Magnetron', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 2.45e9,     // Hz (ISM band / microwave oven)
      outputPower: 600,      // W (peak)
      anodeVoltage: 4000,    // V
      anodeCurrent: 300,     // mA
      magneticField: 0.17,   // T
      efficiency: 0.7,       // conversion efficiency
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_rf_out`,   name: 'RF Out',  type: 'output', position: { x: 80, y: 25 } },
      { id: `${this.id}_anode`,    name: 'Anode V', type: 'input',  position: { x: 0,  y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.5, 0));
    const s21 = frequency.map(() => complex(1.0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'high_power_attenuator', 'waveguide_coax_adapter', 'isolator'];
  }
}
