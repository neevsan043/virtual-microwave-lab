import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/**
 * Butterworth lowpass prototype converted to bandpass response via frequency transform.
 *
 * 4th-order Butterworth BPF response:
 *   |S21|² = 1 / (1 + ε²·Ω^{2n})
 * where Ω = Q·(f/f0 - f0/f)  is the normalized bandpass frequency variable.
 *
 * S11 satisfies lossless condition: |S11|² + |S21|² = 1
 * Phase of S21 ≈ -n·arctan(Ω) (minimum-phase approximation)
 */
function butterworthBPF(f: number, fc: number, bw: number, n: number, loss_dB: number) {
  const Q   = fc / bw;
  const Omega = Q * (f / fc - fc / f); // normalized frequency variable
  const denom = 1 + Math.pow(Omega, 2 * n);
  const s21_pow2 = Math.pow(10, -loss_dB / 10) / denom;          // passband IL applied

  const s21_mag  = Math.sqrt(Math.max(0, s21_pow2));
  const s11_mag  = Math.sqrt(Math.max(0, 1 - s21_pow2));          // lossless condition

  // Phase: group delay modelled as -dφ/dω ≈ n·Q / (f0·(1+Ω²))
  const s21_phase = -n * Math.atan(Omega);

  // S11 phase: leads by 90° in passband, transitions to 0° stopband
  const s11_phase = Math.atan2(Omega, 1) + Math.PI / 2 * (Omega > 0 ? 1 : -1);

  return {
    s21: complex(s21_mag * Math.cos(s21_phase), s21_mag * Math.sin(s21_phase)),
    s11: complex(s11_mag * Math.cos(s11_phase), s11_mag * Math.sin(s11_phase)),
  };
}

export class BandpassFilter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'bandpass_filter', 'Bandpass Filter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      centerFrequency: 2.4e9,  // Hz
      bandwidth: 100e6,         // Hz (-3 dB)
      insertionLoss: 1,         // dB passband IL
      order: 4,                 // Butterworth order
      impedance: 50,
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_p1`,  name: 'Port 1',  type: 'bidirectional',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_p2`,  name: 'Port 2',  type: 'bidirectional',  position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const fc   = this.parameters.centerFrequency as number;
    const bw   = this.parameters.bandwidth       as number;
    const loss = this.parameters.insertionLoss   as number;
    const n    = Math.round(this.parameters.order as number) || 4;

    const s11: ReturnType<typeof complex>[] = [];
    const s21: ReturnType<typeof complex>[] = [];

    frequency.forEach(f => {
      const { s21: s21v, s11: s11v } = butterworthBPF(f, fc, bw, n, loss);
      s21.push(s21v);
      s11.push(s11v);
    });

    return { frequency, s11, s21, s12: s21.map(v => ({ ...v })), s22: s11.map(v => ({ ...v })) };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'transmission_line', 'amplifier',
      'mixer', 'power_meter', 'spectrum_analyzer', 'attenuator',
    ];
  }
}
