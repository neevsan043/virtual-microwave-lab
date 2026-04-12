import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class Fr4Substrate extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'fr4_substrate', 'FR4 Substrate', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      dielectricConstant: 4.4,   // εr (varies 4.0–4.8)
      lossTangent: 0.02,          // at 1 GHz
      thickness: 1.6,             // mm (standard PCB)
      conductorThickness: 0.035,  // mm (1 oz copper)
      thermalConductivity: 0.30,  // W/(m·K)
      tempRating: 130,            // °C (Tg)
    };
  }

  initializePorts(): Port[] {
    return [];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(0, 0));
    const s21 = frequency.map(() => complex(1, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['microstrip_line', 'stripline', 'cpw_line', 'patch_antenna'];
  }
}
