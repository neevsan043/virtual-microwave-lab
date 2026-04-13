import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/**
 * nth-order Butterworth bandstop (notch) response:
 *   Use complement of BPF:  |S21_BSF|² ≈ 1 - |S21_BPF|²
 *   with passband loss on the transmitted (out-of-band) portion.
 *
 *   Ω = Q·(f/f0 - f0/f)
 *   |S21_BPF|² = 1 / (1 + Ω^{2n})
 *   |S21_BSF|² = Ω^{2n} / (1 + Ω^{2n}) × 10^{-loss/10}
 */
function butterworthBSF(f: number, fc: number, bw: number, n: number, loss_dB: number) {
  const Q     = fc / bw;
  const Omega = Q * (f / fc - fc / f);
  const O2n   = Math.pow(Math.abs(Omega), 2 * n);
  const denom = 1 + O2n;

  const s21_pow2 = Math.pow(10, -loss_dB / 10) * O2n / denom;
  const s21_mag  = Math.sqrt(Math.max(0, s21_pow2));
  const s11_mag  = Math.sqrt(Math.max(0, 1 - s21_pow2));

  // Phase: BSF phase is complementary to BPF
  const s21_phase = n * (Math.atan(Omega) - Math.PI / 2 * Math.sign(Omega));
  const s11_phase = -n * Math.atan(1 / Math.max(Math.abs(Omega), 1e-9)) * Math.sign(Omega);

  return {
    s21: complex(s21_mag * Math.cos(s21_phase), s21_mag * Math.sin(s21_phase)),
    s11: complex(s11_mag * Math.cos(s11_phase), s11_mag * Math.sin(s11_phase)),
  };
}

export class BandstopFilter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'bandstop_filter', 'Bandstop Filter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      centerFrequency: 2.4e9, // Hz
      bandwidth: 100e6,        // Hz (notch -3 dB width)
      insertionLoss: 0.5,      // dB passband IL
      order: 4,
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
      const { s21: s21v, s11: s11v } = butterworthBSF(f, fc, bw, n, loss);
      s21.push(s21v);
      s11.push(s11v);
    });

    return { frequency, s11, s21, s12: s21.map(v => ({ ...v })), s22: s11.map(v => ({ ...v })) };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'transmission_line', 'amplifier',
      'power_meter', 'spectrum_analyzer', 'attenuator',
    ];
  }
}
