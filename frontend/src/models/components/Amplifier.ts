import { Component, complex, ComplexMath } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Amplifier extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'amplifier', 'Amplifier', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      gain: 20,              // dB small-signal gain at center frequency
      noiseFigure: 2,        // dB
      inputImpedance: 50,    // Ω
      outputImpedance: 50,   // Ω
      bandwidth: 1e9,        // Hz (-3 dB bandwidth)
      centerFrequency: 2.4e9,// Hz
      p1dB: 10,              // dBm — 1 dB compression point
      groupDelay: 2e-9,      // s  — internal electrical delay (2 ns typical RF amp)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'RF In',  type: 'input',  position: { x: 0,  y: 24 } },
      { id: `${this.id}_out`, name: 'RF Out', type: 'output', position: { x: 80, y: 24 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const gainDB    = this.parameters.gain            as number;  // dB
    const fc        = this.parameters.centerFrequency as number;  // Hz
    const bw        = this.parameters.bandwidth       as number;  // Hz
    const Zin_nom   = this.parameters.inputImpedance  as number;  // Ω
    const Zout_nom  = this.parameters.outputImpedance as number;  // Ω
    const tau       = this.parameters.groupDelay      as number;  // s
    const Z0        = 50; // system reference impedance

    return {
      frequency,
      s11: frequency.map(f => {
        // Input impedance varies reactively with frequency:  Zin = Zin_nom / (1 + j·f/f3dB)
        const f3dB = bw / 2;
        const zin_r = Zin_nom / (1 + (f / f3dB) ** 2);
        const zin_i = -Zin_nom * (f / f3dB) / (1 + (f / f3dB) ** 2);
        const num_r = zin_r - Z0, num_i = zin_i;
        const den_r = zin_r + Z0, den_i = zin_i;
        const den2 = den_r * den_r + den_i * den_i;
        return complex(
          (num_r * den_r + num_i * den_i) / den2,
          (num_i * den_r - num_r * den_i) / den2,
        );
      }),

      s21: frequency.map(f => {
        // Frequency-dependent gain with single-pole roll-off
        const f_norm   = (f - fc) / (bw / 2);
        const gain_fac = 1 / (1 + f_norm * f_norm);       // Lorentzian passband
        const gain_lin = Math.pow(10, (gainDB * gain_fac) / 20);
        // Phase shift from internal group delay τ:  e^{-j2πfτ}
        const phase = -2 * Math.PI * f * tau;
        return complex(gain_lin * Math.cos(phase), gain_lin * Math.sin(phase));
      }),

      s12: frequency.map(f => {
        // Reverse isolation ≈ -30 dB (increases slightly with freq)
        const iso_dB  = 30 + 10 * Math.log10(1 + (f / fc) ** 2);
        const iso_lin = Math.pow(10, -iso_dB / 20);
        const phase   = -2 * Math.PI * f * (1e-10); // tiny reverse delay
        return complex(iso_lin * Math.cos(phase), iso_lin * Math.sin(phase));
      }),

      s22: frequency.map(f => {
        // Output impedance reactive variation
        const f3dB = bw / 2;
        const zout_r = Zout_nom / (1 + (f / f3dB) ** 2);
        const zout_i = +Zout_nom * (f / f3dB) / (1 + (f / f3dB) ** 2); // inductive at output
        const num_r = zout_r - Z0, num_i = zout_i;
        const den_r = zout_r + Z0, den_i = zout_i;
        const den2  = den_r * den_r + den_i * den_i;
        return complex(
          (num_r * den_r + num_i * den_i) / den2,
          (num_i * den_r - num_r * den_i) / den2,
        );
      }),
    };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'resistor', 'transmission_line',
      'mixer', 'power_meter', 'spectrum_analyzer', 'attenuator',
      'bandpass_filter', 'lowpass_filter', 'highpass_filter',
    ];
  }
}
