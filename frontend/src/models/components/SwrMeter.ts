import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class SwrMeter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'swr_meter', 'SWR Meter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequencyRange: 3e9,   // Hz max
      swrRange: 10,          // max SWR readable
      insertionLoss: 0.2,    // dB
      directivity: 30,       // dB
      impedance: 50,         // Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'Source', type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Load',   type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const il = Math.pow(10, -this.parameters.insertionLoss as number / 20);
    const s11 = frequency.map(() => complex(0.02, 0));
    const s21 = frequency.map(() => complex(il, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'amplifier', 'attenuator', 'transmission_line', 'coaxial_line', 'dipole_antenna'];
  }
}
