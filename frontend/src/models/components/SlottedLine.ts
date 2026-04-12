import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class SlottedLine extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'slotted_line', 'Slotted Line', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 3e9,      // Hz
      impedance: 50,       // Ohms
      length: 500,         // mm (total slotted section)
      probeDepth: 1,       // mm (probe insertion)
      resolution: 0.1,     // mm (carriage resolution)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,        name: 'Source',   type: 'input',        position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`,       name: 'Load',     type: 'output',       position: { x: 80, y: 25 } },
      { id: `${this.id}_probe_out`, name: 'Probe Out', type: 'bidirectional', position: { x: 40, y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.02, 0));
    const s21 = frequency.map(() => complex(0.97, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'attenuator', 'rf_load', 'power_meter', 'swr_meter'];
  }
}
