import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class FrequencyCounter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'frequency_counter', 'Frequency Counter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      maxFrequency: 20e9, // 20 GHz
      resolution: 1, // Hz
      inputImpedance: 50, // 50 Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'Input',
        type: 'input',
        position: { x: 0, y: 25 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'oscillator',
      'amplifier',
      'mixer',
    ];
  }
}
