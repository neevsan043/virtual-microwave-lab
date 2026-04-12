import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class GunnDiodeOscillator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'gunn_diode_oscillator', 'Gunn Diode Oscillator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 10e9,       // Hz (X-band typical)
      outputPower: 10,       // dBm
      biasCurrent: 500,      // mA
      biasVoltage: 8,        // V
      tuningRange: 500e6,    // Hz (mechanical tuning)
      phaseNoise: -80,       // dBc/Hz at 100 kHz
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_rf_out`,  name: 'RF Out',  type: 'output', position: { x: 80, y: 15 } },
      { id: `${this.id}_bias_in`, name: 'Bias In', type: 'input',  position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const fc = this.parameters.frequency as number;
    const s11 = frequency.map((f) => {
      const df = Math.abs(f - fc) / 100e6;
      return complex(-(0.5 + df * 0.3), 0);
    });
    const s21 = frequency.map(() => complex(1.0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['attenuator', 'isolator', 'circulator', 'waveguide_coax_adapter', 'spectrum_analyzer'];
  }
}
