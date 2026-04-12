import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/** 2.92mm connector identical to K-type */
export class MmConnector292 extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'mm_connector_292', '2.92mm Connector', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,
      frequencyMax: 40e9,
      vswr: 1.25,
      insertionLoss: 0.25,
      gender: 'male',
      matingCycles: 1000,
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
    return ['k_connector', 'semi_rigid_cable', 'mm_connector_185', 'attenuator', 'spectrum_analyzer'];
  }
}
