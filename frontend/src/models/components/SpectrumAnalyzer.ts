import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class SpectrumAnalyzer extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'spectrum_analyzer', 'Spectrum Analyzer', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      startFrequency: 1e9, // 1 GHz
      stopFrequency: 3e9, // 3 GHz
      rbw: 1e6, // 1 MHz resolution bandwidth
      vbw: 100e3, // 100 kHz video bandwidth
      referenceLevel: 0, // 0 dBm
      attenuation: 10, // 10 dB input attenuation
      sweepTime: 0.1, // 100 ms
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_in`,
        name: 'RF In',
        type: 'input',
        position: { x: 0, y: 40 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    // Spectrum analyzer acts as a matched load
    const s11 = frequency.map(() => complex(0.1, 0)); // Good match
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = frequency.map(() => complex(0, 0));
    const s22 = frequency.map(() => complex(0, 0));

    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'signal_generator',
      'resistor',
      'transmission_line',
      'amplifier',
      'mixer',
    ];
  }

  generateSpectrum(inputSignals: { frequency: number; power_dBm: number }[]): { frequency: number; power_dBm: number }[] {
    const startFreq = this.parameters.startFrequency as number;
    const stopFreq = this.parameters.stopFrequency as number;
    const rbw = this.parameters.rbw as number;
    const attenuation = this.parameters.attenuation as number;

    // Filter signals within frequency range
    const visibleSignals = inputSignals.filter(
      (sig) => sig.frequency >= startFreq && sig.frequency <= stopFreq
    );

    // Add noise floor
    const noiseFloor = -120; // dBm
    const spectrum: { frequency: number; power_dBm: number }[] = [];

    // Generate spectrum points
    const numPoints = 1001;
    for (let i = 0; i < numPoints; i++) {
      const freq = startFreq + (i / (numPoints - 1)) * (stopFreq - startFreq);
      let power = noiseFloor;

      // Check if any signal is within RBW of this frequency
      visibleSignals.forEach((sig) => {
        if (Math.abs(sig.frequency - freq) < rbw / 2) {
          power = Math.max(power, sig.power_dBm - attenuation);
        }
      });

      spectrum.push({ frequency: freq, power_dBm: power });
    }

    return spectrum;
  }
}
