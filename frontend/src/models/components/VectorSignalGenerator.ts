import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class VectorSignalGenerator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'vector_signal_generator', 'Vector Signal Generator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 2.4e9,        // Hz
      outputPower: -10,         // dBm
      modulation: 'QAM64',     // 'none' | 'AM' | 'FM' | 'QPSK' | 'QAM16' | 'QAM64' | 'OFDM'
      symbolRate: 10e6,        // Symbols/s
      impedance: 50,           // Ohms
      frequencyRange: 6e9,     // Hz max
      phaseNoise: -120,        // dBc/Hz at 1 MHz offset
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_rf_out`,  name: 'RF Out',   type: 'output', position: { x: 80, y: 15 } },
      { id: `${this.id}_ref_in`,  name: 'Ref In',   type: 'input',  position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.01, 0));
    const s21 = frequency.map(() => complex(1.0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['attenuator', 'amplifier', 'spectrum_analyzer', 'signal_analyzer', 'mixer', 'high_power_attenuator'];
  }
}
