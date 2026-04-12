import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Mixer extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'mixer', 'Mixer', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      conversionLoss: 6, // dB
      loFrequency: 2.4e9, // 2.4 GHz
      loPower: 10, // dBm
      impedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_rf`,
        name: 'RF',
        type: 'input',
        position: { x: 0, y: 15 },
      },
      {
        id: `${this.id}_lo`,
        name: 'LO',
        type: 'input',
        position: { x: 0, y: 35 },
      },
      {
        id: `${this.id}_if`,
        name: 'IF',
        type: 'output',
        position: { x: 80, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const loss = this.parameters.conversionLoss as number;
    const lossLinear = Math.pow(10, -loss / 20);

    const s11 = frequency.map(() => complex(0.1, 0));
    const s21 = frequency.map(() => complex(lossLinear, 0));
    const s12 = frequency.map(() => complex(0.01, 0));
    const s22 = frequency.map(() => complex(0.1, 0));

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
      'oscillator',
      'power_meter',
      'spectrum_analyzer',
    ];
  }
}
