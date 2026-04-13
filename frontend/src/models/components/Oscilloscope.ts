import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Oscilloscope extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'oscilloscope', 'Oscilloscope', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      bandwidth: 1e9, // 1 GHz
      sampleRate: 5e9, // 5 GSa/s
      inputImpedance: 50, // 50 Ohms or 1 MOhm
      channels: 4,
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_ch1`,
        name: 'CH1',
        type: 'input',
        position: { x: 0, y: 10 },
      },
      {
        id: `${this.id}_ch2`,
        name: 'CH2',
        type: 'input',
        position: { x: 0, y: 23 },
      },
      {
        id: `${this.id}_ch3`,
        name: 'CH3',
        type: 'input',
        position: { x: 0, y: 36 },
      },
      {
        id: `${this.id}_ch4`,
        name: 'CH4',
        type: 'input',
        position: { x: 0, y: 49 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.05, 0)); // Good match
    const s21 = frequency.map(() => complex(0, 0)); // Measurement device
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'amplifier',
      'mixer',
      'oscillator',
      'transmission_line',
    ];
  }
}
