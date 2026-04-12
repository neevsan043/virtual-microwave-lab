import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class PowerMeter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'power_meter', 'Power Meter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      range: 'auto', // auto, -30dBm, 0dBm, +10dBm
      impedance: 50, // 50 Ohms
      accuracy: 0.5, // ±0.5 dB
      minFrequency: 10e6, // 10 MHz
      maxFrequency: 18e9, // 18 GHz
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'RF In',
        type: 'input',
        position: { x: 0, y: 30 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    // Power meter acts as a matched load
    const s11 = frequency.map(() => complex(0.05, 0)); // Very good match
    const s21 = frequency.map(() => complex(0, 0)); // No transmission
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'resistor',
      'transmission_line',
      'amplifier',
      'mixer',
    ];
  }

  measurePower(inputPower_dBm: number): number {
    // Add measurement noise based on accuracy
    const accuracy = this.parameters.accuracy as number;
    const noise = (Math.random() - 0.5) * accuracy * 2;
    return inputPower_dBm + noise;
  }
}
