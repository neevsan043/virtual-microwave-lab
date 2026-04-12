import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class FieldStrengthMeter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'field_strength_meter', 'Field Strength Meter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequencyRange: 3e9,      // Hz max
      sensitivity: -60,         // dBm minimum detectable
      dynamicRange: 80,         // dB
      antennaFactor: 20,        // dB/m
      units: 'dBuV/m',          // measurement units
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_antenna_in`, name: 'Antenna', type: 'input', position: { x: 0, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.1, 0.05));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['dipole_antenna', 'monopole_antenna', 'loop_antenna', 'horn_antenna', 'yagi_antenna'];
  }
}
