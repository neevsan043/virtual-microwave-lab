import { Component, complex } from '../Component';
import { ComponentParameters, Port, SParameters } from '../../types';

export class DcPowerSupply extends Component {
  constructor(id: string, position = { x: 0, y: 0 }) {
    super(id, 'dc_power_supply', 'DC Power Supply', position);
  }

  getDefaultParameters(): ComponentParameters {
    return {
      voltage: 12,       // Volts (e.g. 12V rail)
      currentLimit: 5,   // Amperes (max 5A)
      rippleVoltage: 10, // mV ripple
    };
  }

  initializePorts(): Port[] {
    return [
      {
        id: `${this.id}_vcc`,
        name: 'VCC',
        type: 'output',
        position: { x: 80, y: 10 },
      },
      {
        id: `${this.id}_gnd`,
        name: 'GND',
        type: 'output',
        position: { x: 80, y: 40 },
      },
    ];
  }

  getSParameters(frequency: number[]): SParameters {
    // DC power supply is not an RF component; return near-ideal termination
    const s11 = frequency.map(() => complex(-0.01, 0));
    const s21 = frequency.map(() => complex(0, 0));
    const s12 = s21;
    const s22 = s11;
    return { frequency, s11, s21, s12, s22 };
  }

  getCompatiblePortTypes(): string[] {
    return [
      'amplifier',
      'rf_power_amplifier',
      'multimeter',
    ];
  }
}
