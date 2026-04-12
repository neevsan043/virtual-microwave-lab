import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class LoopAntenna extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'loop_antenna', 'Loop Antenna', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 100e6,    // Hz
      loopDiameter: 0.48,  // m (λ/2 circumference)
      numTurns: 1,
      gain: 3.5,           // dBi
      impedance: 50,       // Ohms (with matching network)
      directivity: 'bidirectional',
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_feed`, name: 'Feed', type: 'bidirectional', position: { x: 40, y: 50 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const fc = this.parameters.frequency as number;
    const s11 = frequency.map((f) => {
      const df = Math.abs(f - fc) / (fc * 0.1);
      return complex(-1 / (1 + df * df), 0);
    });
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'coaxial_line', 'balun', 'spectrum_analyzer', 'field_strength_meter'];
  }
}
