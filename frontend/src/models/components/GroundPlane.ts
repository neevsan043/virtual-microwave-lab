import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class GroundPlane extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'ground_plane', 'Ground Plane Board', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      width: 300,           // mm
      height: 300,          // mm
      material: 'copper',   // 'copper' | 'aluminium' | 'pcb'
      thickness: 1.5,       // mm
      conductivity: 5.8e7,  // S/m
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_antenna_port`, name: 'Antenna', type: 'bidirectional', position: { x: 40, y: 25 } },
      { id: `${this.id}_gnd`,          name: 'GND',     type: 'bidirectional', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.05, 0));
    const s21 = frequency.map(() => complex(0.997, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['monopole_antenna', 'dipole_antenna', 'patch_antenna', 'coaxial_line'];
  }
}
