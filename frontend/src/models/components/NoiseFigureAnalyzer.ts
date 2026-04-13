import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class NoiseFigureAnalyzer extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'noise_figure_analyzer', 'Noise Figure Analyzer', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequencyStart: 10e6,    // Hz
      frequencyStop: 26.5e9,   // Hz
      nfRange: 30,             // dB max measurable NF
      enr: 15,                 // dB (excess noise ratio of noise source)
      uncertainty: 0.1,        // dB measurement uncertainty
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_noise_drive`, name: 'Noise Drive (+28V)', type: 'output', position: { x: 0,  y: 15 } },
      { id: `${this.id}_input`,       name: 'RF In',              type: 'input',  position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.1, 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['amplifier', 'mixer', 'attenuator', 'noise_source', 'signal_analyzer'];
  }
}
