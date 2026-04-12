import { Component, ComplexMath, complex } from '../models/Component';
import { Connection, SParameters, Complex } from '../types';

export interface SimulationResult {
  success: boolean;
  frequencies: number[];
  sparameters: SParameters;
  powerLevels: Map<string, number>; // Component ID -> Power in dBm
  voltages: Map<string, Complex>;   // Component ID -> Voltage
  errors: string[];
  warnings: string[];
  componentOrder: string[];         // Ordered IDs in the signal path (for AI context)
}

// ─── ABCD / S-parameter interconversion helpers ───────────────────────────────
// Z0 = reference impedance (50 Ω throughout)

type M2x2 = [Complex, Complex, Complex, Complex]; // [A, B, C, D]

function cnum(r: number, i = 0): Complex { return { real: r, imag: i }; }

function cAdd(a: Complex, b: Complex): Complex {
  return ComplexMath.add(a, b);
}
function cSub(a: Complex, b: Complex): Complex {
  return ComplexMath.subtract(a, b);
}
function cMul(a: Complex, b: Complex): Complex {
  return ComplexMath.multiply(a, b);
}
function cDiv(a: Complex, b: Complex): Complex {
  return ComplexMath.divide(a, b);
}

/** Multiply two 2×2 ABCD matrices */
function matMul(P: M2x2, Q: M2x2): M2x2 {
  const [A1, B1, C1, D1] = P;
  const [A2, B2, C2, D2] = Q;
  return [
    cAdd(cMul(A1, A2), cMul(B1, C2)),
    cAdd(cMul(A1, B2), cMul(B1, D2)),
    cAdd(cMul(C1, A2), cMul(D1, C2)),
    cAdd(cMul(C1, B2), cMul(D1, D2)),
  ];
}

/** Convert 2-port S-parameters to ABCD matrix (referenced to Z0 = 50 Ω) */
function sToABCD(s11: Complex, s21: Complex, s12: Complex, s22: Complex, Z0 = 50): M2x2 {
  const z = cnum(Z0);
  // Standard S → ABCD formulas (all referenced to same Z0)
  // A = ((1+S11)(1-S22) + S12*S21) / 2*S21
  // B = Z0 * ((1+S11)(1+S22) - S12*S21) / 2*S21
  // C = (1/Z0) * ((1-S11)(1-S22) - S12*S21) / 2*S21
  // D = ((1-S11)(1+S22) + S12*S21) / 2*S21
  const one = cnum(1);
  const two = cnum(2);
  const twoS21 = cMul(two, s21);

  const A = cDiv(cAdd(cMul(cAdd(one, s11), cSub(one, s22)), cMul(s12, s21)), twoS21);
  const B = cMul(z, cDiv(cSub(cMul(cAdd(one, s11), cAdd(one, s22)), cMul(s12, s21)), twoS21));
  const C = cDiv(cDiv(cSub(cMul(cSub(one, s11), cSub(one, s22)), cMul(s12, s21)), twoS21), z);
  const D = cDiv(cAdd(cMul(cSub(one, s11), cAdd(one, s22)), cMul(s12, s21)), twoS21);

  return [A, B, C, D];
}

/** Convert ABCD matrix back to S-parameters (referenced to Z0 = 50 Ω) */
function abcdToS(M: M2x2, Z0 = 50): { s11: Complex; s21: Complex; s12: Complex; s22: Complex } {
  const [A, B, C, D] = M;
  const z = cnum(Z0);
  // denominator = A + B/Z0 + C*Z0 + D
  const denom = cAdd(cAdd(cAdd(A, cDiv(B, z)), cMul(C, z)), D);

  const s11 = cDiv(cAdd(cSub(A, D), cSub(cDiv(B, z), cMul(C, z))), denom);
  const s21 = cDiv(cnum(2), denom);
  const s12 = cDiv(cSub(cMul(cnum(2), cSub(cMul(A, D), cMul(B, C))), cnum(0)), denom);
  // s12 = 2*(AD-BC) / denom  (should equal s21 for reciprocal)
  const s12_correct = cDiv(cMul(cnum(2), cSub(cMul(A, D), cMul(B, C))), denom);
  const s22 = cDiv(cAdd(cSub(D, A), cSub(cDiv(B, z), cMul(C, z))), denom);

  return { s11, s21, s12: s12_correct, s22 };
}

/** Identity ABCD matrix (lossless, perfectly-matched through) */
function identityABCD(): M2x2 {
  return [cnum(1), cnum(0), cnum(0), cnum(1)];
}

// ─── Simulator ────────────────────────────────────────────────────────────────

export class RFSimulator {
  private components: Component[];
  private connections: Connection[];
  private frequencyRange: { start: number; stop: number; points: number };

  constructor(
    components: Component[],
    connections: Connection[],
    frequencyRange = { start: 1e9, stop: 3e9, points: 101 }
  ) {
    this.components = components;
    this.connections = connections;
    this.frequencyRange = frequencyRange;
  }

  // ── Public entry point ────────────────────────────────────────────────────
  async simulate(): Promise<SimulationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validation = this.validateCircuit();
    if (!validation.valid) {
      return {
        success: false,
        frequencies: [],
        sparameters: { frequency: [], s11: [], s21: [], s12: [], s22: [] },
        powerLevels: new Map(),
        voltages: new Map(),
        errors: validation.errors,
        warnings: validation.warnings,
        componentOrder: [],
      };
    }
    warnings.push(...validation.warnings);

    const frequencies = this.generateFrequencies();

    // Build the signal path (ordered list of DUT components)
    const signalPath = this.buildSignalPath();
    if (signalPath.length === 0) {
      warnings.push('No DUT components found in signal path — showing source-to-load through-line.');
    }

    // Cascade S-parameters using ABCD chain multiplication
    const sparameters = this.calculateCircuitSParameters(frequencies, signalPath);

    // Source power
    const source = this.components.find(c => c.type === 'signal_generator' || c.type === 'oscillator');
    const sourcePower: number = source ? (source.parameters.power as number ?? 0) : 0;

    const powerLevels = this.calculatePowerLevels(signalPath, sourcePower, frequencies);
    const voltages = this.calculateVoltages(signalPath, frequencies);

    return {
      success: true,
      frequencies,
      sparameters,
      powerLevels,
      voltages,
      errors,
      warnings,
      componentOrder: signalPath.map(c => `${c.name} (${c.type})`),
    };
  }

  // ── Circuit validation ─────────────────────────────────────────────────────
  private validateCircuit(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sourceTypes = ['signal_generator', 'oscillator', 'function_generator',
      'vector_signal_generator', 'gunn_diode_oscillator', 'klystron_oscillator',
      'vco', 'noise_source'];
    const measureTypes = ['power_meter', 'spectrum_analyzer', 'network_analyzer',
      'oscilloscope', 'frequency_counter', 'signal_analyzer',
      'swr_meter', 'noise_figure_analyzer'];

    const sources = this.components.filter(c => sourceTypes.includes(c.type));
    const measures = this.components.filter(c => measureTypes.includes(c.type));

    if (sources.length === 0) errors.push('Circuit must have at least one signal source (e.g. Signal Generator)');
    if (measures.length === 0) errors.push('Circuit must have at least one measurement device (e.g. Power Meter, Spectrum Analyzer)');
    if (sources.length > 1) warnings.push('Multiple sources — simulation uses the first source only');

    // Warn about isolated components
    const connectedIds = new Set<string>();
    this.connections.forEach(c => { connectedIds.add(c.fromComponent); connectedIds.add(c.toComponent); });
    this.components.forEach(c => {
      if (!connectedIds.has(c.id) && !sourceTypes.includes(c.type) && !measureTypes.includes(c.type)) {
        warnings.push(`"${c.name}" is not connected to any other component`);
      }
    });

    return { valid: errors.length === 0, errors, warnings };
  }

  // ── Frequency sweep ────────────────────────────────────────────────────────
  private generateFrequencies(): number[] {
    const { start, stop, points } = this.frequencyRange;
    return Array.from({ length: points }, (_, i) => start + (i / (points - 1)) * (stop - start));
  }

  // ── Topology traversal — build ordered DUT path ────────────────────────────
  private buildSignalPath(): Component[] {
    const sourceTypes = ['signal_generator', 'oscillator', 'function_generator',
      'vector_signal_generator', 'gunn_diode_oscillator', 'klystron_oscillator',
      'vco', 'noise_source'];
    const measureTypes = ['power_meter', 'spectrum_analyzer', 'network_analyzer',
      'oscilloscope', 'frequency_counter', 'signal_analyzer',
      'swr_meter', 'noise_figure_analyzer'];
    const excludeTypes = [...sourceTypes, ...measureTypes];

    // BFS from source through connections
    const source = this.components.find(c => sourceTypes.includes(c.type));
    if (!source) return this.components.filter(c => !excludeTypes.includes(c.type));

    const ordered: Component[] = [];
    const visited = new Set<string>();
    const queue: string[] = [source.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const component = this.components.find(c => c.id === currentId);
      if (component && !excludeTypes.includes(component.type)) {
        ordered.push(component);
      }

      // Follow outgoing connections
      this.connections
        .filter(c => c.fromComponent === currentId)
        .forEach(c => { if (!visited.has(c.toComponent)) queue.push(c.toComponent); });

      // Also follow reverse (bidirectional ports)
      this.connections
        .filter(c => c.toComponent === currentId)
        .forEach(c => { if (!visited.has(c.fromComponent)) queue.push(c.fromComponent); });
    }

    // Fallback: any DUT component not reachable from source
    this.components
      .filter(c => !excludeTypes.includes(c.type) && !visited.has(c.id))
      .forEach(c => ordered.push(c));

    return ordered;
  }

  // ── Core: ABCD chain cascade → S-parameters ──────────────────────────────
  private calculateCircuitSParameters(frequencies: number[], signalPath: Component[]): SParameters {
    const s11: Complex[] = [];
    const s21: Complex[] = [];
    const s12: Complex[] = [];
    const s22: Complex[] = [];

    frequencies.forEach(freq => {
      if (signalPath.length === 0) {
        // No DUT → perfect through
        s11.push(cnum(0));
        s21.push(cnum(1));
        s12.push(cnum(1));
        s22.push(cnum(0));
        return;
      }

      // Start with identity ABCD
      let chainABCD: M2x2 = identityABCD();

      for (const comp of signalPath) {
        const sp = comp.getSParameters([freq]);
        if (!sp.s11[0] || !sp.s21[0] || !sp.s12[0] || !sp.s22[0]) continue;

        // Guard against S21 = 0 (would cause divide-by-zero in S→ABCD)
        const s21mag = ComplexMath.magnitude(sp.s21[0]);
        if (s21mag < 1e-12) {
          // Treat as complete attenuator: cascade a very lossy element
          const abcd: M2x2 = [cnum(1e6), cnum(0), cnum(0), cnum(1e6)];
          chainABCD = matMul(chainABCD, abcd);
          continue;
        }

        const abcd = sToABCD(sp.s11[0], sp.s21[0], sp.s12[0], sp.s22[0]);
        chainABCD = matMul(chainABCD, abcd);
      }

      const s = abcdToS(chainABCD);
      s11.push(s.s11);
      s21.push(s.s21);
      s12.push(s.s12);
      s22.push(s.s22);
    });

    return { frequency: frequencies, s11, s21, s12, s22 };
  }

  // ── Power level sweep ──────────────────────────────────────────────────────
  private calculatePowerLevels(
    signalPath: Component[],
    sourcePower: number,
    frequencies: number[]
  ): Map<string, number> {
    const powerLevels = new Map<string, number>();
    const midFreq = frequencies[Math.floor(frequencies.length / 2)];

    let currentPower = sourcePower;
    for (const comp of signalPath) {
      const sp = comp.getSParameters([midFreq]);
      const s21mag = ComplexMath.magnitude(sp.s21[0] ?? cnum(1));
      const gainDB = 20 * Math.log10(Math.max(s21mag, 1e-15));
      currentPower += gainDB;
      powerLevels.set(comp.id, currentPower);
    }
    return powerLevels;
  }

  // ── Voltage trace ──────────────────────────────────────────────────────────
  private calculateVoltages(signalPath: Component[], frequencies: number[]): Map<string, Complex> {
    const voltages = new Map<string, Complex>();
    const midFreq = frequencies[Math.floor(frequencies.length / 2)];

    let v: Complex = cnum(1);
    for (const comp of signalPath) {
      const sp = comp.getSParameters([midFreq]);
      v = cMul(v, sp.s21[0] ?? cnum(1));
      voltages.set(comp.id, v);
    }
    return voltages;
  }

  // ── Public utility methods (used by SimulationResults) ────────────────────
  calculateVSWR(s11: Complex): number {
    const mag = Math.min(0.999, Math.max(0, ComplexMath.magnitude(s11)));
    return mag >= 0.999 ? 100 : (1 + mag) / (1 - mag);
  }

  calculateReturnLoss(s11: Complex): number {
    const mag = ComplexMath.magnitude(s11);
    return mag === 0 ? Infinity : -20 * Math.log10(mag);
  }

  calculateInsertionLoss(s21: Complex): number {
    const mag = ComplexMath.magnitude(s21);
    return mag === 0 ? Infinity : -20 * Math.log10(mag);
  }

  calculateGain(s21: Complex): number {
    const mag = ComplexMath.magnitude(s21);
    return mag === 0 ? -Infinity : 20 * Math.log10(mag);
  }

  calculateSmithChart(sparameters: SParameters): { real: number[]; imag: number[] } {
    const real: number[] = [];
    const imag: number[] = [];
    sparameters.s11.forEach(s11 => {
      const num = cAdd(cnum(1), s11);
      const den = cSub(cnum(1), s11);
      const z = cDiv(num, den);
      real.push(z.real);
      imag.push(z.imag);
    });
    return { real, imag };
  }
}
