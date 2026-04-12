import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Hemt extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'hemt', 'HEMT / GaAs FET', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 10e9,        // Hz
      gain: 15,               // dB
      noiseFigure: 0.8,       // dB (HEMT advantage — very low NF)
      p1dB: 15,               // dBm output 1 dB compression
      ip3: 25,                // dBm output IP3
      drainVoltage: 3,        // V
      drainCurrent: 40,       // mA
      transconductance: 200,  // mS
      technology: 'GaAs-pHEMT', // 'GaAs-pHEMT' | 'InP-HEMT' | 'GaN-HEMT'
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_gate`,   name: 'Gate (In)',    type: 'input',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_drain`,  name: 'Drain (Out)',  type: 'output', position: { x: 80, y: 15 } },
      { id: `${this.id}_source`, name: 'Source (GND)', type: 'bidirectional', position: { x: 40, y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const gain_dB = this.parameters.gain as number;
    const fc = this.parameters.frequency as number;
    const gain_linear = Math.pow(10, gain_dB / 20);

    const s11 = frequency.map(() => complex(-0.15, 0.1));
    const s21 = frequency.map((f) => {
      const factor = 1 / (1 + Math.pow((f - fc) / (fc * 0.3), 2));
      return complex(gain_linear * factor, 0);
    });
    const s12 = frequency.map(() => complex(0.005, 0));
    const s22 = frequency.map(() => complex(-0.1, -0.05));
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['microstrip_line', 'cpw_line', 'bias_tee', 'attenuator', 'mixer', 'noise_source'];
  }
}
