import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class AntennaMast extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'antenna_mast', 'Antenna Mast / Mounting Stand', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      height: 3,             // m
      material: 'fiberglass',// 'aluminium' | 'fiberglass' | 'steel'
      loadCapacity: 20,      // kg
      windRating: 120,       // km/h
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_antenna_mount`, name: 'Antenna Mount', type: 'bidirectional', position: { x: 40, y: 10 } },
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
    return ['dipole_antenna', 'yagi_antenna', 'horn_antenna', 'monopole_antenna', 'helical_antenna', 'antenna_positioner'];
  }
}
