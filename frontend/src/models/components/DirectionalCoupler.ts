import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/**
 * Directional coupler — ideal coupled-line model.
 *
 * Standard 4-port S-matrix (reduced to 2-port for the Through path here):
 *
 *   Port numbering:
 *     1 = Input        2 = Through
 *     3 = Coupled      4 = Isolated
 *
 *   For a lossless, matched, symmetric coupler:
 *     S11 = S22 = S33 = S44 = 0          (perfect match)
 *     |S21|² + |S31|² = 1                (power conservation)
 *     S21 = T = (1 - k²)^{0.5} · e^{-jθ}      (through, with phase)
 *     S31 = K = -jk · e^{-jθ}                  (coupled, −j = 90° lag)
 *     S41 = 0                            (isolated port — infinite directivity)
 *
 *   where k = 10^{-coupling_dB/20}
 *
 *   With finite insertion loss:
 *     S21 → S21 × 10^{-loss_dB/20}
 */
export class DirectionalCoupler extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'directional_coupler', 'Directional Coupler', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      coupling: 10,        // dB  (10 dB ≈ 10% of power to coupled port)
      directivity: 30,     // dB  (isolation - coupling)
      insertionLoss: 0.5,  // dB  (main-line loss)
      impedance: 50,
      electricalLength: 0.025, // m (≈ λ/4 at 3 GHz in typical substrate)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_p1`, name: 'Port 1 (Input)',   type: 'bidirectional',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_p2`, name: 'Port 2 (Through)', type: 'bidirectional', position: { x: 80, y: 15 } },
      { id: `${this.id}_p3`, name: 'Port 3 (Coupled)', type: 'bidirectional', position: { x: 40, y: 0  } },
      { id: `${this.id}_p4`, name: 'Port 4 (Isolated)',type: 'bidirectional', position: { x: 40, y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const coupling_dB  = this.parameters.coupling      as number;
    const directivity  = this.parameters.directivity   as number;
    const loss_dB      = this.parameters.insertionLoss as number;
    const ell          = this.parameters.electricalLength as number;
    const vf           = 0.66;
    const c            = 3e8;

    // Coupling factor (voltage)
    const k = Math.pow(10, -coupling_dB / 20);
    // Through factor (lossless):  T = sqrt(1 - k²)
    const T = Math.sqrt(Math.max(0, 1 - k * k));
    // Main-line loss factor
    const lossLin = Math.pow(10, -loss_dB / 20);

    const s11_arr: ReturnType<typeof complex>[] = [];
    const s21_arr: ReturnType<typeof complex>[] = [];
    const s12_arr: ReturnType<typeof complex>[] = [];
    const s22_arr: ReturnType<typeof complex>[] = [];

    frequency.forEach(freq => {
      // Phase from physical length θ = 2πf·ℓ / (c·vf)
      const theta = (2 * Math.PI * freq * ell) / (c * vf);

      // S21 (through): T · loss · e^{-jθ}
      const s21_mag = T * lossLin;
      const s21 = complex(s21_mag * Math.cos(-theta), s21_mag * Math.sin(-theta));

      // S31 (coupled): -jk · e^{-jθ}  →  k·∠(-θ - 90°)
      // For 2-port representation we store S12 as the coupled path response
      const s12_phase = -theta - Math.PI / 2;
      const s12 = complex(k * Math.cos(s12_phase), k * Math.sin(s12_phase));

      // S11 = S22 ≈ 0 for ideal matched coupler
      // With finite directivity, isolation leaks back: |S41| = k / 10^{directivity/20}
      // We represent the finite return loss due to directivity as a small S11
      const s11_mag = k / Math.pow(10, directivity / 20); // typically << 0.01
      const s11 = complex(s11_mag * Math.cos(-theta), s11_mag * Math.sin(-theta));

      s11_arr.push(s11);
      s21_arr.push(s21);
      s12_arr.push(s12);
      s22_arr.push({ ...s11 }); // symmetric
    });

    return { frequency, s11: s11_arr, s21: s21_arr, s12: s12_arr, s22: s22_arr };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'transmission_line', 'amplifier',
      'power_meter', 'spectrum_analyzer', 'network_analyzer', 'attenuator',
    ];
  }
}
