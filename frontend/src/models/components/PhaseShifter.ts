import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class PhaseShifter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'phase_shifter', 'Phase Shifter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      phaseShift: 90, // degrees
      insertionLoss: 0.5, // dB
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_p1`,
        name: 'Port 1',
        type: 'bidirectional',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_p2`,
        name: 'Port 2',
        type: 'bidirectional',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const phase = (this.parameters.phaseShift as number) * Math.PI / 180;
    const loss = this.parameters.insertionLoss as number;
    const mag = Math.pow(10, -loss / 20);

    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(mag * Math.cos(phase), mag * Math.sin(phase)));
    const s12 = s21;
    const s22 = s11;

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'transmission_line',
      'amplifier',
      'power_meter',
      'spectrum_analyzer',
    ];
  }
}
