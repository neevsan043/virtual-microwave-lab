import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class NetworkAnalyzer extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'network_analyzer', 'Network Analyzer', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      startFrequency: 1e9, // 1 GHz
      stopFrequency: 3e9, // 3 GHz
      points: 201,
      ifBandwidth: 1000, // 1 kHz
      power: -10, // -10 dBm
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_port1`,
        name: 'Port 1',
        type: 'bidirectional',
        position: { x: 0, y: 25 },
      },
      {
        id: `${this.id}_port2`,
        name: 'Port 2',
        type: 'bidirectional',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0.05, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'resistor',
      'capacitor',
      'inductor',
      'transmission_line',
      'amplifier',
      'mixer',
      'oscillator',
      'power_meter',
      'spectrum_analyzer',
    ];
  }
}
