import { useState } from 'react';
import SpectrumAnalyzerDisplay from './instruments/SpectrumAnalyzerDisplay';
import NetworkAnalyzerDisplay from './instruments/NetworkAnalyzerDisplay';
import PowerMeterDisplay from './instruments/PowerMeterDisplay';
import { SimulationResult } from '../simulation/RFSimulator';
import { ComplexMath } from '../models/Component';
import './InstrumentsPanel.css';

interface InstrumentsPanelProps {
  simulationResults: SimulationResult | null;
}

export default function InstrumentsPanel({ simulationResults }: InstrumentsPanelProps) {
  const [activeInstrument, setActiveInstrument] = useState<'spectrum' | 'network' | 'power'>('spectrum');
  const [networkMode, setNetworkMode] = useState<'magnitude' | 'phase' | 'smith'>('magnitude');

  if (!simulationResults || !simulationResults.success) {
    return (
      <div className="instruments-panel">
        <div className="panel-header">
          <h3>Virtual Instruments</h3>
        </div>
        <div className="empty-state">
          <p>Run a simulation to view instrument measurements</p>
        </div>
      </div>
    );
  }

  // Prepare spectrum analyzer data
  const spectrumData = {
    frequency: simulationResults.frequencies,
    power: simulationResults.frequencies.map((freq, idx) => {
      const s21 = simulationResults.sparameters.s21[idx];
      const s21_mag = ComplexMath.magnitude(s21);
      return 20 * Math.log10(s21_mag);
    }),
  };

  const spectrumSettings = {
    startFrequency: simulationResults.frequencies[0],
    stopFrequency: simulationResults.frequencies[simulationResults.frequencies.length - 1],
    rbw: 1e6, // 1 MHz
    referenceLevel: 10, // 10 dBm
  };

  // Get power meter data (from first measurement device)
  const powerMeterData = Array.from(simulationResults.powerLevels.entries())[0];
  const powerMeterPower = powerMeterData ? powerMeterData[1] : -30;
  const midFreq = simulationResults.frequencies[Math.floor(simulationResults.frequencies.length / 2)];

  return (
    <div className="instruments-panel">
      <div className="panel-header">
        <h3>Virtual Instruments</h3>
        <div className="instrument-tabs">
          <button
            className={`tab-btn ${activeInstrument === 'spectrum' ? 'active' : ''}`}
            onClick={() => setActiveInstrument('spectrum')}
          >
            📉 Spectrum
          </button>
          <button
            className={`tab-btn ${activeInstrument === 'network' ? 'active' : ''}`}
            onClick={() => setActiveInstrument('network')}
          >
            📐 Network
          </button>
          <button
            className={`tab-btn ${activeInstrument === 'power' ? 'active' : ''}`}
            onClick={() => setActiveInstrument('power')}
          >
            📊 Power
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeInstrument === 'spectrum' && (
          <SpectrumAnalyzerDisplay data={spectrumData} settings={spectrumSettings} />
        )}

        {activeInstrument === 'network' && (
          <>
            <div className="network-controls">
              <button
                className={`mode-btn ${networkMode === 'magnitude' ? 'active' : ''}`}
                onClick={() => setNetworkMode('magnitude')}
              >
                Magnitude
              </button>
              <button
                className={`mode-btn ${networkMode === 'phase' ? 'active' : ''}`}
                onClick={() => setNetworkMode('phase')}
              >
                Phase
              </button>
              <button
                className={`mode-btn ${networkMode === 'smith' ? 'active' : ''}`}
                onClick={() => setNetworkMode('smith')}
              >
                Smith Chart
              </button>
            </div>
            <NetworkAnalyzerDisplay
              sparameters={simulationResults.sparameters}
              displayMode={networkMode}
            />
          </>
        )}

        {activeInstrument === 'power' && (
          <PowerMeterDisplay
            power={powerMeterPower}
            frequency={midFreq}
            accuracy={0.5}
          />
        )}
      </div>
    </div>
  );
}
