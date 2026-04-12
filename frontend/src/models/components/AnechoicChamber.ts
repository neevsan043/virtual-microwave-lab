import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class AnechoicChamber extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'anechoic_chamber', 'Anechoic Chamber', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      frequencyMin: 200e6,     // Hz (lowest usable)
      frequencyMax: 40e9,      // Hz
      dimensions_m: '6x4x4',  // L x W x H in meters
      absorberDepth: 0.3,      // m
      reflectivityLevel: -40,  // dB (quality of absorption)
      shieldingEffectiveness: 100, // dB
    };
  }

  initializePorts(): Port[] {
    return [
      { id: `${this.id}_tx_ant`, name: 'TX Antenna', type: 'input',  position: { x: 0,  y: 15 } },
      { id: `${this.id}_rx_ant`, name: 'RX Antenna', type: 'output', position: { x: 80, y: 15 } },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    const s11 = frequency.map(() => complex(-0.3, 0));
    const s21 = frequency.map(() => complex(0.5, 0)); // free-space path loss simplified
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return ['horn_antenna', 'dipole_antenna', 'patch_antenna', 'yagi_antenna', 'parabolic_antenna', 'antenna_positioner'];
  }
}
