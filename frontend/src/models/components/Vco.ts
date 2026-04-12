import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Vco extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'vco', 'Voltage-Controlled Oscillator (VCO)', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      centerFrequency: 2.4e9,   // Hz
      tuningRange: 500e6,       // Hz (total range)
      tuningGain: 50e6,         // Hz/V
      controlVoltageMin: 0.5,   // V
      controlVoltageMax: 5.5,   // V
      outputPower: 0,           // dBm
      phaseNoise: -95,          // dBc/Hz at 1 MHz
      impedance: 50,            // Ohms
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_ctrl_in`, name: 'Vtune',   type: 'input',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_rf_out`,  name: 'RF Out',  type: 'output', position: { x: 80, y: 25 } },
      { id: `${this.id}_pwr`,     name: 'Vcc',     type: 'input',  position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0.05, 0));
    const s21 = frequency.map(() => complex(1.0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['amplifier', 'attenuator', 'mixer', 'phase_shifter', 'spectrum_analyzer', 'frequency_counter', 'bias_tee'];
  }
}
