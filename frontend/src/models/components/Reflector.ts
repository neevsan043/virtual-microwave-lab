import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Reflector extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'reflector', 'Reflector / Diffractor', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      material: 'metal',         // 'metal' | 'dielectric' | 'absorber'
      width: 0.5,                // m
      height: 0.5,               // m
      reflectivity: 0.99,        // (1 = perfect reflector)
      frequency: 10e9,           // Hz
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,   name: 'Incident Wave',   type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`,  name: 'Reflected Wave',  type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const r = this.parameters.reflectivity as number;
    const s11 = frequency.map(() => complex(r, 0));
    const s21 = frequency.map(() => complex(Math.sqrt(1 - r * r), 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['horn_antenna', 'dipole_antenna', 'parabolic_antenna', 'free_space_kit'];
  }
}
