import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class RtDuroidSubstrate extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'rt_duroid_substrate', 'RT/duroid 5880 Substrate', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      dielectricConstant: 2.2,   // εr (PTFE/glass-fibre)
      lossTangent: 0.0009,        // at 10 GHz (very low loss)
      thickness: 0.787,           // mm
      conductorThickness: 0.035,  // mm
      thermalConductivity: 0.20,  // W/(m·K)
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
    return ['microstrip_line', 'stripline', 'cpw_line', 'patch_antenna', 'horn_antenna'];
  }
}
