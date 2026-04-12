import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Attenuator extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'attenuator', 'Attenuator', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      attenuation: 10,   // dB
      impedance: 50,     // Ω (matched pi-pad)
      maxPower: 2,       // W
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const atten_dB  = this.parameters.attenuation as number;
    const Z0        = this.parameters.impedance   as number;

    // For a perfectly-matched pi-pad attenuator the S-parameters are purely real and
    // frequency independent in the ideal case.  We add electrical-length phase
    // to model the physical size of the attenuator (~5mm at 50Ω typical).
    const physLength = 0.005;   // 5 mm equivalent electrical length
    const vf         = 0.66;    // velocity factor (SMA body)
    const c          = 3e8;

    // Attenuation factor
    const L = Math.pow(10, atten_dB / 20); // voltage loss ratio (> 1)

    // Matched pi-pad network values give:
    //   S11 = S22 = 0  (perfect match by design)
    //   S21 = S12 = 10^(-atten_dB/20)  (purely real at DC)
    // With electrical length phase:
    const s_params = {
      frequency,
      s11: frequency.map(() => complex(0, 0)),   // ideal matched pad → S11 = 0
      s21: frequency.map(f => {
        const beta   = (2 * Math.PI * f) / (c * vf);
        const phase  = -beta * physLength;
        const mag    = 1 / L;
        return complex(mag * Math.cos(phase), mag * Math.sin(phase));
      }),
      s12: [] as ReturnType<typeof complex>[],
      s22: [] as ReturnType<typeof complex>[],
    };
    s_params.s12 = s_params.s21.map(v => ({ ...v })); // reciprocal
    s_params.s22 = s_params.s11.map(v => ({ ...v })); // symmetric

    return s_params;
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'resistor', 'transmission_line',
      'amplifier', 'power_meter', 'spectrum_analyzer',
      'bandpass_filter', 'lowpass_filter', 'directional_coupler',
    ];
  }
}
