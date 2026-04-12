import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

/** Substrate material component — placed to define the PCB substrate used by other planar components */
export class RogersSubstrate extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'rogers_substrate', 'Rogers RO4003C Substrate', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      dielectricConstant: 3.55,  // εr at 10 GHz
      lossTangent: 0.0027,        // at 10 GHz
      thickness: 0.508,           // mm
      conductorThickness: 0.035,  // mm (1 oz copper)
      thermalConductivity: 0.64,  // W/(m·K)
      coeffThermalExpansion: 14,  // ppm/°C
    };
  }

  initializePorts(): Port[] {
    return [];  // Substrate has no RF ports — it defines material properties
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
