import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class MonopoleAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'monopole_antenna', 'Monopole / Whip Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 900e6,    // Hz (λ/4 at 900 MHz)
      length: 83,          // mm (quarter wavelength)
      gain: 5.15,          // dBi (over perfect ground plane)
      impedance: 35,       // Ohms (quarter-wave over ground)
      radiation: 'omnidirectional',
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
      const df = Math.abs(f - fc) / (fc * 0.05);
      return complex(-1 / (1 + df * df), 0);
    });
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'coaxial_line', 'sma_connector', 'spectrum_analyzer', 'swr_meter', 'ground_plane'];
  }
}
