import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class BiasTee extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'bias_tee', 'Bias Tee', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      dcVoltage: 5,          // V
      dcCurrentMax: 500,     // mA
      frequencyMin: 10e6,    // Hz
      frequencyMax: 26.5e9,  // Hz
      rfInsertionLoss: 0.3,  // dB
      dcIsolation: 30,       // dB (RF isolation from DC port)
      impedance: 50,         // Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_rf_in`,     name: 'RF In',      type: 'input',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_dc_in`,     name: 'DC In',      type: 'input',  position: { x: 0,  y: 40 } },
      { id: `${this.id}_rf_dc_out`, name: 'RF+DC Out',  type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const il = Math.pow(10, -(this.parameters.rfInsertionLoss as number) / 20);
    const s11 = frequency.map(() => complex(0.02, 0));
    const s21 = frequency.map(() => complex(il, 0));
    const s12 = s21;
    const s22 = frequency.map(() => complex(0.01, 0));
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['amplifier', 'hemt', 'vco', 'pin_diode', 'varactor_diode', 'signal_generator', 'dc_power_supply'];
  }
}
