import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import './InstrumentDisplay.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SpectrumData {
  frequency: number[];
  power: number[];
}

interface SpectrumAnalyzerDisplayProps {
  data: SpectrumData;
  settings: {
    startFrequency: number;
    stopFrequency: number;
    rbw: number;
    referenceLevel: number;
  };
}

export default function SpectrumAnalyzerDisplay({ data, settings }: SpectrumAnalyzerDisplayProps) {
  const chartData = {
    labels: data.frequency.map(f => (f / 1e9).toFixed(3)),
    datasets: [
      {
        label: 'Power Spectrum',
        data: data.power,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Spectrum Analyzer',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.parsed.y.toFixed(2)} dBm`;
          },
          title: (context: any) => {
            return `${context[0].label} GHz`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Frequency (GHz)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Power (dBm)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        min: settings.referenceLevel - 100,
        max: settings.referenceLevel,
      },
    },
  };

  // Find peak
  const peakIdx = data.power.reduce((maxIdx, val, idx, arr) => 
    val > arr[maxIdx] ? idx : maxIdx, 0
  );
  const peakFreq = data.frequency[peakIdx];
  const peakPower = data.power[peakIdx];

  return (
    <div className="instrument-display">
      <div className="instrument-header">
        <h3>📉 Spectrum Analyzer</h3>
        <div className="instrument-settings">
          <span>RBW: {(settings.rbw / 1e6).toFixed(1)} MHz</span>
          <span>Span: {((settings.stopFrequency - settings.startFrequency) / 1e9).toFixed(2)} GHz</span>
        </div>
      </div>

      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>

      <div className="instrument-info">
        <div className="info-item">
          <span className="label">Peak Frequency:</span>
          <span className="value">{(peakFreq / 1e9).toFixed(3)} GHz</span>
        </div>
        <div className="info-item">
          <span className="label">Peak Power:</span>
          <span className="value">{peakPower.toFixed(2)} dBm</span>
        </div>
        <div className="info-item">
          <span className="label">Reference Level:</span>
          <span className="value">{settings.referenceLevel} dBm</span>
        </div>
      </div>
    </div>
  );
}
