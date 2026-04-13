import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class WaveguideCoaxAdapter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'waveguide_coax_adapter', 'Waveguide-to-Coax Adapter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      waveguideSize: 'WR-90',  // WR-90 X-band (8.2–12.4 GHz)
      connectorType: 'SMA',    // 'SMA' | 'N' | 'K'
      insertionLoss: 0.2,      // dB
      vswr: 1.2,
      frequencyMin: 8.2e9,     // Hz
      frequencyMax: 12.4e9,    // Hz
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_wg`,   name: 'WG Port',   type: 'bidirectional',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_coax`, name: 'Coax Port', type: 'bidirectional', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const il = Math.pow(10, -(this.parameters.insertionLoss as number) / 20);
    const s11 = frequency.map(() => complex(0.03, 0));
    const s21 = frequency.map(() => complex(il, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'circular_waveguide', 'coaxial_line', 'sma_connector', 'n_connector', 'horn_antenna'];
  }
}
