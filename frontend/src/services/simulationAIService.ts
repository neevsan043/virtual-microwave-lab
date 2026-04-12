/**
 * simulationAIService.ts
 *
 * Local rule-based RF analysis engine — works 100% offline, no API quota.
 * Applies real RF engineering rules to the simulation results and returns
 * the same structured format as the Gemini-based service.
 *
 * Optional: Gemini enhanced analysis via the backend (if quota available).
 */

import { SimulationResult } from '../simulation/RFSimulator';
import { ComplexMath } from '../models/Component';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type AnomalySeverity = 'critical' | 'warning' | 'info';

export interface Anomaly {
  id: string;
  parameter: string;
  severity: AnomalySeverity;
  measured: string;
  expected: string;
  explanation: string;
  recommendation: string;
}

export interface AIAnalysisResult {
  summary: string;
  circuitBehavior: string;
  anomalies: Anomaly[];
  recommendations: string[];
  labCorrelation: string;
  passFail: { label: string; pass: boolean; detail: string }[];
  analysisMode: 'local' | 'ai';
}

// ─── Helper: extract key metrics at mid-frequency ────────────────────────────

interface Metrics {
  f_GHz: number;
  s11_dB: number;
  s21_dB: number;
  s12_dB: number;
  s22_dB: number;
  s11_mag: number;
  s21_mag: number;
  s12_mag: number;
  s22_mag: number;
  vswr: number;
  returnLoss: number;
  groupDelay_ns: number;
  reciprocityDiff_dB: number;
  isReciprocal: boolean;
  passiveExpected: boolean;
}

function extractMetrics(result: SimulationResult): Metrics {
  const mid  = Math.floor(result.frequencies.length / 2);
  const freq = result.frequencies;

  const s11 = result.sparameters.s11[mid];
  const s21 = result.sparameters.s21[mid];
  const s12 = result.sparameters.s12[mid];
  const s22 = result.sparameters.s22[mid];

  const s11_mag = ComplexMath.magnitude(s11);
  const s21_mag = ComplexMath.magnitude(s21);
  const s12_mag = ComplexMath.magnitude(s12);
  const s22_mag = ComplexMath.magnitude(s22);

  const toDb = (m: number) => 20 * Math.log10(Math.max(m, 1e-15));

  const mag11c = Math.min(0.999, s11_mag);
  const vswr   = (1 + mag11c) / (1 - mag11c);

  // Group delay: -dφ/dω at mid
  let groupDelay_ns = 0;
  if (freq.length >= 3) {
    const i  = mid;
    const f1 = freq[i - 1], f2 = freq[i + 1];
    const p1 = Math.atan2(result.sparameters.s21[i - 1].imag, result.sparameters.s21[i - 1].real);
    const p2 = Math.atan2(result.sparameters.s21[i + 1].imag, result.sparameters.s21[i + 1].real);
    groupDelay_ns = -((p2 - p1) / (2 * Math.PI * (f2 - f1))) * 1e9;
  }

  const reciprocityDiff_dB = Math.abs(toDb(s21_mag) - toDb(s12_mag));
  const passiveExpected = !result.componentOrder.some(
    c => c.includes('amplifier') || c.includes('hemt') || c.includes('vco') || c.includes('oscillator')
  );

  return {
    f_GHz: freq[mid] / 1e9,
    s11_dB: toDb(s11_mag), s21_dB: toDb(s21_mag),
    s12_dB: toDb(s12_mag), s22_dB: toDb(s22_mag),
    s11_mag, s21_mag, s12_mag, s22_mag,
    vswr, returnLoss: -toDb(s11_mag),
    groupDelay_ns, reciprocityDiff_dB,
    isReciprocal: reciprocityDiff_dB < 1.0,
    passiveExpected,
  };
}

// ─── Rule-based local analysis ────────────────────────────────────────────────

export function analyzeSimulationLocally(result: SimulationResult): AIAnalysisResult {
  const m        = extractMetrics(result);
  const path     = result.componentOrder.join(' → ') || '(empty)';
  const anomalies: Anomaly[] = [];
  const passFail: AIAnalysisResult['passFail'] = [];
  const recs: string[] = [];

  // ── Rule 1: Input match (S11 / Return Loss) ──────────────────────────────
  const rl = m.returnLoss;
  if (rl < 6) {
    anomalies.push({
      id: 'rl_critical',
      parameter: 'Return Loss (S11)',
      severity: 'critical',
      measured: `${rl.toFixed(1)} dB (|S11| = ${m.s11_mag.toFixed(3)})`,
      expected: '> 10 dB for good match, > 15 dB for lab-quality match',
      explanation:
        `Return loss of ${rl.toFixed(1)} dB means ${(m.s11_mag**2 * 100).toFixed(0)}% of input power is reflected back. ` +
        `In lab hardware this would damage the source and give completely wrong measurements. ` +
        `A properly matched 50 Ω circuit should show > 15 dB return loss.`,
      recommendation:
        'Check that all component impedances are set to 50 Ω, or add a matching network. Verify source and load are connected correctly.',
    });
    recs.push('Add an impedance matching network at the input port to improve return loss.');
  } else if (rl < 10) {
    anomalies.push({
      id: 'rl_warning',
      parameter: 'Return Loss (S11)',
      severity: 'warning',
      measured: `${rl.toFixed(1)} dB`,
      expected: '> 10 dB for acceptable match',
      explanation: `Return loss of ${rl.toFixed(1)} dB is marginal. Lab VNA typically requires > 10 dB for valid S-parameter measurements.`,
      recommendation: 'Improve impedance matching or review component parameters.',
    });
  }
  passFail.push({
    label: 'Input Match (S11)',
    pass: rl >= 10,
    detail: `Return loss = ${rl.toFixed(1)} dB (need > 10 dB)`,
  });

  // ── Rule 2: VSWR ─────────────────────────────────────────────────────────
  passFail.push({
    label: 'VSWR',
    pass: m.vswr <= 2.0,
    detail: `VSWR = ${m.vswr.toFixed(2)}:1 (need ≤ 2:1 for good match)`,
  });
  if (m.vswr > 5) {
    anomalies.push({
      id: 'vswr_high',
      parameter: 'VSWR',
      severity: 'critical',
      measured: `${m.vswr.toFixed(2)}:1`,
      expected: '< 2:1 for acceptable, < 1.5:1 for excellent',
      explanation:
        `VSWR of ${m.vswr.toFixed(2)} indicates severe impedance mismatch. ` +
        `On real hardware this causes large standing waves, power loss, and possible source damage.`,
      recommendation: 'Review all impedance values and connections. Check for open or short circuits.',
    });
  }

  // ── Rule 3: Insertion loss / gain plausibility ────────────────────────────
  const hasAmp = result.componentOrder.some(c => c.includes('amplifier') || c.includes('hemt'));
  const gainDB = m.s21_dB;

  if (hasAmp) {
    // Active circuit: should have gain
    if (gainDB < 0) {
      anomalies.push({
        id: 's21_no_gain',
        parameter: 'S21 (Forward Gain)',
        severity: 'warning',
        measured: `${gainDB.toFixed(1)} dB (loss, not gain)`,
        expected: '> 0 dB for amplifier circuits',
        explanation:
          'The circuit contains an amplifier but overall S21 shows loss. ' +
          'This may be because the amplifier bandwidth does not cover the simulation frequency range, ' +
          'or the gain is offset by other losses in the path.',
        recommendation:
          'Verify amplifier center frequency and bandwidth parameters match your simulation frequency range.',
      });
    }
    passFail.push({
      label: 'Amplifier Gain (S21)',
      pass: gainDB > 0,
      detail: `S21 = ${gainDB.toFixed(1)} dB`,
    });
  } else {
    // Passive circuit: should be lossy (S21 ≤ 0 dB)
    if (gainDB > 0.5) {
      anomalies.push({
        id: 's21_passive_gain',
        parameter: 'S21 (Forward Transmission)',
        severity: 'critical',
        measured: `${gainDB.toFixed(1)} dB (positive gain)`,
        expected: '≤ 0 dB — passive networks cannot amplify',
        explanation:
          `A passive circuit (no active components) is showing ${gainDB.toFixed(1)} dB of gain. ` +
          `This violates conservation of energy (passivity condition). ` +
          `In a real measurement this would never occur and indicates a modelling error.`,
        recommendation:
          'Check that S-parameter cascade is correctly computing the lossless network conditions. ' +
          'Verify component parameters do not have negative insertion loss.',
      });
    }
    passFail.push({
      label: 'Passivity Check (S21 ≤ 0 dB)',
      pass: gainDB <= 0.1,
      detail: `S21 = ${gainDB.toFixed(1)} dB`,
    });
  }

  // ── Rule 4: Lossless / passive unitary condition check ────────────────────
  if (m.passiveExpected) {
    // For lossless 2-port: |S11|² + |S21|² ≤ 1
    const powerSum = m.s11_mag ** 2 + m.s21_mag ** 2;
    if (powerSum > 1.05) {
      anomalies.push({
        id: 'power_conservation',
        parameter: 'Power Conservation |S11|² + |S21|²',
        severity: 'critical',
        measured: `${powerSum.toFixed(3)} (> 1 — energy created)`,
        expected: '≤ 1.0 (energy cannot be created)',
        explanation:
          `The sum |S11|² + |S21|² = ${powerSum.toFixed(3)} exceeds 1, which violates conservation of energy. ` +
          `This means the passive circuit is generating more power than is entering it — physically impossible.`,
        recommendation:
          'This is a simulation model error. Check component S-parameter models for incorrect gain values.',
      });
    }
    passFail.push({
      label: 'Energy Conservation',
      pass: powerSum <= 1.05,
      detail: `|S11|² + |S21|² = ${powerSum.toFixed(3)}`,
    });
  }

  // ── Rule 5: Reciprocity ────────────────────────────────────────────────────
  if (m.passiveExpected && !m.isReciprocal) {
    anomalies.push({
      id: 'reciprocity',
      parameter: 'Reciprocity |S21| vs |S12|',
      severity: 'warning',
      measured: `|S21| - |S12| = ${m.reciprocityDiff_dB.toFixed(2)} dB difference`,
      expected: '< 0.5 dB for passive reciprocal components',
      explanation:
        `Passive components (attenuators, filters, transmission lines) are reciprocal: |S21| = |S12|. ` +
        `A difference of ${m.reciprocityDiff_dB.toFixed(2)} dB suggests a non-reciprocal element ` +
        `(isolator/circulator) in the path, or a modelling issue.`,
      recommendation:
        'If no isolator or circulator is in the path, verify component S12 is correctly set equal to S21.',
    });
  }
  passFail.push({
    label: 'Reciprocity (|S21| = |S12|)',
    pass: m.isReciprocal || !m.passiveExpected,
    detail: `Δ = ${m.reciprocityDiff_dB.toFixed(2)} dB`,
  });

  // ── Rule 6: Output match (S22) ─────────────────────────────────────────────
  const s22_rl = -m.s22_dB;
  if (s22_rl < 8) {
    anomalies.push({
      id: 's22_match',
      parameter: 'Output Match (S22)',
      severity: 'warning',
      measured: `${s22_rl.toFixed(1)} dB return loss at port 2`,
      expected: '> 10 dB for good output match',
      explanation:
        'Poor output match causes measurement errors when connecting to another stage. ' +
        'In a test bench the spectrum analyzer or power meter input is typically 50 Ω; ' +
        'significant S22 causes ripple in the measured response.',
      recommendation: 'Add a 6 dB attenuator at the output to improve output match at the expense of 6 dB signal loss.',
    });
  }
  passFail.push({
    label: 'Output Match (S22)',
    pass: s22_rl >= 8,
    detail: `S22 return loss = ${s22_rl.toFixed(1)} dB`,
  });

  // ── Rule 7: Group delay ─────────────────────────────────────────────────────
  const gd = m.groupDelay_ns;
  if (Math.abs(gd) > 100) {
    anomalies.push({
      id: 'group_delay',
      parameter: 'Group Delay',
      severity: 'info',
      measured: `${gd.toFixed(2)} ns`,
      expected: '< 10 ns for typical bench-top RF path',
      explanation:
        `Group delay of ${gd.toFixed(2)} ns is very large. A 1 m coaxial cable adds ~5 ns; ` +
        `typical amplifiers add 0.1–3 ns. Values > 100 ns suggest a very narrow-band resonant element ` +
        `or a numerical phase-wrapping issue near the center frequency.`,
      recommendation:
        'Check that simulation frequency points are dense enough near steep phase transitions. Consider narrowing the bandwidth.',
    });
  } else if (gd < 0) {
    anomalies.push({
      id: 'negative_delay',
      parameter: 'Group Delay (negative)',
      severity: 'warning',
      measured: `${gd.toFixed(2)} ns`,
      expected: '> 0 ns for causal systems',
      explanation:
        `Negative group delay can occur near resonances in minimum-phase systems, but large negative values indicate non-physical behaviour. ` +
        `Real passive hardware cannot have negative group delay.`,
      recommendation:
        'Increase simulation frequency point density near the center frequency to reduce numerical phase-derivative errors.',
    });
  }

  // ── Build summary ──────────────────────────────────────────────────────────
  const qualWord = rl >= 15 ? 'excellent' : rl >= 10 ? 'good' : rl >= 6 ? 'marginal' : 'poor';
  const s21Word  = gainDB > 3 ? `${gainDB.toFixed(1)} dB gain` :
                   gainDB > -1 ? 'near-unity transmission' :
                   `${Math.abs(gainDB).toFixed(1)} dB insertion loss`;

  const summary =
    `The simulated circuit (${path}) shows ${s21Word} with ${qualWord} input match ` +
    `(return loss ${rl.toFixed(1)} dB, VSWR ${m.vswr.toFixed(2)}:1) at ${m.f_GHz.toFixed(3)} GHz. ` +
    `${anomalies.length === 0 ? 'No major anomalies detected — results are consistent with expected lab behaviour.' :
      `${anomalies.filter(a => a.severity === 'critical').length} critical and ${anomalies.filter(a => a.severity === 'warning').length} warning issues were found.`}`;

  const circuitBehavior =
    `At the center frequency (${m.f_GHz.toFixed(3)} GHz): ` +
    `S11 = ${m.s11_dB.toFixed(1)} dB, S21 = ${m.s21_dB.toFixed(1)} dB, ` +
    `S12 = ${m.s12_dB.toFixed(1)} dB, S22 = ${m.s22_dB.toFixed(1)} dB. ` +
    `Group delay ≈ ${gd.toFixed(2)} ns. ` +
    (m.passiveExpected
      ? `This is a passive circuit; all S21 values should be ≤ 0 dB and |S21| ≈ |S12| (reciprocity). `
      : `This circuit includes active components; forward gain (S21 > 0 dB) is expected. `) +
    `The ABCD-matrix cascade method was used to chain component S-parameters.`;

  // Standard recs
  if (recs.length === 0) recs.push('Results look physically reasonable — run a hardware experiment to compare.');
  if (m.vswr > 2) recs.push('Use a vector network analyzer (VNA) in the lab to verify the input VSWR matches simulation.');
  recs.push('Compare S21 magnitude vs frequency plot shape with lab sweep data on a spectrum analyzer.');
  recs.push('Verify component parameter values (gain, attenuation, center frequency) match the actual hardware spec sheets.');

  const labCorrelation =
    `In a real microwave lab at ${m.f_GHz.toFixed(1)} GHz: ` +
    `you would measure S-parameters on a VNA calibrated with an SOLT (Short-Open-Load-Thru) kit. ` +
    `Expected return loss for a well-designed 50 Ω chain is > 15 dB. ` +
    `Insertion loss for passive components should closely match the manufacturer's datasheet. ` +
    `Group delay can be verified with the VNA's phase measurement mode. ` +
    `If lab results differ significantly from simulation, check: connector torque (6 inch-lb for SMA), ` +
    `cable quality, and whether the VNA port-extension is set correctly.`;

  return {
    summary,
    circuitBehavior,
    anomalies,
    recommendations: recs,
    labCorrelation,
    passFail,
    analysisMode: 'local',
  };
}

// ─── Text summary for Gemini (backend route) ─────────────────────────────────

function buildResultsSummary(result: SimulationResult): string {
  const m       = extractMetrics(result);
  const f_start = (result.frequencies[0] / 1e9).toFixed(2);
  const f_stop  = (result.frequencies[result.frequencies.length - 1] / 1e9).toFixed(2);
  return `
Frequency range: ${f_start} – ${f_stop} GHz (${result.frequencies.length} points)
Signal path: ${result.componentOrder.join(' → ') || '(no DUT)'}
At center frequency (${m.f_GHz.toFixed(3)} GHz):
  S11 = ${m.s11_mag.toFixed(4)} (${m.s11_dB.toFixed(2)} dB)
  S21 = ${m.s21_mag.toFixed(4)} (${m.s21_dB.toFixed(2)} dB)
  S12 = ${m.s12_mag.toFixed(4)} (${m.s12_dB.toFixed(2)} dB)
  S22 = ${m.s22_mag.toFixed(4)} (${m.s22_dB.toFixed(2)} dB)
  Return Loss = ${m.returnLoss.toFixed(2)} dB
  VSWR = ${m.vswr.toFixed(2)}:1
  Group Delay ≈ ${m.groupDelay_ns.toFixed(2)} ns
Warnings: ${result.warnings.join('; ') || 'none'}
`.trim();
}

// ─── Optional: Gemini enhanced analysis via backend ───────────────────────────

export async function analyzeSimulationWithAI(
  result: SimulationResult
): Promise<AIAnalysisResult> {
  // Always run local analysis first — instant and no quota
  const localResult = analyzeSimulationLocally(result);
  return localResult;
}

/** Call this if you want to try the Gemini enhanced version (may fail due to quota) */
export async function analyzeSimulationWithGemini(
  result: SimulationResult
): Promise<AIAnalysisResult> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('You must be logged in to use Gemini analysis.');

  const summary  = buildResultsSummary(result);
  const response = await fetch(`${API_URL}/ai/analyze-simulation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ summary }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Server error ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.analysis) throw new Error('Invalid response from AI analysis server');
  return { ...(data.analysis as AIAnalysisResult), analysisMode: 'ai' };
}
