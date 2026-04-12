import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class SchottkyDiode extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'schottky_diode', 'Schottky Diode', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 10e9,         // Hz
      junctionCapacitance: 0.1,// pF
      seriesResistance: 5,     // Ohms
      idealityFactor: 1.1,
      saturationCurrent: 1e-12,// A
      breakdownVoltage: 15,    // V
      cutoffFrequency: 100e9,  // Hz (Schottky advantage)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_anode`,   name: 'Anode',   type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_cathode`, name: 'Cathode', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const Rs = this.parameters.seriesResistance as number;
    const Cj = (this.parameters.junctionCapacitance as number) * 1e-12;
    const s11 = frequency.map((f) => {
      const Xc = 1 / (2 * Math.PI * f * Cj);
      const Z = { r: Rs, x: -Xc };
      const denom = (Z.r + 50) * (Z.r + 50) + Z.x * Z.x;
      return complex(((Z.r - 50) * (Z.r + 50) + Z.x * Z.x) / denom, 2 * 50 * Z.x / denom);
    });
    const s21 = frequency.map(() => complex(0.5, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['mixer', 'detector', 'bias_tee', 'microstrip_line', 'coaxial_line', 'signal_generator'];
  }
}
