import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class PowerSplitter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'power_splitter', 'Power Splitter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      splitRatio: 0.5, // 50-50 split (0.5 = 3dB)
      insertionLoss: 0.5, // dB
      isolation: 20, // dB between output ports
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_p1`,
        name: 'Port 1 (Input)',
        type: 'bidirectional',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_p2`,
        name: 'Port 2 (Output 1)',
        type: 'bidirectional',
        position: { x: 80, y: 15 },
      },
      {
        id: `${this.id}_p3`,
        name: 'Port 3 (Output 2)',
        type: 'bidirectional',
        position: { x: 80, y: 35 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const ratio = this.parameters.splitRatio as number;
    const loss = this.parameters.insertionLoss as number;
    const isolation = this.parameters.isolation as number;

    // Calculate split coefficients
    const s21_mag = Math.sqrt(ratio) * Math.pow(10, -loss / 20);
    const s31_mag = Math.sqrt(1 - ratio) * Math.pow(10, -loss / 20);
    const iso_mag = Math.pow(10, -isolation / 20);

    const s11 = frequency.map(() => complex(0.05, 0)); // Good input match
    const s21 = frequency.map(() => complex(s21_mag, 0)); // Output 1
    const s12 = frequency.map(() => complex(s21_mag, 0)); // Reciprocal
    const s22 = frequency.map(() => complex(0.05, 0)); // Output 1 match

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'resistor',
      'transmission_line',
      'amplifier',
      'power_meter',
      'spectrum_analyzer',
    ];
  }
}
