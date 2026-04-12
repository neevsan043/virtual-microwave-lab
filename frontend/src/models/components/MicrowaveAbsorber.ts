import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class MicrowaveAbsorber extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'microwave_absorber', 'Microwave Absorber Material', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequencyMin: 1e9,         // Hz
      frequencyMax: 40e9,        // Hz
      reflectivityLevel: -40,    // dB at design frequency
      thickness: 25,             // mm
      material: 'pyramidal-foam',// 'pyramidal-foam' | 'flat-foam' | 'carbon-loaded'
      powerHandling: 50,         // W/m²
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`, name: 'Wave In', type: 'input', position: { x: 0, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const rl = this.parameters.reflectivityLevel as number;
    const s11 = frequency.map(() => complex(Math.pow(10, rl / 20), 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['anechoic_chamber', 'horn_antenna', 'reflector', 'free_space_kit'];
  }
}
