import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/** BNC connector - up to 4 GHz */
export class BncConnector extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'bnc_connector', 'BNC Connector', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,        // Ohms (also 75Ω version exists)
      frequencyMax: 4e9,    // Hz
      vswr: 1.5,
      insertionLoss: 0.2,   // dB at 4 GHz
      gender: 'male',
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
    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(0.975, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['coaxial_line', 'flexible_rf_cable', 'oscilloscope', 'function_generator', 'signal_generator'];
  }
}
