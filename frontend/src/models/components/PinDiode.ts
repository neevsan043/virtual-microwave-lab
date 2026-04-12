import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class PinDiode extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'pin_diode', 'PIN Diode', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequency: 2.4e9,       // Hz
      forwardResistance: 2,   // Ohms (RF "on" resistance)
      reverseCapacitance: 0.2,// pF (RF "off" capacitance)
      biasCurrentFwd: 20,     // mA (forward)
      breakdownVoltage: 100,  // V
      carrierLifetime: 50,    // ns (intrinsic region)
      switchingSpeed: 10,     // ns
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_anode`,   name: 'Anode',   type: 'input',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_cathode`, name: 'Cathode', type: 'output', position: { x: 80, y: 15 } },
      { id: `${this.id}_bias`,    name: 'Bias DC', type: 'input',  position: { x: 0,  y: 40 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const Rf = this.parameters.forwardResistance as number;
    const Z0 = 50;
    const s11Fwd = (Rf - Z0) / (Rf + Z0);
    const s11 = frequency.map(() => complex(s11Fwd, 0));
    const s21 = frequency.map(() => complex(1 - Math.abs(s11Fwd), 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['signal_generator', 'attenuator', 'bias_tee', 'microstrip_line', 'coaxial_line'];
  }
}
