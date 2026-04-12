import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/** Structural component — models the positioner mechanism, no RF ports */
export class AntennaPositioner extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'antenna_positioner', 'Antenna Positioner / Rotator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      azimuthRange: 360,   // degrees
      elevationRange: 90,  // degrees
      azimuthSpeed: 5,     // deg/s
      elevationSpeed: 3,   // deg/s
      positionAccuracy: 0.1, // degrees
      loadCapacity: 5,     // kg
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_antenna_mount`, name: 'Antenna', type: 'bidirectional', position: { x: 40, y: 10 } },
      { id: `${this.id}_ctrl`,          name: 'Control', type: 'input',         position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0, 0));
    const s21 = frequency.map(() => complex(1, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['horn_antenna', 'dipole_antenna', 'yagi_antenna', 'patch_antenna', 'parabolic_antenna', 'helical_antenna'];
  }
}
