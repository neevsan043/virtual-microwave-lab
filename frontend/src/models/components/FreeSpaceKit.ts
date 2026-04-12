import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class FreeSpaceKit extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'free_space_kit', 'Free-Space Measurement Kit', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequencyRange: 110e9,   // Hz max (W-band)
      separation: 0.5,         // m (antenna separation)
      fixtureLoss: 1.5,        // dB (lens & fixture)
      dynamicRange: 60,        // dB
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_tx`, name: 'TX Port', type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_rx`, name: 'RX Port', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const il = Math.pow(10, -this.parameters.fixtureLoss as number / 20);
    const s11 = frequency.map(() => complex(-0.15, 0));
    const s21 = frequency.map(() => complex(il, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'network_analyzer', 'horn_antenna', 'lens_antenna', 'spectrum_analyzer'];
  }
}
