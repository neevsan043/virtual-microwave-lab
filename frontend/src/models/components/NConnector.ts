import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/** N-type connector - 18 GHz rated, weather-sealed */
export class NConnector extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'n_connector', 'N-Type Connector', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,         // Ohms
      frequencyMax: 18e9,    // Hz
      vswr: 1.3,
      insertionLoss: 0.15,   // dB at 18 GHz
      gender: 'male',
      matingCycles: 1000,
      weatherSealed: true,
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'Port 1', type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Port 2', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.03, 0));
    const s21 = frequency.map(() => complex(0.985, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['coaxial_line', 'semi_rigid_cable', 'flexible_rf_cable', 'attenuator', 'power_meter', 'signal_generator'];
  }
}
