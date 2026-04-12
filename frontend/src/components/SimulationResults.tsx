import { useState, useEffect } from 'react';
import { SimulationResult } from '../simulation/RFSimulator';
import { ComplexMath } from '../models/Component';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { analyzeSimulationWithAI, analyzeSimulationWithGemini, AIAnalysisResult, Anomaly } from '../services/simulationAIService';
import './SimulationResults.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SimulationResultsProps {
  results: SimulationResult | null;
  onClose: () => void;
}

export default function SimulationResults({ results, onClose }: SimulationResultsProps) {
  const [aiAnalysis, setAiAnalysis]       = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiError, setAiError]             = useState<string | null>(null);
  const [aiExpanded, setAiExpanded]       = useState(true);

  const handlePrint = () => {
    window.print();
  };

  // Auto-run local analysis when results arrive
  useEffect(() => {
    if (results?.success) {
      analyzeSimulationWithAI(results)
        .then(a => { setAiAnalysis(a); setAiExpanded(true); })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  if (!results) return null;

  const handleRunAIAnalysis = async () => {
    if (!results.success) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const analysis = await analyzeSimulationWithAI(results);
      setAiAnalysis(analysis);
      setAiExpanded(true);
    } catch (e: any) {
      setAiError(e.message || 'Analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunGemini = async () => {
    if (!results.success) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const analysis = await analyzeSimulationWithGemini(results);
      setAiAnalysis(analysis);
      setAiExpanded(true);
    } catch (e: any) {
      setAiError(e.message || 'Gemini analysis failed — quota may be exceeded');
    } finally {
      setAiLoading(false);
    }
  };

  const severityIcon = (s: Anomaly['severity']) =>
    s === 'critical' ? '🔴' : s === 'warning' ? '🟡' : 'ℹ️';
  const severityClass = (s: Anomaly['severity']) =>
    s === 'critical' ? 'anomaly-critical' : s === 'warning' ? 'anomaly-warning' : 'anomaly-info';

  // ─── Inline metric status helpers ───────────────────────────────────────────
  type StatusLevel = 'pass' | 'warn' | 'fail';

  // Given a parameter name, find the worst anomaly for it from analysis
  const getParamStatus = (paramKey: string): StatusLevel => {
    if (!aiAnalysis) return 'pass';
    const match = aiAnalysis.anomalies.find(a =>
      a.parameter.toLowerCase().includes(paramKey.toLowerCase())
    );
    if (!match) return 'pass';
    return match.severity === 'critical' ? 'fail' : 'warn';
  };

  // Inline status badge component
  const StatusTag = ({ status, tooltip }: { status: StatusLevel; tooltip?: string }) => {
    if (status === 'pass') return <span className="metric-tag tag-pass" title={tooltip || 'Within expected range'}>✓ OK</span>;
    if (status === 'warn') return <span className="metric-tag tag-warn" title={tooltip || 'Marginal — check this value'}>⚠ Marginal</span>;
    return <span className="metric-tag tag-fail" title={tooltip || 'Outside acceptable range for lab experiment'}>✗ Flag</span>;
  };

  // Get the explanation text for a flagged param
  const getParamNote = (paramKey: string): string => {
    if (!aiAnalysis) return '';
    const match = aiAnalysis.anomalies.find(a =>
      a.parameter.toLowerCase().includes(paramKey.toLowerCase())
    );
    return match ? match.explanation : '';
  };

  // Result item with inline status badge
  const MetricRow = ({
    label, value, paramKey, className = ''
  }: { label: string; value: string; paramKey: string; className?: string }) => {
    const status  = getParamStatus(paramKey);
    const note    = getParamNote(paramKey);
    return (
      <div className={`result-item result-item-flagged status-${status} ${className}`}>
        <span className="label">{label}</span>
        <span className="value-with-tag">
          <span className="value">{value}</span>
          <StatusTag status={status} tooltip={note || undefined} />
          {note && <span className="metric-note">{note}</span>}
        </span>
      </div>
    );
  };

  const formatPower = (power: number): string => {
    return `${power.toFixed(2)} dBm`;
  };

  const formatComplex = (c: { real: number; imag: number }): string => {
    const mag = ComplexMath.magnitude(c);
    const phase = (ComplexMath.phase(c) * 180) / Math.PI;
    return `${mag.toFixed(3)} ∠ ${phase.toFixed(1)}°`;
  };

  const calculateReturnLoss = (s11: { real: number; imag: number }): number => {
    const mag = ComplexMath.magnitude(s11);
    if (mag === 0) return Infinity;
    return -20 * Math.log10(mag);
  };

  const calculateInsertionLoss = (s21: { real: number; imag: number }): number => {
    const mag = ComplexMath.magnitude(s21);
    if (mag === 0) return Infinity;
    return -20 * Math.log10(mag);
  };

  const calculateGain = (s21: { real: number; imag: number }): number => {
    const mag = ComplexMath.magnitude(s21);
    if (mag === 0) return -Infinity;
    return 20 * Math.log10(mag);
  };

  const calculateVSWR = (s11: { real: number; imag: number }): number => {
    const mag = ComplexMath.magnitude(s11);
    const clampedMag = Math.min(0.999, Math.max(0, mag));
    
    if (clampedMag >= 0.999) {
      return 100;
    }
    
    return (1 + clampedMag) / (1 - clampedMag);
  };

  const calculateGroupDelay = (phases: number[], frequencies: number[]): number[] => {
    const groupDelay: number[] = [];
    for (let i = 1; i < phases.length - 1; i++) {
      const dPhase = phases[i + 1] - phases[i - 1];
      const dFreq = frequencies[i + 1] - frequencies[i - 1];
      groupDelay.push(-dPhase / (2 * Math.PI * dFreq) * 1e9); // in nanoseconds
    }
    return groupDelay;
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!results.success || results.frequencies.length === 0) return null;

    const freqGHz = results.frequencies.map(f => f / 1e9);
    
    // S-parameter magnitudes in dB
    const s11_dB = results.sparameters.s11.map(s => 20 * Math.log10(ComplexMath.magnitude(s)));
    const s21_dB = results.sparameters.s21.map(s => 20 * Math.log10(ComplexMath.magnitude(s)));
    const s12_dB = results.sparameters.s12.map(s => 20 * Math.log10(ComplexMath.magnitude(s)));
    const s22_dB = results.sparameters.s22.map(s => 20 * Math.log10(ComplexMath.magnitude(s)));

    // S-parameter phases in degrees
    const s11_phase = results.sparameters.s11.map(s => ComplexMath.phase(s) * 180 / Math.PI);
    const s21_phase = results.sparameters.s21.map(s => ComplexMath.phase(s) * 180 / Math.PI);
    const s12_phase = results.sparameters.s12.map(s => ComplexMath.phase(s) * 180 / Math.PI);
    const s22_phase = results.sparameters.s22.map(s => ComplexMath.phase(s) * 180 / Math.PI);

    // VSWR
    const vswr = results.sparameters.s11.map(s => calculateVSWR(s));

    // Return Loss
    const returnLoss = results.sparameters.s11.map(s => calculateReturnLoss(s));

    // Group Delay
    const groupDelay = calculateGroupDelay(s21_phase, results.frequencies);

    // Smith Chart data (normalized impedance)
    const smithData = results.sparameters.s11.map(s11 => {
      const gamma = s11;
      // Z = Z0 * (1 + Γ) / (1 - Γ)
      const numerator = ComplexMath.add({ real: 1, imag: 0 }, gamma);
      const denominator = ComplexMath.subtract({ real: 1, imag: 0 }, gamma);
      const z_norm = ComplexMath.divide(numerator, denominator);
      return { x: z_norm.real, y: z_norm.imag };
    });

    return {
      freqGHz,
      s11_dB,
      s21_dB,
      s12_dB,
      s22_dB,
      s11_phase,
      s21_phase,
      s12_phase,
      s22_phase,
      vswr,
      returnLoss,
      groupDelay,
      smithData,
    };
  };

  const chartData = prepareChartData();

  // Use mid-frequency for summary (only if success)
  let midIdx, midFreq, s11_mid, s21_mid, s12_mid, s22_mid, totalGain, insertionLoss, returnLoss, vswr;
  
  if (results.success && results.frequencies.length > 0) {
    midIdx = Math.floor(results.frequencies.length / 2);
    midFreq = results.frequencies[midIdx];
    s11_mid = results.sparameters.s11[midIdx];
    s21_mid = results.sparameters.s21[midIdx];
    s12_mid = results.sparameters.s12[midIdx];
    s22_mid = results.sparameters.s22[midIdx];

    totalGain = calculateGain(s21_mid);
    insertionLoss = calculateInsertionLoss(s21_mid);
    returnLoss = calculateReturnLoss(s11_mid);
    vswr = calculateVSWR(s11_mid);
  }

  // Chart options
  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Frequency (GHz)',
        },
      },
    },
  };

  return (
    <div className="simulation-results-overlay">
      <div className="simulation-results">
        <div className="results-header">
          <h2>Simulation Results</h2>
          <div className="results-header-actions">
            {results.success && (
              <button
                onClick={handleRunAIAnalysis}
                className="btn-ai-analyze"
                disabled={aiLoading}
                title="Instant local RF analysis — no API quota needed"
              >
                {aiLoading ? '⏳ Analyzing...' : '📡 RF Analysis'}
              </button>
            )}
            <button onClick={onClose} className="btn-close">×</button>
          </div>
        </div>

        {/* ── AI Analysis Panel ─────────────────────────────────────────── */}
        {(aiAnalysis || aiLoading || aiError) && (
          <div className="ai-analysis-panel">
          <div className="ai-panel-header" onClick={() => setAiExpanded(e => !e)}>
              <span>
                {aiAnalysis?.analysisMode === 'ai' ? '🤖 Gemini AI Analysis' : '📡 RF Analysis Engine'}
                {aiAnalysis && (
                  <span className={`ai-mode-badge ${aiAnalysis.analysisMode === 'ai' ? 'mode-ai' : 'mode-local'}`}>
                    {aiAnalysis.analysisMode === 'ai' ? 'Gemini Enhanced' : 'Local · No quota'}
                  </span>
                )}
              </span>
              <span className="ai-panel-toggle">{aiExpanded ? '▲' : '▼'}</span>
            </div>

            {aiLoading && (
              <div className="ai-loading">
                <div className="ai-spinner"></div>
                <p>Analyzing simulation results with Gemini AI...</p>
              </div>
            )}

            {aiError && (
              <div className="ai-error">❌ {aiError}</div>
            )}

            {aiAnalysis && aiExpanded && (
              <div className="ai-analysis-body">

                {/* Summary */}
                <div className="ai-summary">
                  <h4>📋 Circuit Behavior</h4>
                  <p>{aiAnalysis.summary}</p>
                  <p className="ai-detail-text">{aiAnalysis.circuitBehavior}</p>
                </div>

                {/* Pass / Fail */}
                {aiAnalysis.passFail?.length > 0 && (
                  <div className="ai-section">
                    <h4>✅ Pass / Fail Checklist</h4>
                    <div className="passfail-grid">
                      {aiAnalysis.passFail.map((pf, i) => (
                        <div key={i} className={`passfail-item ${pf.pass ? 'pf-pass' : 'pf-fail'}`}>
                          <span className="pf-icon">{pf.pass ? '✅' : '❌'}</span>
                          <div>
                            <strong>{pf.label}</strong>
                            <span className="pf-detail">{pf.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anomalies */}
                {aiAnalysis.anomalies?.length > 0 && (
                  <div className="ai-section">
                    <h4>⚠️ Detected Anomalies</h4>
                    <div className="anomaly-list">
                      {aiAnalysis.anomalies.map(a => (
                        <div key={a.id} className={`anomaly-card ${severityClass(a.severity)}`}>
                          <div className="anomaly-header">
                            <span>{severityIcon(a.severity)} <strong>{a.parameter}</strong></span>
                            <span className={`anomaly-badge badge-${a.severity}`}>{a.severity.toUpperCase()}</span>
                          </div>
                          <div className="anomaly-values">
                            <span><em>Measured:</em> {a.measured}</span>
                            <span><em>Expected:</em> {a.expected}</span>
                          </div>
                          <p className="anomaly-explanation">{a.explanation}</p>
                          <p className="anomaly-rec">💡 {a.recommendation}</p>
                          {a.suggestedAdjustment && a.suggestedAdjustment.componentType !== "null" && (
                            <div className="anomaly-adjustment-hint">
                              <strong>🛠️ Targeted Fix:</strong>{' '}
                              {a.suggestedAdjustment.direction} <code>{a.suggestedAdjustment.parameterName}</code> on the <strong>{a.suggestedAdjustment.componentType}</strong>.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab Correlation */}
                {aiAnalysis.labCorrelation && (
                  <div className="ai-section ai-lab-note">
                    <h4>🔬 Lab Hardware Correlation</h4>
                    <p>{aiAnalysis.labCorrelation}</p>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.recommendations?.length > 0 && (
                  <div className="ai-section">
                    <h4>🛠️ Recommendations</h4>
                    <ul className="ai-recs">
                      {aiAnalysis.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis?.analysisMode === 'local' && (
                  <div className="ai-section ai-gemini-upgrade">
                    <span>✨ Want deeper natural-language explanation?</span>
                    <button
                      className="btn-try-gemini"
                      onClick={handleRunGemini}
                      disabled={aiLoading}
                    >
                      {aiLoading ? '⏳...' : '🤖 Try Gemini (may be unavailable)'}
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {!results.success && (
          <div className="results-errors">
            <h3>Errors</h3>
            {results.errors.map((error, idx) => (
              <div key={idx} className="error-item">❌ {error}</div>
            ))}
          </div>
        )}

        {results.warnings.length > 0 && (
          <div className="results-warnings">
            <h3>Warnings</h3>
            {results.warnings.map((warning, idx) => (
              <div key={idx} className="warning-item">⚠️ {warning}</div>
            ))}
          </div>
        )}

        {results.success && chartData && (
          <>
            <div className="results-section">
              <h3>Frequency Analysis</h3>
              <div className="results-grid">
                <div className="result-item">
                  <span className="label">Frequency Range:</span>
                  <span className="value">
                    {(results.frequencies[0] / 1e9).toFixed(2)} - {(results.frequencies[results.frequencies.length - 1] / 1e9).toFixed(2)} GHz
                  </span>
                </div>
                <div className="result-item">
                  <span className="label">Center Frequency:</span>
                  <span className="value">{(midFreq / 1e9).toFixed(3)} GHz</span>
                </div>
                <div className="result-item">
                  <span className="label">Points:</span>
                  <span className="value">{results.frequencies.length}</span>
                </div>
              </div>
            </div>

            <div className="results-section">
              <h3>S-Parameters (at {(midFreq / 1e9).toFixed(2)} GHz)</h3>
              <div className="results-grid">

                <MetricRow
                  label="S11 (Input Reflection):"
                  value={formatComplex(s11_mid)}
                  paramKey="S11"
                />
                <MetricRow
                  label="S21 (Forward Transmission):"
                  value={formatComplex(s21_mid)}
                  paramKey="S21"
                />
                <MetricRow
                  label="S12 (Reverse Transmission):"
                  value={formatComplex(s12_mid)}
                  paramKey="S12"
                />
                <MetricRow
                  label="S22 (Output Reflection):"
                  value={formatComplex(s22_mid)}
                  paramKey="S22"
                />
                <MetricRow
                  label="Return Loss:"
                  value={isFinite(returnLoss) ? `${returnLoss.toFixed(2)} dB` : '∞ dB (Perfect)'}
                  paramKey="Return Loss"
                />
                <MetricRow
                  label="Insertion Loss:"
                  value={isFinite(insertionLoss) ? `${insertionLoss.toFixed(2)} dB` : '∞ dB'}
                  paramKey="S21"
                />
                <MetricRow
                  label="VSWR:"
                  value={`${vswr.toFixed(2)}:1`}
                  paramKey="VSWR"
                />

              </div>
              <div className="chart-note" style={{ marginTop: '12px' }}>
                <strong>Match Quality Guide:</strong> Perfect (∞ dB) • Excellent (&gt;20 dB) • Very Good (15-20 dB) • Good (10-15 dB) • Fair (6-10 dB) • Poor (&lt;6 dB)
              </div>
              {aiAnalysis && aiAnalysis.anomalies.length === 0 && (
                <div className="all-clear-banner">✅ All S-parameter metrics are within expected experimental bounds.</div>
              )}
            </div>

            {/* Port Power Analysis */}
            <div className="results-section">
              <h3>⚡ Port Power Analysis (at {(midFreq / 1e9).toFixed(2)} GHz)</h3>
              <div className="port-power-analysis">
                <div className="port-power-card">
                  <h4>Port 1 (Input)</h4>
                  <div className="port-power-details">
                    <div className="power-detail-item">
                      <span className="detail-label">Incident Power (a₁):</span>
                      <span className="detail-value">0.00 dBm (reference)</span>
                    </div>
                    <div className="power-detail-item">
                      <span className="detail-label">Reflected Power (b₁):</span>
                      <span className="detail-value">
                        {(() => {
                          const s11_mag = ComplexMath.magnitude(s11_mid);
                          const reflected_power = 0 + 20 * Math.log10(s11_mag);
                          return isFinite(reflected_power) ? `${reflected_power.toFixed(2)} dBm` : '-∞ dBm';
                        })()}
                      </span>
                    </div>
                    <div className="power-detail-item">
                      <span className="detail-label">Reflection Coefficient (|S11|):</span>
                      <span className="detail-value">{ComplexMath.magnitude(s11_mid).toFixed(4)}</span>
                    </div>
                    <div className="power-detail-item">
                      <span className="detail-label">Power Delivered to Network:</span>
                      <span className="detail-value">
                        {(() => {
                          const s11_mag = ComplexMath.magnitude(s11_mid);
                          const delivered = 10 * Math.log10(1 - s11_mag * s11_mag);
                          return isFinite(delivered) ? `${delivered.toFixed(2)} dB` : '0.00 dB';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="port-power-card">
                  <h4>Port 2 (Output)</h4>
                  <div className="port-power-details">
                    <div className="power-detail-item">
                      <span className="detail-label">Transmitted Power (b₂):</span>
                      <span className="detail-value">
                        {(() => {
                          const s21_mag = ComplexMath.magnitude(s21_mid);
                          const transmitted_power = 0 + 20 * Math.log10(s21_mag);
                          return isFinite(transmitted_power) ? `${transmitted_power.toFixed(2)} dBm` : '-∞ dBm';
                        })()}
                      </span>
                    </div>
                    <div className="power-detail-item">
                      <span className="detail-label">Transmission Coefficient (|S21|):</span>
                      <span className="detail-value">{ComplexMath.magnitude(s21_mid).toFixed(4)}</span>
                    </div>
                    <div className="power-detail-item">
                      <span className="detail-label">Output Reflection (|S22|):</span>
                      <span className="detail-value">{ComplexMath.magnitude(s22_mid).toFixed(4)}</span>
                    </div>
                    <div className="power-detail-item">
                      <span className="detail-label">Available Output Power:</span>
                      <span className="detail-value">
                        {(() => {
                          const s21_mag = ComplexMath.magnitude(s21_mid);
                          const s22_mag = ComplexMath.magnitude(s22_mid);
                          const available = 0 + 20 * Math.log10(s21_mag) - 10 * Math.log10(1 - s22_mag * s22_mag);
                          return isFinite(available) ? `${available.toFixed(2)} dBm` : '-∞ dBm';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="port-power-card">
                  <h4>Reverse Path Analysis</h4>
                  <div className="port-power-details">
                    <div className={`power-detail-item ${
                      getParamStatus('Reciprocity') !== 'pass' ? 'flagged-detail-' + getParamStatus('Reciprocity') : ''
                    }`}>
                      <span className="detail-label">Reverse Transmission (|S12|):</span>
                      <span className="detail-value">
                        {ComplexMath.magnitude(s12_mid).toFixed(4)}
                        {getParamStatus('Reciprocity') !== 'pass' && (
                          <span className={`metric-tag tag-${getParamStatus('Reciprocity')}`} style={{marginLeft:8}}>
                            {getParamStatus('Reciprocity') === 'fail' ? '✗ Flag' : '⚠ Marginal'}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="power-detail-item">
                      <span className="detail-label">Isolation (S12 in dB):</span>
                      <span className="detail-value">
                        {(() => {
                          const s12_mag = ComplexMath.magnitude(s12_mid);
                          const isolation = 20 * Math.log10(s12_mag);
                          return isFinite(isolation) ? `${isolation.toFixed(2)} dB` : '-∞ dB';
                        })()}
                      </span>
                    </div>
                    <div className={`power-detail-item ${
                      getParamStatus('Reciprocity') !== 'pass' ? 'flagged-detail-' + getParamStatus('Reciprocity') : ''
                    }`}>
                      <span className="detail-label">Reciprocity Check:</span>
                      <span className="detail-value">
                        {(() => {
                          const s12_mag = ComplexMath.magnitude(s12_mid);
                          const s21_mag = ComplexMath.magnitude(s21_mid);
                          const diff = Math.abs(s12_mag - s21_mag);
                          return diff < 0.01 ? '✓ Reciprocal' : '✗ Non-reciprocal';
                        })()}
                        {getParamStatus('Reciprocity') !== 'pass' && (
                          <StatusTag status={getParamStatus('Reciprocity')} tooltip={getParamNote('Reciprocity')} />
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="port-power-note">
                  <strong>Power Relationships:</strong>
                  <ul>
                    <li><strong>b₁ = S11 × a₁</strong> (reflected power at input)</li>
                    <li><strong>b₂ = S21 × a₁</strong> (transmitted power to output)</li>
                    <li><strong>Power Delivered = |a₁|² × (1 - |S11|²)</strong></li>
                    <li><strong>Transducer Gain = |S21|² / (1 - |S11|²)</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* S-Parameter Magnitude Plot */}
            <div className="results-section">
              <h3>📊 S-Parameter Magnitude vs Frequency</h3>
              <div className="chart-container">
                <Line
                  data={{
                    labels: chartData.freqGHz,
                    datasets: [
                      {
                        label: 'S11 (dB)',
                        data: chartData.s11_dB,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        tension: 0.1,
                      },
                      {
                        label: 'S21 (dB)',
                        data: chartData.s21_dB,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        tension: 0.1,
                      },
                      {
                        label: 'S12 (dB)',
                        data: chartData.s12_dB,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        tension: 0.1,
                      },
                      {
                        label: 'S22 (dB)',
                        data: chartData.s22_dB,
                        borderColor: 'rgb(255, 206, 86)',
                        backgroundColor: 'rgba(255, 206, 86, 0.5)',
                        tension: 0.1,
                      },
                    ],
                  }}
                  options={{
                    ...commonOptions,
                    scales: {
                      ...commonOptions.scales,
                      y: {
                        title: {
                          display: true,
                          text: 'Magnitude (dB)',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* S-Parameter Phase Plot */}
            <div className="results-section">
              <h3>📐 S-Parameter Phase vs Frequency</h3>
              <div className="chart-container">
                <Line
                  data={{
                    labels: chartData.freqGHz,
                    datasets: [
                      {
                        label: 'S11 Phase (°)',
                        data: chartData.s11_phase,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        tension: 0.1,
                      },
                      {
                        label: 'S21 Phase (°)',
                        data: chartData.s21_phase,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        tension: 0.1,
                      },
                    ],
                  }}
                  options={{
                    ...commonOptions,
                    scales: {
                      ...commonOptions.scales,
                      y: {
                        title: {
                          display: true,
                          text: 'Phase (degrees)',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* VSWR Plot */}
            <div className="results-section">
              <h3>⚡ VSWR vs Frequency</h3>
              <div className="chart-container">
                <Line
                  data={{
                    labels: chartData.freqGHz,
                    datasets: [
                      {
                        label: 'VSWR',
                        data: chartData.vswr,
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgba(153, 102, 255, 0.5)',
                        tension: 0.1,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    ...commonOptions,
                    scales: {
                      ...commonOptions.scales,
                      y: {
                        title: {
                          display: true,
                          text: 'VSWR',
                        },
                        min: 1,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-note">
                <strong>Note:</strong> VSWR &lt; 2:1 is generally considered good match
              </div>
            </div>

            {/* Return Loss Plot */}
            <div className="results-section">
              <h3>🎯 Return Loss vs Frequency</h3>
              <div className="chart-container">
                <Line
                  data={{
                    labels: chartData.freqGHz,
                    datasets: [
                      {
                        label: 'Return Loss (dB)',
                        data: chartData.returnLoss,
                        borderColor: 'rgb(255, 159, 64)',
                        backgroundColor: 'rgba(255, 159, 64, 0.5)',
                        tension: 0.1,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    ...commonOptions,
                    scales: {
                      ...commonOptions.scales,
                      y: {
                        title: {
                          display: true,
                          text: 'Return Loss (dB)',
                        },
                        reverse: false,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-note">
                <strong>Note:</strong> Higher return loss = better match (&gt;10 dB is good, &gt;20 dB is excellent)
              </div>
            </div>

            {/* Group Delay Plot */}
            {chartData.groupDelay.length > 0 && (
              <div className="results-section">
                <h3>⏱️ Group Delay vs Frequency</h3>
                <div className="chart-container">
                  <Line
                    data={{
                      labels: chartData.freqGHz.slice(1, -1),
                      datasets: [
                        {
                          label: 'Group Delay (ns)',
                          data: chartData.groupDelay,
                          borderColor: 'rgb(201, 203, 207)',
                          backgroundColor: 'rgba(201, 203, 207, 0.5)',
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={{
                      ...commonOptions,
                      scales: {
                        ...commonOptions.scales,
                        y: {
                          title: {
                            display: true,
                            text: 'Group Delay (ns)',
                          },
                        },
                      },
                    }}
                  />
                </div>
                <div className="chart-note">
                  <strong>Note:</strong> Flat group delay indicates non-dispersive transmission
                </div>
              </div>
            )}

            {/* Smith Chart */}
            <div className="results-section">
              <h3>🎯 Smith Chart (Input Impedance)</h3>
              <div className="chart-container smith-chart-container">
                <Scatter
                  data={{
                    datasets: [
                      {
                        label: 'S11 Trajectory',
                        data: chartData.smithData,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgb(102, 126, 234)',
                        showLine: true,
                        pointRadius: 3,
                      },
                      {
                        label: 'Center (50Ω)',
                        data: [{ x: 0, y: 0 }],
                        backgroundColor: 'rgba(255, 0, 0, 1)',
                        pointRadius: 6,
                        pointStyle: 'cross',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Normalized Impedance (Z/Z0)',
                      },
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Real Part',
                        },
                        min: -2,
                        max: 2,
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Imaginary Part',
                        },
                        min: -2,
                        max: 2,
                      },
                    },
                  }}
                />
              </div>
              <div className="chart-note">
                <strong>Note:</strong> Points near center (0,0) indicate good 50Ω match
              </div>
            </div>

            <div className="results-section">
              <h3>Power Levels</h3>
              <div className="power-list">
                {Array.from(results.powerLevels.entries()).map(([id, power]) => {
                  // Calculate bar width: map -30 dBm to 0%, +30 dBm to 100%
                  const minPower = -30;
                  const maxPower = 30;
                  const barWidth = Math.min(100, Math.max(0, ((power - minPower) / (maxPower - minPower)) * 100));
                  
                  return (
                    <div key={id} className="power-item">
                      <span className="component-id">{id.split('_')[0]}</span>
                      <span className="power-value">{formatPower(power)}</span>
                      <div className="power-bar">
                        <div 
                          className="power-fill" 
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="power-range">-30 dBm ← 0 dBm → +30 dBm</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="results-section">
              <h3>Performance Summary</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">📊</div>
                  <div className="card-content">
                    <div className="card-label">Total Gain</div>
                    <div className="card-value">
                      {isFinite(totalGain) 
                        ? `${totalGain > 0 ? '+' : ''}${totalGain.toFixed(2)} dB`
                        : totalGain === Infinity ? '+∞ dB' : '-∞ dB'
                      }
                    </div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon">🎯</div>
                  <div className="card-content">
                    <div className="card-label">Match Quality</div>
                    <div className="card-value">
                      {(() => {
                        if (!isFinite(returnLoss)) return 'Perfect';
                        if (returnLoss > 20) return 'Excellent';
                        if (returnLoss > 15) return 'Very Good';
                        if (returnLoss > 10) return 'Good';
                        if (returnLoss > 6) return 'Fair';
                        return 'Poor';
                      })()}
                    </div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-icon">⚡</div>
                  <div className="card-content">
                    <div className="card-label">VSWR</div>
                    <div className="card-value">
                      {vswr.toFixed(2)}:1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="results-footer">
          <button onClick={handlePrint} className="btn-secondary btn-print">🖨️ Export Lab Report</button>
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    </div>
  );
}
