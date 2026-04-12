import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class CpwLine extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'cpw_line', 'Coplanar Waveguide (CPW)', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      impedance: 50,             // Ohms
      length: 10,                // mm
      gapWidth: 0.1,             // mm (gap between signal and ground)
      signalWidth: 0.5,          // mm
      dielectricConstant: 10.2,  // Rogers RO3010
      substrateHeight: 0.635,    // mm
      lossTangent: 0.0023,
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_in`,  name: 'In',  type: 'input',  position: { x: 0,  y: 25 } },
      { id: `${this.id}_out`, name: 'Out', type: 'output', position: { x: 80, y: 25 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const er = this.parameters.dielectricConstant as number;
    const tanD = this.parameters.lossTangent as number;
    const length = (this.parameters.length as number) / 1000;

    const s11 = frequency.map(() => complex(0.02, 0));
    const s21 = frequency.map((f) => {
      const erEff = (er + 1) / 2;
      const beta = 2 * Math.PI * f * Math.sqrt(erEff) / 3e8;
      const alpha = Math.PI * f * Math.sqrt(erEff) * tanD / (3e8 * 8.686);
      const lossLinear = Math.exp(-alpha * length);
      return complex(lossLinear * Math.cos(-beta * length), lossLinear * Math.sin(-beta * length));
    });
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['microstrip_line', 'stripline', 'sma_connector', 'amplifier', 'mixer', 'bandpass_filter'];
  }
}
