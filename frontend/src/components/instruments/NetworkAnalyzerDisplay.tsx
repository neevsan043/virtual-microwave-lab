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
} from 'chart.js';
import { SParameters } from '../../types';
import { ComplexMath } from '../../models/Component';
import './InstrumentDisplay.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface NetworkAnalyzerDisplayProps {
  sparameters: SParameters;
  displayMode: 'magnitude' | 'phase' | 'smith';
}

export default function NetworkAnalyzerDisplay({ sparameters, displayMode }: NetworkAnalyzerDisplayProps) {
  const frequencies = sparameters.frequency.map(f => (f / 1e9).toFixed(3));

  // Calculate magnitude in dB
  const s11_dB = sparameters.s11.map(s => 20 * Math.log10(ComplexMath.magnitude(s)));
  const s21_dB = sparameters.s21.map(s => 20 * Math.log10(ComplexMath.magnitude(s)));

  // Calculate phase in degrees
  const s11_phase = sparameters.s11.map(s => (ComplexMath.phase(s) * 180) / Math.PI);
  const s21_phase = sparameters.s21.map(s => (ComplexMath.phase(s) * 180) / Math.PI);

  // Smith Chart data
  const smithData = sparameters.s11.map(s11 => {
    // Convert S11 to reflection coefficient
    const gamma = s11;
    return { x: gamma.real, y: gamma.imag };
  });

  const magnitudeData = {
    labels: frequencies,
    datasets: [
      {
        label: 'S11 (Return Loss)',
        data: s11_dB,
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'S21 (Insertion Loss)',
        data: s21_dB,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  };

  const phaseData = {
    labels: frequencies,
    datasets: [
      {
        label: 'S11 Phase',
        data: s11_phase,
        borderColor: '#f44336',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'S21 Phase',
        data: s21_phase,
        borderColor: '#2196F3',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  };

  const smithChartData = {
    datasets: [
      {
        label: 'S11',
        data: smithData,
        borderColor: '#f44336',
        backgroundColor: '#f44336',
        pointRadius: 2,
        showLine: true,
        tension: 0.1,
      },
    ],
  };

  const magnitudeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'S-Parameters (Magnitude)',
        font: { size: 16, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Frequency (GHz)' },
        ticks: { maxTicksLimit: 10 },
      },
      y: {
        title: { display: true, text: 'Magnitude (dB)' },
      },
    },
  };

  const phaseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'S-Parameters (Phase)',
        font: { size: 16, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Frequency (GHz)' },
        ticks: { maxTicksLimit: 10 },
      },
      y: {
        title: { display: true, text: 'Phase (degrees)' },
        min: -180,
        max: 180,
      },
    },
  };

  const smithOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Smith Chart (S11)',
        font: { size: 16, weight: 'bold' as const },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Real' },
        min: -1,
        max: 1,
      },
      y: {
        title: { display: true, text: 'Imaginary' },
        min: -1,
        max: 1,
      },
    },
  };

  // Calculate VSWR and Return Loss at center frequency
  const midIdx = Math.floor(sparameters.s11.length / 2);
  const s11_mid = sparameters.s11[midIdx];
  const s11_mag = ComplexMath.magnitude(s11_mid);
  const returnLoss = -20 * Math.log10(s11_mag);
  const vswr = (1 + s11_mag) / (1 - s11_mag);

  return (
    <div className="instrument-display">
      <div className="instrument-header">
        <h3>📐 Network Analyzer</h3>
        <div className="instrument-settings">
          <span>Mode: {displayMode.toUpperCase()}</span>
        </div>
      </div>

      <div className="chart-container">
        {displayMode === 'magnitude' && <Line data={magnitudeData} options={magnitudeOptions} />}
        {displayMode === 'phase' && <Line data={phaseData} options={phaseOptions} />}
        {displayMode === 'smith' && <Scatter data={smithChartData} options={smithOptions} />}
      </div>

      <div className="instrument-info">
        <div className="info-item">
          <span className="label">Return Loss:</span>
          <span className="value">{returnLoss.toFixed(2)} dB</span>
        </div>
        <div className="info-item">
          <span className="label">VSWR:</span>
          <span className="value">{vswr.toFixed(2)}:1</span>
        </div>
        <div className="info-item">
          <span className="label">Frequency Points:</span>
          <span className="value">{sparameters.frequency.length}</span>
        </div>
      </div>
    </div>
  );
}
