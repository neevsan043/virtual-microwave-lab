import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/** SMA connector - 18 GHz rated */
export class SmaConnector extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'sma_connector', 'SMA Connector', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,         // Ohms
      frequencyMax: 18e9,    // Hz
      vswr: 1.2,             // max at rated frequency
      insertionLoss: 0.1,    // dB at 18 GHz
      gender: 'male',        // 'male' | 'female'
      matingCycles: 500,
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'Port 1', type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Port 2', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.02, 0));
    const s21 = frequency.map(() => complex(0.99, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['coaxial_line', 'semi_rigid_cable', 'flexible_rf_cable', 'attenuator', 'amplifier', 'signal_generator', 'spectrum_analyzer'];
  }
}
