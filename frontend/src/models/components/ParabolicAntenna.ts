import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class ParabolicAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'parabolic_antenna', 'Parabolic Dish Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      diameter: 1.2,         // m
      frequency: 10e9,       // Hz
      gain: 40,              // dBi (approximate)
      efficiency: 0.6,       // aperture efficiency
      sidelobeLevel: -20,    // dB
      beamwidth: 2.0,        // degrees (3 dB)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_feed`, name: 'Feed', type: 'bidirectional', position: { x: 40, y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.15, 0.05));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'power_meter', 'spectrum_analyzer', 'network_analyzer', 'waveguide_coax_adapter'];
  }
}
