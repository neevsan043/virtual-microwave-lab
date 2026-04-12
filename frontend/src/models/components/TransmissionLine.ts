import { Component, complex, ComplexMath } from '../Component';
import { ComponentParameters, Port, SParameters, Complex } from '../../types';

/**
 * Exact two-port S-matrix for a lossy transmission line terminated in Z0.
 *
 *  γ = α + jβ    (complex propagation constant)
 *  β = 2πf / (vp)          phase constant [rad/m]
 *  α = loss_dB_per_m / (20·log10(e))   attenuation constant [Np/m]
 *
 *  For a line with characteristic impedance Z_c matched to Z0 = 50 Ω:
 *    S11 = S22 = Γ = (Zc - Z0)/(Zc + Z0)   (real, frequency-independent)
 *    S21 = S12 = (1 - Γ²) · e^{-γℓ} / (1 - Γ²·e^{-2γℓ})
 *
 *  For a perfectly matched line (Zc = Z0):
 *    S11 = S22 = 0
 *    S21 = S12 = e^{-γℓ} = e^{-αℓ} · e^{-jβℓ}
 */
export class TransmissionLine extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'transmission_line', 'Transmission Line', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      length: 0.05,             // m (5 cm)
      impedance: 50,            // Ω characteristic impedance
      velocityFactor: 0.66,     // fraction of c
      loss: 0.1,                // dB per metre
      lineType: 'coax',         // coax | microstrip | stripline
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'Port 1', type: 'bidirectional', position: { x: 0,  y: 15 } },
      { id: `${this.id}_out`, name: 'Port 2', type: 'bidirectional', position: { x: 80, y: 15 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const ell    = this.parameters.length         as number;  // m
    const Zc     = this.parameters.impedance      as number;  // Ω
    const vf     = this.parameters.velocityFactor as number;  // fraction
    const loss_dB_m = this.parameters.loss        as number;  // dB/m
    const Z0     = 50;                                         // system ref Ω
    const c      = 3e8;                                        // m/s

    // Attenuation constant: convert dB/m → Np/m
    //   α [Np/m] = loss_dB_m / (20 · log10(e)) = loss_dB_m · ln(10) / 20
    const alpha  = loss_dB_m * Math.LN10 / 20;

    // Reflection coefficient at both ports (purely real for lossless Zc mismatch)
    const Gamma  = (Zc - Z0) / (Zc + Z0);

    const s11_arr: Complex[] = [];
    const s21_arr: Complex[] = [];

    frequency.forEach(freq => {
      const vp   = c * vf;
      const beta = (2 * Math.PI * freq) / vp;   // rad/m

      // e^{-γℓ} = e^{-αℓ} · (cos(βℓ) - j·sin(βℓ))
      const expAlphaL     = Math.exp(-alpha * ell);
      const betaL         = beta * ell;
      const expGammaL_r   = expAlphaL * Math.cos(betaL);
      const expGammaL_i   = -expAlphaL * Math.sin(betaL);

      // e^{-2γℓ}
      const exp2AlphaL    = expAlphaL * expAlphaL;
      const exp2GammaL_r  = exp2AlphaL * Math.cos(2 * betaL);
      const exp2GammaL_i  = -exp2AlphaL * Math.sin(2 * betaL);

      // Denominator: 1 - Γ²·e^{-2γℓ}
      const G2 = Gamma * Gamma;
      const den_r = 1 - G2 * exp2GammaL_r;
      const den_i = -G2 * exp2GammaL_i;
      const den2  = den_r * den_r + den_i * den_i;

      // S11 = S22 = Γ·(1 - e^{-2γℓ}) / (1 - Γ²·e^{-2γℓ})
      const num_s11_r = Gamma * (1 - exp2GammaL_r);
      const num_s11_i = -Gamma * exp2GammaL_i;
      const s11_r = (num_s11_r * den_r + num_s11_i * den_i) / den2;
      const s11_i = (num_s11_i * den_r - num_s11_r * den_i) / den2;

      // S21 = S12 = (1 - Γ²)·e^{-γℓ} / (1 - Γ²·e^{-2γℓ})
      const factor = 1 - G2;
      const num_s21_r = factor * expGammaL_r;
      const num_s21_i = factor * expGammaL_i;
      const s21_r = (num_s21_r * den_r + num_s21_i * den_i) / den2;
      const s21_i = (num_s21_i * den_r - num_s21_r * den_i) / den2;

      s11_arr.push(complex(s11_r, s11_i));
      s21_arr.push(complex(s21_r, s21_i));
    });

    return {
      frequency,
      s11: s11_arr,
      s21: s21_arr,
      s12: s21_arr.map(v => ({ ...v })),   // reciprocal
      s22: s11_arr.map(v => ({ ...v })),   // symmetric
    };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator', 'resistor', 'capacitor', 'inductor',
      'transmission_line', 'amplifier', 'mixer',
      'power_meter', 'spectrum_analyzer', 'network_analyzer',
    ];
  }
}
