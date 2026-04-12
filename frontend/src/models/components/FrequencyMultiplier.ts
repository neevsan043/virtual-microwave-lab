import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class FrequencyMultiplier extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'frequency_multiplier', 'Frequency Multiplier', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      inputFrequency: 10e9,     // Hz
      multiplicationFactor: 2,  // N (output = N × input)
      outputFrequency: 20e9,    // Hz (auto: input × factor)
      conversionLoss: 10,       // dB (output power vs input)
      harmonicRejection: 20,    // dBc (spurious harmonic suppression)
      inputPower: 13,           // dBm
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'RF In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'RF Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const lossLinear = Math.pow(10, -(this.parameters.conversionLoss as number) / 20);
    const s11 = frequency.map(() => complex(-0.15, 0.05));
    const s21 = frequency.map(() => complex(lossLinear, 0));
    const s12 = frequency.map(() => complex(0.01, 0));
    const s22 = frequency.map(() => complex(-0.1, 0));
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'vco', 'oscillator', 'amplifier', 'attenuator', 'spectrum_analyzer', 'mixer'];
  }
}
