import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class KlystronOscillator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'klystron_oscillator', 'Klystron Oscillator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 9.375e9,    // Hz (X-band radar)
      outputPower: 30,       // dBm (1W)
      beamVoltage: 300,      // V
      beamCurrent: 20,       // mA
      reflectorVoltage: -50, // V (reflex klystron)
      tuningRange: 200e6,    // Hz
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_rf_out`,        name: 'RF Out',       type: 'output', position: { x: 80, y: 15 } },
      { id: `${this.id}_beam_voltage`,   name: 'Beam V',       type: 'input',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_refl_voltage`,   name: 'Reflector V',  type: 'input',  position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.3, 0));
    const s21 = frequency.map(() => complex(1.0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['rectangular_waveguide', 'attenuator', 'isolator', 'waveguide_coax_adapter', 'spectrum_analyzer'];
  }
}
