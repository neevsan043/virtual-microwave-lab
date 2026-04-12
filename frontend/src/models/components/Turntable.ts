import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Turntable extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'turntable', 'Turntable', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      azimuthRange: 360,    // degrees
      speed: 1,             // RPM
      loadCapacity: 50,     // kg
      positionAccuracy: 0.1, // degrees
      material: 'RF-transparent', // non-metallic for antenna ranges
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_dut_mount`,    name: 'DUT Mount',    type: 'bidirectional', position: { x: 40, y: 10 } },
      { id: `${this.id}_ctrl`,         name: 'Controller',   type: 'input',         position: { x: 0,  y: 40 } },
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
    return ['antenna_positioner', 'anechoic_chamber', 'field_strength_meter', 'horn_antenna'];
  }
}
