import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class SignalAnalyzer extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'signal_analyzer', 'Signal Analyzer', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequencyStart: 10e6,    // Hz
      frequencyStop: 26.5e9,   // Hz
      dynamicRange: 100,       // dB
      noiseFloor: -165,        // dBm/Hz
      rbw: 1e3,                // Hz (resolution bandwidth)
      demodulation: 'IQ',      // IQ, AM, FM, PM
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_rf_in`, name: 'RF In', type: 'input', position: { x: 0, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.1, 0.05));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'amplifier', 'attenuator', 'high_power_attenuator', 'mixer', 'directional_coupler'];
  }
}
