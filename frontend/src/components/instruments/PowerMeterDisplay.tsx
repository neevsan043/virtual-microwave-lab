import { useState, useEffect } from 'react';
import './InstrumentDisplay.css';

interface PowerMeterDisplayProps {
  power: number; // Power in dBm
  frequency: number;
  accuracy: number;
}

export default function PowerMeterDisplay({ power, frequency, accuracy }: PowerMeterDisplayProps) {
  const [displayPower, setDisplayPower] = useState(power);

  // Simulate measurement noise
  useEffect(() => {
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * accuracy * 2;
      setDisplayPower(power + noise);
    }, 500);

    return () => clearInterval(interval);
  }, [power, accuracy]);

  // Convert dBm to mW
  const powerMW = Math.pow(10, displayPower / 10);

  // Determine power level indicator
  const getPowerLevel = () => {
    if (displayPower < -30) return 'low';
    if (displayPower < 0) return 'medium';
    return 'high';
  };

  const powerLevel = getPowerLevel();

  return (
    <div className="instrument-display power-meter">
      <div className="instrument-header">
        <h3>📊 Power Meter</h3>
        <div className="instrument-settings">
          <span>Accuracy: ±{accuracy} dB</span>
        </div>
      </div>

      <div className="power-display">
        <div className="power-reading">
          <div className="power-value-large">
            {displayPower.toFixed(2)}
          </div>
          <div className="power-unit">dBm</div>
        </div>

        <div className="power-bar-container">
          <div className={`power-bar ${powerLevel}`}>
            <div 
              className="power-bar-fill"
              style={{ 
                width: `${Math.min(100, Math.max(0, (displayPower + 40) * 2))}%` 
              }}
            />
          </div>
          <div className="power-bar-labels">
            <span>-40</span>
            <span>-20</span>
            <span>0</span>
            <span>+10</span>
          </div>
        </div>
      </div>

      <div className="instrument-info">
        <div className="info-item">
          <span className="label">Power (mW):</span>
          <span className="value">{powerMW.toFixed(4)} mW</span>
        </div>
        <div className="info-item">
          <span className="label">Frequency:</span>
          <span className="value">{(frequency / 1e9).toFixed(3)} GHz</span>
        </div>
        <div className="info-item">
          <span className="label">Status:</span>
          <span className={`value status-${powerLevel}`}>
            {powerLevel.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="power-stats">
        <div className="stat-card">
          <div className="stat-label">Peak</div>
          <div className="stat-value">{(displayPower + 0.5).toFixed(2)} dBm</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average</div>
          <div className="stat-value">{displayPower.toFixed(2)} dBm</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Min</div>
          <div className="stat-value">{(displayPower - 0.5).toFixed(2)} dBm</div>
        </div>
      </div>
    </div>
  );
}
