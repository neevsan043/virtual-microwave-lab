import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class HelicalAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'helical_antenna', 'Helical Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 2.4e9,   // Hz
      numTurns: 10,
      helixDiameter: 0.04,// m
      helixPitch: 0.03,   // m
      gain: 14,           // dBi (axial mode)
      mode: 'axial',      // 'axial' | 'normal'
      impedance: 140,     // Ohms (axial mode typical)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_feed`, name: 'Feed', type: 'bidirectional', position: { x: 40, y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const fc = this.parameters.frequency as number;
    const s11 = frequency.map((f) => {
      const df = Math.abs(f - fc) / (fc * 0.15);
      return complex(-0.8 / (1 + df * df), 0);
    });
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'coaxial_line', 'sma_connector', 'spectrum_analyzer', 'power_meter'];
  }
}
