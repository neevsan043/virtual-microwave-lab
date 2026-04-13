import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/**
 * nth-order Butterworth lowpass response:
 *   |S21|² = 1 / (1 + (f/fc)^{2n})
 * Passband insertion loss applied multiplicatively.
 * Lossless condition: |S11|² = 1 - |S21|²
 */
function butterworthLPF(f: number, fc: number, n: number, loss_dB: number) {
  const Omega    = f / fc;
  const s21_pow2 = Math.pow(10, -loss_dB / 10) / (1 + Math.pow(Omega, 2 * n));
  const s21_mag  = Math.sqrt(Math.max(0, s21_pow2));
  const s11_mag  = Math.sqrt(Math.max(0, 1 - s21_pow2));
  // Phase: -n·arctan(Ω) for minimum-phase filter
  const s21_phase = -n * Math.atan(Omega);
  const s11_phase = Math.atan2(Omega, 1) + Math.PI / 2;

  return {
    s21: complex(s21_mag * Math.cos(s21_phase), s21_mag * Math.sin(s21_phase)),
    s11: complex(s11_mag * Math.cos(s11_phase), s11_mag * Math.sin(s11_phase)),
  };
}

export class LowpassFilter extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'lowpass_filter', 'Lowpass Filter', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      cutoffFrequency: 2e9,  // Hz (-3 dB)
      insertionLoss: 0.5,    // dB passband IL
      order: 4,              // Butterworth order
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
    const fc   = this.parameters.cutoffFrequency as number;
    const loss = this.parameters.insertionLoss   as number;
    const n    = Math.round(this.parameters.order as number) || 4;

    const s11: ReturnType<typeof complex>[] = [];
    const s21: ReturnType<typeof complex>[] = [];

    frequency.forEach(f => {
      const { s21: s21v, s11: s11v } = butterworthLPF(f, fc, n, loss);
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
