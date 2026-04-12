import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class YagiAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'yagi_antenna', 'Yagi-Uda Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 144e6,   // Hz (2m band)
      numElements: 5,     // total elements (1 driven + reflector + directors)
      gain: 9,            // dBd
      beamwidth: 60,      // degrees
      impedance: 50,      // Ohms (with matching)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_feed`, name: 'Feed', type: 'bidirectional', position: { x: 40, y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.2, 0.1));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'power_meter', 'spectrum_analyzer', 'coaxial_line', 'balun'];
  }
}
