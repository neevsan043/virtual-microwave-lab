import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class VaractorDiode extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'varactor_diode', 'Varactor Diode', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 2.4e9,         // Hz
      capacitanceAtZero: 5,     // pF (at 0V reverse)
      capacitanceAtMax: 1,      // pF (at max reverse bias)
      maxReverseBias: 12,       // V
      seriesResistance: 1,      // Ohms
      qualityFactor: 100,       // at 1 GHz
      gradingCoefficient: 0.5,  // junction grading (abrupt = 0.5, hyper-abrupt > 0.5)
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_anode`,   name: 'Anode (GND)',  type: 'input',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_cathode`, name: 'Cathode (RF)', type: 'output', position: { x: 80, y: 15 } },
      { id: `${this.id}_ctrl`,    name: 'Vtune',        type: 'input',  position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const C = (this.parameters.capacitanceAtZero as number) * 1e-12;
    const Rs = this.parameters.seriesResistance as number;
    const s11 = frequency.map((f) => {
      const Xc = 1 / (2 * Math.PI * f * C);
      void Rs; void Xc; // capacitive load — model as reflective port
      return complex(-0.9, 0); // capacitive (mostly reflecting)
    });
    const s21 = frequency.map(() => complex(0.1, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['vco', 'oscillator', 'bandpass_filter', 'phase_shifter', 'bias_tee', 'microstrip_line'];
  }
}
